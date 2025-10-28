import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { GatewayController } from './gateway.controller';
import { ProxyService } from './services/proxy.service';
import { HealthCheckService } from './services/health-check.service';
import { SwaggerAggregatorService } from './services/swagger-aggregator.service';
import { LoggerService } from './services/logger.service';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { CircuitBreakerState, CircuitState } from './circuit-breaker/circuit-breaker.types';

describe('GatewayController', () => {
  let controller: GatewayController;
  let proxyService: jest.Mocked<ProxyService>;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let swaggerAggregatorService: jest.Mocked<SwaggerAggregatorService>;
  let loggerService: jest.Mocked<LoggerService>;
  let circuitBreakerService: jest.Mocked<CircuitBreakerService>;

  beforeEach(async () => {
    // Create mocks
    const proxyServiceMock = {
      routeRequest: jest.fn(),
      getServices: jest.fn(),
      getService: jest.fn(),
    };

    const healthCheckServiceMock = {
      checkAllServices: jest.fn(),
      getHealthSummary: jest.fn(),
      checkService: jest.fn(),
    };

    const swaggerAggregatorServiceMock = {
      getAggregatedDocs: jest.fn(),
      clearCache: jest.fn(),
    };

    const loggerServiceMock = {
      generateCorrelationId: jest.fn(),
      logIncomingRequest: jest.fn(),
      logGatewayResponse: jest.fn(),
      logError: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      logProxyRequest: jest.fn(),
      logProxyResponse: jest.fn(),
    };

    const circuitBreakerServiceMock = {
      getAllStates: jest.fn(),
      reset: jest.fn(),
      executeWithBreaker: jest.fn(),
      getState: jest.fn(),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        { provide: ProxyService, useValue: proxyServiceMock },
        { provide: HealthCheckService, useValue: healthCheckServiceMock },
        { provide: SwaggerAggregatorService, useValue: swaggerAggregatorServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: CircuitBreakerService, useValue: circuitBreakerServiceMock },
      ],
    }).compile();

    controller = module.get<GatewayController>(GatewayController);
    proxyService = module.get(ProxyService);
    healthCheckService = module.get(HealthCheckService);
    swaggerAggregatorService = module.get(SwaggerAggregatorService);
    loggerService = module.get(LoggerService);
    circuitBreakerService = module.get(CircuitBreakerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('gatewayHealth', () => {
    it('should return gateway health status', async () => {
      const result = await controller.gatewayHealth();

      expect(result).toHaveProperty('status', 'UP');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'API Gateway');
      expect(result).toHaveProperty('version', '1.0.0');
    });

    it('should return valid ISO timestamp', async () => {
      const result = await controller.gatewayHealth();
      const timestamp = result.timestamp as string;

      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('servicesHealth', () => {
    it('should check all services and return health summary', async () => {
      const mockHealthSummary = {
        status: 'UP',
        services: {
          identity: { status: 'UP', responseTime: 50 },
          sports: { status: 'UP', responseTime: 45 },
          clubs: { status: 'UP', responseTime: 55 },
          communication: { status: 'UP', responseTime: 60 },
        },
      };

      healthCheckService.checkAllServices.mockResolvedValue(undefined);
      healthCheckService.getHealthSummary.mockReturnValue(mockHealthSummary);

      const result = await controller.servicesHealth();

      expect(healthCheckService.checkAllServices).toHaveBeenCalledTimes(1);
      expect(healthCheckService.getHealthSummary).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockHealthSummary);
    });

    it('should handle partial service failures', async () => {
      const mockHealthSummary = {
        status: 'DEGRADED',
        services: {
          identity: { status: 'UP', responseTime: 50 },
          sports: { status: 'DOWN', error: 'Connection refused' },
          clubs: { status: 'UP', responseTime: 55 },
          communication: { status: 'UP', responseTime: 60 },
        },
      };

      healthCheckService.checkAllServices.mockResolvedValue(undefined);
      healthCheckService.getHealthSummary.mockReturnValue(mockHealthSummary);

      const result = await controller.servicesHealth();

      expect(result.status).toBe('DEGRADED');
      expect(result.services).toHaveProperty('sports');
      expect((result.services as any).sports.status).toBe('DOWN');
    });
  });

  describe('getAggregatedDocs', () => {
    it('should return aggregated swagger documentation', async () => {
      const mockDocs = {
        openapi: '3.0.0',
        info: { title: 'Sports Platform - Aggregated APIs', version: '1.0' },
        paths: {
          '/api/v1/auth/login': { post: { summary: 'Login' } },
          '/api/v1/sports/athletes': { get: { summary: 'Get athletes' } },
        },
      };

      swaggerAggregatorService.getAggregatedDocs.mockResolvedValue(mockDocs);

      const result = await controller.getAggregatedDocs();

      expect(swaggerAggregatorService.getAggregatedDocs).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDocs);
      expect(result.openapi).toBe('3.0.0');
      expect(result.paths).toBeDefined();
    });

    it('should handle errors when service docs are unavailable', async () => {
      const fallbackDocs = {
        openapi: '3.0.0',
        info: { title: 'Sports Platform - Aggregated APIs (Fallback)', version: '1.0' },
        paths: {},
      };

      swaggerAggregatorService.getAggregatedDocs.mockResolvedValue(fallbackDocs);

      const result = await controller.getAggregatedDocs();

      expect(result).toBeDefined();
      expect(result.info).toBeDefined();
    });
  });

  describe('clearDocsCache', () => {
    it('should clear swagger documentation cache', async () => {
      const result = await controller.clearDocsCache();

      expect(swaggerAggregatorService.clearCache).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result.message).toContain('cache cleared successfully');
    });
  });

  describe('getCircuitBreakers', () => {
    it('should return all circuit breaker states', async () => {
      const mockStates: CircuitBreakerState[] = [
        {
          name: 'identity',
          state: CircuitState.CLOSED,
          failureCount: 0,
          successCount: 10,
          lastFailureTime: null,
          nextAttemptTime: null,
          totalRequests: 10,
          totalFailures: 0,
          totalSuccesses: 10,
        },
        {
          name: 'sports',
          state: CircuitState.HALF_OPEN,
          failureCount: 3,
          successCount: 1,
          lastFailureTime: new Date(),
          nextAttemptTime: new Date(Date.now() + 60000),
          totalRequests: 5,
          totalFailures: 3,
          totalSuccesses: 2,
        },
      ];

      circuitBreakerService.getAllStates.mockReturnValue(mockStates);

      const result = await controller.getCircuitBreakers();

      expect(circuitBreakerService.getAllStates).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('breakers');
      expect(result.breakers).toEqual(mockStates);
    });

    it('should handle empty circuit breaker states', async () => {
      circuitBreakerService.getAllStates.mockReturnValue([]);

      const result = await controller.getCircuitBreakers();

      expect(result.breakers).toEqual([]);
    });
  });

  describe('resetCircuitBreaker', () => {
    it('should reset circuit breaker for specified service', async () => {
      const serviceName = 'identity';
      const result = await controller.resetCircuitBreaker(serviceName);

      expect(circuitBreakerService.reset).toHaveBeenCalledWith(serviceName);
      expect(result).toHaveProperty('message');
      expect(result.message).toContain(serviceName);
      expect(result.message).toContain('reset');
    });

    it('should return timestamp when resetting circuit breaker', async () => {
      const result = await controller.resetCircuitBreaker('sports');

      expect(result).toHaveProperty('timestamp');
      const timestamp = result.timestamp as string;
      expect(() => new Date(timestamp)).not.toThrow();
    });
  });

  describe('proxyRequest', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;
    let responseSetHeader: jest.Mock;
    let responseHeader: jest.Mock;

    beforeEach(() => {
      responseJson = jest.fn().mockReturnThis();
      responseStatus = jest.fn().mockReturnThis();
      responseSetHeader = jest.fn().mockReturnThis();
      responseHeader = jest.fn().mockReturnThis();

      mockRequest = {
        method: 'GET',
        url: '/v1/sports/athletes',
        body: {},
        query: {},
        headers: {
          authorization: 'Bearer test-token',
          'content-type': 'application/json',
        } as any,
      };

      mockResponse = {
        status: responseStatus,
        json: responseJson,
        setHeader: responseSetHeader,
        header: responseHeader,
      };

      loggerService.generateCorrelationId.mockReturnValue('test-correlation-id');
    });

    it('should successfully route request to sports service', async () => {
      const mockProxyResponse = {
        status: 200,
        data: { athletes: [{ id: 1, name: 'John Doe' }] },
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      proxyService.routeRequest.mockResolvedValue(mockProxyResponse);

      await controller.proxyRequest(mockRequest as Request, mockResponse as Response);

      expect(loggerService.generateCorrelationId).toHaveBeenCalled();
      expect(loggerService.logIncomingRequest).toHaveBeenCalledWith(
        'test-correlation-id',
        'GET',
        expect.stringContaining('/api/v1/sports/athletes'),
        {},
      );
      expect(proxyService.routeRequest).toHaveBeenCalledWith(
        'test-correlation-id',
        'GET',
        expect.stringContaining('/api/v1/sports/athletes'),
        {},
        expect.any(Object),
      );
      expect(responseSetHeader).toHaveBeenCalledWith('X-Correlation-ID', 'test-correlation-id');
      expect(responseSetHeader).toHaveBeenCalledWith(
        'X-Response-Time',
        expect.stringMatching(/\d+ms/),
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockProxyResponse.data);
    });

    it('should handle POST requests with body', async () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/v1/sports/athletes';
      mockRequest.body = { name: 'Jane Doe', sport: 'Swimming' };

      const mockProxyResponse = {
        status: 201,
        data: { id: 2, name: 'Jane Doe', sport: 'Swimming' },
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      proxyService.routeRequest.mockResolvedValue(mockProxyResponse);

      await controller.proxyRequest(mockRequest as Request, mockResponse as Response);

      expect(proxyService.routeRequest).toHaveBeenCalledWith(
        'test-correlation-id',
        'POST',
        expect.any(String),
        mockRequest.body,
        expect.any(Object),
      );
      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should forward authorization headers', async () => {
      const mockProxyResponse = {
        status: 200,
        data: {},
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      proxyService.routeRequest.mockResolvedValue(mockProxyResponse);

      await controller.proxyRequest(mockRequest as Request, mockResponse as Response);

      expect(proxyService.routeRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          authorization: 'Bearer test-token',
        }),
      );
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable');
      proxyService.routeRequest.mockRejectedValue(error);

      await controller.proxyRequest(mockRequest as Request, mockResponse as Response);

      expect(loggerService.logError).toHaveBeenCalledWith(
        expect.any(String),
        error,
        'proxy-request',
      );
      expect(responseStatus).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Service unavailable',
        }),
      );
    });

    it('should handle missing path as internal error', async () => {
      mockRequest.url = '';
      const error = new Error('Cannot determine target service');
      proxyService.routeRequest.mockRejectedValue(error);

      await controller.proxyRequest(mockRequest as Request, mockResponse as Response);

      expect(loggerService.logError).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        }),
      );
    });

    it('should log correlation ID for all requests', async () => {
      const mockProxyResponse = {
        status: 200,
        data: {},
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      proxyService.routeRequest.mockResolvedValue(mockProxyResponse);

      await controller.proxyRequest(mockRequest as Request, mockResponse as Response);

      expect(loggerService.generateCorrelationId).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('X-Correlation-ID', expect.any(String));
    });
  });
});
