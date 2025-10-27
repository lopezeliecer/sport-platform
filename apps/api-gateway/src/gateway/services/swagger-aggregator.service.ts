import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { LoggerService } from './logger.service';

/**
 * Type definitions for OpenAPI/Swagger structures
 */
interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: Array<Record<string, unknown>>;
  parameters?: unknown[];
}

interface OpenAPIPaths {
  [path: string]: {
    [method: string]: OpenAPIOperation;
  };
}

/**
 * Swagger Aggregator Service - Combines Swagger documentation from all microservices
 * Provides unified API documentation endpoint with intelligent caching and error handling
 */
@Injectable()
export class SwaggerAggregatorService {
  private readonly services = [
    {
      name: 'Identity Service',
      key: 'identity',
      url: this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
      docsEndpoint: '/api/docs-json',
      port: 3001,
    },
    {
      name: 'Sports Service',
      key: 'sports',
      url: this.configService.get('SPORTS_SERVICE_URL', 'http://localhost:3002'),
      docsEndpoint: '/api/docs-json',
      port: 3002,
    },
    {
      name: 'Club Management',
      key: 'clubs',
      url: this.configService.get('CLUB_MANAGEMENT_URL', 'http://localhost:3003'),
      docsEndpoint: '/api/docs-json',
      port: 3003,
    },
    {
      name: 'Communication Service',
      key: 'communication',
      url: this.configService.get('COMMUNICATION_SERVICE_URL', 'http://localhost:3004'),
      docsEndpoint: '/api/docs-json',
      port: 3004,
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
      console.error(error);
      this.logger.warn(
        `Could not fetch Swagger docs from ${serviceName}`,
        'SwaggerAggregatorService',
      );
      return null;
    }
  }

  /**
   * Aggregate documentation from multiple services with improved path and schema handling
   */
  private aggregateDocs(
    allDocs: ({ service: string; docs: Record<string, unknown> } | null)[],
  ): Record<string, unknown> {
    const base = {
      openapi: '3.0.0',
      info: {
        title: 'Sports Platform - Unified API Documentation',
        description: 'Complete API documentation aggregated from all microservices',
        version: '1.0.0',
        contact: {
          name: 'Sports Platform Team',
          url: 'https://sports-platform.com',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local Development Gateway',
          variables: {
            protocol: {
              default: 'http',
            },
            host: {
              default: 'localhost:3000',
            },
          },
        },
        {
          url: 'https://api.sports-platform.com',
          description: 'Production Gateway',
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
            description: 'JWT access token',
          },
        },
      },
      tags: [],
    };

    const paths: Record<string, unknown> = {};
    const schemas: Record<string, unknown> = {};
    const tags: Array<{ name: string; description: string; 'x-service'?: string }> = [];
    const tagNames = new Set<string>();
    const servicesByTag: Map<string, string> = new Map();

    // Process each service's documentation
    allDocs.forEach((item) => {
      if (!item) {
        return;
      }

      const { service, docs } = item;
      const serviceKey = this.services.find((s) => s.name === service)?.key || 'unknown';
      const docPaths = (docs.paths as OpenAPIPaths) || {};

      // Process paths - Keep original paths from each service
      if (docPaths && Object.keys(docPaths).length > 0) {
        Object.entries(docPaths).forEach(([path, methods]) => {
          // Keep paths as-is, they should be routed through gateway with /api/v1/service/* prefix
          if (!paths[path]) {
            paths[path] = {};
          }

          // Merge all HTTP methods for this path
          if (typeof methods === 'object' && methods !== null) {
            Object.entries(methods).forEach(([method, operation]) => {
              if (paths[path][method]) {
                this.logger.warn(
                  `SwaggerAggregator: Conflict detected for path "${path}" and method "${method}" between services. Overwriting previous definition.`,
                );
              }
              paths[path][method] = operation;
            });

            // Track which methods reference which tags
            Object.values(methods as Record<string, OpenAPIOperation>).forEach((operation) => {
              if (operation?.tags?.length > 0) {
                operation.tags.forEach((tag: string) => {
                  servicesByTag.set(tag, serviceKey);
                });
              }
            });
          }
        });
      }

      // Process schemas with namespace to avoid conflicts
      const components = docs.components as { schemas?: Record<string, unknown> };
      if (components?.schemas) {
        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
          const namespacedName = `${this.capitalizeService(serviceKey)}_${schemaName}`;
          schemas[namespacedName] = schema;
        });
      }

      // Process tags with service information
      const docTags = docs.tags as Array<{ name: string; description?: string }>;
      if (Array.isArray(docTags)) {
        docTags.forEach((tag) => {
          const uniqueTagName = this.formatServiceTag(serviceKey, tag.name);
          if (!tagNames.has(uniqueTagName)) {
            tags.push({
              name: uniqueTagName,
              description: tag.description || '',
              'x-service': serviceKey,
            });
            tagNames.add(uniqueTagName);
          }
        });
      }
    });

    // Add service status tags
    this.services.forEach((service) => {
      const statusTagName = `SERVICE: ${service.key.toUpperCase()}`;
      if (!tagNames.has(statusTagName)) {
        tags.push({
          name: statusTagName,
          description: `Endpoints from ${service.name}`,
          'x-service': service.key,
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
   * Format service tag with consistent naming convention
   */
  private formatServiceTag(serviceKey: string, tagName: string): string {
    return `[${serviceKey.toUpperCase()}] ${tagName}`;
  }

  /**
   * Capitalize service name for schema naming
   */
  private capitalizeService(service: string): string {
    return service
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
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
