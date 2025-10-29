import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import {
  CircuitOpenException,
  TooManyRequestsException,
} from '../circuit-breaker/circuit-breaker.types';

/**
 * Service configuration interface
 */
interface ServiceConfig {
  name: string;
  url: string;
  basePath: string;
  port: number;
}

/**
 * Proxy Service - Routes requests to appropriate microservices
 * Handles dynamic routing, error handling, and request/response transformation
 */
@Injectable()
export class ProxyService {
  private readonly services: Map<string, ServiceConfig> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly metricsService: MetricsService,
  ) {
    this.initializeServices();
  }

  /**
   * Initialize microservices configuration
   * Reads service URLs from environment variables with validation
   */
  private initializeServices(): void {
    const services: ServiceConfig[] = [
      {
        name: 'identity',
        url: this.getServiceUrl('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
        basePath: '/api/v1/auth',
        port: 3001,
      },
      {
        name: 'sports',
        url: this.getServiceUrl('SPORTS_SERVICE_URL', 'http://localhost:3002'),
        basePath: '/api/v1/sports',
        port: 3002,
      },
      {
        name: 'clubs',
        url: this.getServiceUrl('CLUB_MANAGEMENT_URL', 'http://localhost:3003'),
        basePath: '/api/v1/clubs',
        port: 3003,
      },
      {
        name: 'communication',
        url: this.getServiceUrl('COMMUNICATION_SERVICE_URL', 'http://localhost:3004'),
        basePath: '/api/v1/communication',
        port: 3004,
      },
    ];

    services.forEach((service) => {
      this.services.set(service.name, service);
      this.logger.info(`Registered service: ${service.name} -> ${service.url}`, 'ProxyService');
    });

    this.logger.info(`Initialized ${this.services.size} microservices`, 'ProxyService');
  }

  /**
   * Get service URL from environment with validation and fallback
   */
  private getServiceUrl(envKey: string, defaultUrl: string): string {
    const url = this.configService.get<string>(envKey);

    if (!url) {
      this.logger.warn(`${envKey} not configured, using default: ${defaultUrl}`, 'ProxyService');
      return defaultUrl;
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.startsWith('http')) {
        throw new Error('URL must use HTTP or HTTPS protocol');
      }
      return url;
    } catch {
      this.logger.error(
        `Invalid URL for ${envKey}: ${url}. Using default: ${defaultUrl}`,
        'ProxyService',
      );
      return defaultUrl;
    }
  }

  /**
   * Route request to appropriate microservice based on path
   */
  async routeRequest(
    correlationId: string,
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<AxiosResponse> {
    // Extract service name from path (e.g., /api/auth/* -> identity service)
    const serviceName = this.extractServiceName(path);

    if (!serviceName) {
      throw new Error(`Cannot determine target service for path: ${path}`);
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    // Build target URL
    const targetUrl = this.buildTargetUrl(service, path);
    const requestHeaders = this.buildHeaders(correlationId, headers);

    try {
      this.logger.logProxyRequest(correlationId, serviceName, method, targetUrl);

      // Increment active requests
      this.metricsService.incrementActiveRequests(serviceName);

      // Execute request through circuit breaker
      const response = await this.circuitBreakerService.executeWithBreaker(
        serviceName,
        async () => {
          const startTime = Date.now();
          let axiosResponse: AxiosResponse;

          switch (method.toUpperCase()) {
            case 'GET':
              axiosResponse = await lastValueFrom(
                this.httpService.get(targetUrl, {
                  headers: requestHeaders,
                }),
              );
              break;

            case 'POST':
              axiosResponse = await lastValueFrom(
                this.httpService.post(targetUrl, body, {
                  headers: requestHeaders,
                }),
              );
              break;

            case 'PUT':
              axiosResponse = await lastValueFrom(
                this.httpService.put(targetUrl, body, {
                  headers: requestHeaders,
                }),
              );
              break;

            case 'DELETE':
              axiosResponse = await lastValueFrom(
                this.httpService.delete(targetUrl, {
                  headers: requestHeaders,
                }),
              );
              break;

            case 'PATCH':
              axiosResponse = await lastValueFrom(
                this.httpService.patch(targetUrl, body, {
                  headers: requestHeaders,
                }),
              );
              break;

            default:
              throw new Error(`Unsupported HTTP method: ${method}`);
          }

          const responseTime = Date.now() - startTime;
          this.logger.logProxyResponse(
            correlationId,
            serviceName,
            axiosResponse.status,
            responseTime,
          );

          // Record metrics
          this.metricsService.recordHttpRequest(
            method.toUpperCase(),
            path,
            axiosResponse.status,
            serviceName,
            responseTime,
          );

          return axiosResponse;
        },
      );

      // Decrement active requests
      this.metricsService.decrementActiveRequests(serviceName);

      return response;
    } catch (error) {
      // Decrement active requests on error
      this.metricsService.decrementActiveRequests(serviceName);

      // Handle circuit breaker exceptions
      if (error instanceof CircuitOpenException) {
        this.logger.warn(
          `Circuit breaker OPEN for ${serviceName}. Next attempt: ${error.nextAttemptTime.toISOString()}`,
          'ProxyService',
        );
        // Record error metric
        this.metricsService.recordHttpError(method.toUpperCase(), path, 'CircuitOpen', serviceName);
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: `Service "${serviceName}" is temporarily unavailable`,
            error: 'Circuit Breaker Open',
            nextRetryAt: error.nextAttemptTime.toISOString(),
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error instanceof TooManyRequestsException) {
        this.logger.warn(`Too many requests to ${serviceName} in HALF_OPEN state`, 'ProxyService');
        // Record error metric
        this.metricsService.recordHttpError(
          method.toUpperCase(),
          path,
          'TooManyRequests',
          serviceName,
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many requests to "${serviceName}" service`,
            error: 'Circuit Breaker Half-Open',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.logError(correlationId, error, `routing to ${serviceName}`);
      // Record generic error
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      this.metricsService.recordHttpError(method.toUpperCase(), path, errorType, serviceName);
      throw error;
    }
  }

  /**
   * Extract service name from request path
   */
  private extractServiceName(path: string): string | null {
    const segments = path.split('/').filter(Boolean);

    if (segments.length < 2) {
      return null;
    }

    // Map path segments to service names
    const pathToService: Record<string, string> = {
      auth: 'identity',
      identity: 'identity',
      sports: 'sports',
      athletes: 'sports',
      training: 'sports',
      performance: 'sports',
      clubs: 'clubs',
      'club-management': 'clubs',
      communication: 'communication',
      notifications: 'communication',
      messages: 'communication',
    };

    // Check first meaningful segment after /api
    for (const segment of segments) {
      if (pathToService[segment]) {
        return pathToService[segment];
      }
    }

    return null;
  }

  /**
   * Build target URL by replacing base path with service-specific path
   */
  private buildTargetUrl(service: ServiceConfig, originalPath: string): string {
    // Remove /api prefix and build service URL
    const pathWithoutApi = originalPath.startsWith('/api')
      ? originalPath.substring(4)
      : originalPath;

    return `${service.url}${pathWithoutApi}`;
  }

  /**
   * Build request headers with correlation ID and forwarded headers
   */
  private buildHeaders(
    correlationId: string,
    originalHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Correlation-ID': correlationId,
      'X-Forwarded-By': 'api-gateway',
      'Content-Type': 'application/json',
    };

    // Forward important headers
    if (originalHeaders) {
      const forwardedHeaders = ['authorization', 'accept', 'accept-language', 'user-agent'];

      forwardedHeaders.forEach((header) => {
        const value = originalHeaders[header] || originalHeaders[header.toUpperCase()];
        if (value) {
          headers[header] = value;
        }
      });
    }

    return headers;
  }

  /**
   * Get all registered services
   */
  getServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  /**
   * Get service by name
   */
  getService(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }
}
