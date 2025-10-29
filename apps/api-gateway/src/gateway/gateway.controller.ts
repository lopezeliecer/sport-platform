import {
  Controller,
  Get,
  All,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
  Post,
  Param,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProxyService } from './services/proxy.service';
import { HealthCheckService } from './services/health-check.service';
import { SwaggerAggregatorService } from './services/swagger-aggregator.service';
import { LoggerService } from './services/logger.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { MetricsService } from './services/metrics.service';

/**
 * Gateway Controller - Handles all incoming API requests
 * Routes requests to appropriate microservices
 * Provides health checks and documentation aggregation
 */
@Controller()
@ApiTags('Gateway')
export class GatewayController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly healthCheckService: HealthCheckService,
    private readonly swaggerAggregatorService: SwaggerAggregatorService,
    private readonly logger: LoggerService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Gateway health check endpoint
   */
  @Get('v1/gateway/health')
  @ApiOperation({ summary: 'Check API Gateway health' })
  @ApiResponse({
    status: 200,
    description: 'Gateway is healthy',
  })
  async gatewayHealth(): Promise<Record<string, unknown>> {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'API Gateway',
      version: '1.0.0',
    };
  }

  /**
   * Check health of all microservices
   */
  @Get('v1/gateway/services/health')
  @ApiOperation({ summary: 'Check health of all microservices' })
  @ApiResponse({
    status: 200,
    description: 'Services health status',
  })
  async servicesHealth(): Promise<Record<string, unknown>> {
    await this.healthCheckService.checkAllServices();
    return this.healthCheckService.getHealthSummary();
  }

  /**
   * Get aggregated Swagger documentation (JSON format)
   */
  @Get('v1/gateway/docs')
  @ApiOperation({ summary: 'Get aggregated API documentation (JSON)' })
  @ApiResponse({
    status: 200,
    description: 'Complete OpenAPI 3.0 specification from all microservices',
  })
  async getAggregatedDocs(): Promise<Record<string, unknown>> {
    return this.swaggerAggregatorService.getAggregatedDocs();
  }

  /**
   * Clear Swagger documentation cache
   */
  @Post('v1/gateway/docs/clear-cache')
  @ApiOperation({ summary: 'Clear aggregated documentation cache' })
  @ApiResponse({
    status: 200,
    description: 'Documentation cache cleared successfully',
  })
  async clearDocsCache(): Promise<Record<string, unknown>> {
    this.swaggerAggregatorService.clearCache();
    return {
      message: 'Swagger documentation cache cleared successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get circuit breaker states for all services
   */
  @Get('v1/gateway/circuit-breakers')
  @ApiOperation({ summary: 'Get circuit breaker states for all services' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker states',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        breakers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              state: { type: 'string', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'] },
              failureCount: { type: 'number' },
              successCount: { type: 'number' },
              lastFailureTime: { type: 'string', nullable: true },
              nextAttemptTime: { type: 'string', nullable: true },
              totalRequests: { type: 'number' },
              totalFailures: { type: 'number' },
              totalSuccesses: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getCircuitBreakers(): Promise<Record<string, unknown>> {
    const breakers = this.circuitBreakerService.getAllStates();
    return {
      timestamp: new Date().toISOString(),
      breakers,
    };
  }

  /**
   * Reset a specific circuit breaker
   */
  @Post('v1/gateway/circuit-breakers/:serviceName/reset')
  @ApiOperation({ summary: 'Reset a specific circuit breaker' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker reset successful',
  })
  async resetCircuitBreaker(
    @Param('serviceName') serviceName: string,
  ): Promise<Record<string, unknown>> {
    this.circuitBreakerService.reset(serviceName);
    return {
      message: `Circuit breaker for ${serviceName} has been reset`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get Prometheus metrics
   * Exposes metrics in Prometheus format for scraping
   */
  @Get('v1/gateway/metrics')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics in text format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async getMetrics(@Res() response: Response): Promise<void> {
    const metrics = await this.metricsService.getMetrics();
    response.set('Content-Type', this.metricsService.getContentType());
    response.send(metrics);
  }

  /**
   * Proxy all other requests to appropriate microservice
   * Handles all HTTP methods and routes to correct backend service
   */
  @All('v1/:service/*')
  async proxyRequest(@Req() request: Request, @Res() response: Response): Promise<void> {
    try {
      // Generate correlation ID for request tracing
      const correlationId = this.logger.generateCorrelationId();

      // Extract request details
      const method = request.method;
      const path = `/api${request.url.replace(/^\/api/, '')}`;
      const body = request.body;
      const headers = request.headers as Record<string, string>;

      // Log incoming request
      this.logger.logIncomingRequest(correlationId, method, path, request.query);

      // Validate request
      if (!path || !method) {
        throw new BadRequestException('Invalid request path or method');
      }

      // Route to appropriate microservice
      const startTime = Date.now();
      const proxyResponse = await this.proxyService.routeRequest(
        correlationId,
        method,
        path,
        body,
        headers,
      );

      const responseTime = Date.now() - startTime;

      // Log gateway response
      this.logger.logGatewayResponse(correlationId, proxyResponse.status, responseTime);

      // Set correlation ID in response headers
      response.setHeader('X-Correlation-ID', correlationId);
      response.setHeader('X-Response-Time', `${responseTime}ms`);

      // Send response
      response.status(proxyResponse.status).json(proxyResponse.data);
    } catch (error) {
      const correlationId = this.logger.generateCorrelationId();
      this.logger.logError(correlationId, error, 'proxy-request');

      const statusCode =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const errorMessage = error instanceof Error ? error.message : String(error);

      response.status(statusCode).header('X-Correlation-ID', correlationId).json({
        statusCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
