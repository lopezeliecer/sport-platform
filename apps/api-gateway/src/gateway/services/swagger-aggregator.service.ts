import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { LoggerService } from './logger.service';

/**
 * Swagger Aggregator Service - Combines Swagger documentation from all microservices
 * Provides unified API documentation endpoint
 */
@Injectable()
export class SwaggerAggregatorService {
  private readonly services = [
    {
      name: 'Identity Service',
      url: this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
      docsEndpoint: '/api/docs-json',
    },
    {
      name: 'Sports Service',
      url: this.configService.get('SPORTS_SERVICE_URL', 'http://localhost:3002'),
      docsEndpoint: '/api/docs-json',
    },
    {
      name: 'Club Management',
      url: this.configService.get('CLUB_MANAGEMENT_URL', 'http://localhost:3003'),
      docsEndpoint: '/api/docs-json',
    },
    {
      name: 'Communication Service',
      url: this.configService.get('COMMUNICATION_SERVICE_URL', 'http://localhost:3004'),
      docsEndpoint: '/api/docs-json',
    },
  ];

  private cachedDocs: Record<string, unknown> | null = null;
  private lastFetch = 0;
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get aggregated Swagger documentation
   */
  async getAggregatedDocs(): Promise<Record<string, unknown>> {
    // Return cached docs if available and fresh
    if (this.cachedDocs && Date.now() - this.lastFetch < this.cacheDuration) {
      return this.cachedDocs;
    }

    try {
      const docsPromises = this.services.map((service) =>
        this.fetchServiceDocs(service.name, service.url, service.docsEndpoint),
      );

      const allDocs = await Promise.all(docsPromises);

      // Aggregate all documentation
      const aggregated = this.aggregateDocs(allDocs);
      this.cachedDocs = aggregated;
      this.lastFetch = Date.now();

      return aggregated;
    } catch (error) {
      this.logger.error(
        `Failed to aggregate Swagger docs: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
        'SwaggerAggregatorService',
      );

      // Return cached docs even if expired
      if (this.cachedDocs) {
        this.logger.warn('Returning expired cached Swagger docs', 'SwaggerAggregatorService');
        return this.cachedDocs;
      }

      // Return minimal docs structure
      return this.getMinimalDocs();
    }
  }

  /**
   * Fetch Swagger docs from a specific service
   */
  private async fetchServiceDocs(
    serviceName: string,
    baseUrl: string,
    docsEndpoint: string,
  ): Promise<{ service: string; docs: Record<string, unknown> } | null> {
    try {
      const docsUrl = `${baseUrl}${docsEndpoint}`;
      const response = await lastValueFrom(
        this.httpService.get(docsUrl, {
          timeout: 5000,
        }),
      );

      return {
        service: serviceName,
        docs: response?.data as Record<string, unknown>,
      };
    } catch (error) {
      this.logger.warn(
        `Could not fetch Swagger docs from ${serviceName}`,
        'SwaggerAggregatorService',
      );
      return null;
    }
  }

  /**
   * Aggregate documentation from multiple services
   */
  private aggregateDocs(
    allDocs: ({ service: string; docs: Record<string, unknown> } | null)[],
  ): Record<string, unknown> {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sports Platform - Aggregated API',
        description: 'Unified API documentation for all microservices',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development',
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [],
    };

    const paths: Record<string, unknown> = {};
    const schemas: Record<string, unknown> = {};
    const tags: Array<{ name: string; description: string }> = [];
    const tagNames = new Set<string>();

    allDocs.forEach((item) => {
      if (!item) {
        return;
      }

      const { service, docs } = item;
      const servicePrefix = `/service/${service.toLowerCase()}`;

      // Process paths
      const docPaths = docs.paths as Record<string, unknown>;
      if (docPaths) {
        Object.entries(docPaths).forEach(([path, methods]) => {
          const newPath = `${servicePrefix}${path}`;
          paths[newPath] = methods;
        });
      }

      // Process schemas
      const components = docs.components as { schemas?: Record<string, unknown> };
      if (components?.schemas) {
        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
          const newSchemaName = `${service}_${schemaName}`;
          schemas[newSchemaName] = schema;
        });
      }

      // Process tags
      const docTags = docs.tags as Array<{ name: string; description?: string }>;
      if (Array.isArray(docTags)) {
        docTags.forEach((tag) => {
          if (!tagNames.has(tag.name)) {
            tags.push({
              name: `[${service}] ${tag.name}`,
              description: tag.description || '',
            });
            tagNames.add(tag.name);
          }
        });
      }
    });

    return {
      ...base,
      paths,
      components: {
        ...base.components,
        schemas,
      },
      tags,
    };
  }

  /**
   * Get minimal documentation structure
   */
  private getMinimalDocs(): Record<string, unknown> {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Sports Platform - API Gateway',
        description: 'API Gateway for the sports platform',
        version: '1.0.0',
      },
      paths: {
        '/api/v1/gateway/health': {
          get: {
            summary: 'Check gateway health',
            responses: {
              '200': {
                description: 'Gateway is healthy',
              },
            },
          },
        },
        '/api/v1/gateway/services/health': {
          get: {
            summary: 'Check all services health',
            responses: {
              '200': {
                description: 'Services health status',
              },
            },
          },
        },
      },
    };
  }

  /**
   * Clear cached documentation
   */
  clearCache(): void {
    this.cachedDocs = null;
    this.lastFetch = 0;
  }
}
