import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ProxyService } from './proxy.service';
import { LoggerService } from './logger.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import {
  CircuitOpenException,
  TooManyRequestsException,
} from '../circuit-breaker/circuit-breaker.types';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let loggerService: jest.Mocked<LoggerService>;
  let circuitBreakerService: jest.Mocked<CircuitBreakerService>;

  const mockAxiosResponse = (data: any, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  beforeEach(async () => {
    const httpServiceMock = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          IDENTITY_SERVICE_URL: 'http://localhost:3001',
          SPORTS_SERVICE_URL: 'http://localhost:3002',
          CLUB_MANAGEMENT_URL: 'http://localhost:3003',
          COMMUNICATION_SERVICE_URL: 'http://localhost:3004',
        };
        return config[key] || defaultValue;
      }),
    };

    const loggerServiceMock = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      logProxyRequest: jest.fn(),
      logProxyResponse: jest.fn(),
      logError: jest.fn(),
      generateCorrelationId: jest.fn(),
      logIncomingRequest: jest.fn(),
      logGatewayResponse: jest.fn(),
    };

    const circuitBreakerServiceMock = {
      executeWithBreaker: jest.fn((serviceName, fn) => fn()),
      getState: jest.fn(),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
      reset: jest.fn(),
      getAllStates: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: CircuitBreakerService, useValue: circuitBreakerServiceMock },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    loggerService = module.get(LoggerService);
    circuitBreakerService = module.get(CircuitBreakerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize all microservices', () => {
      const services = service.getServices();

      expect(services).toHaveLength(4);
      expect(services.map((s) => s.name)).toEqual(['identity', 'sports', 'clubs', 'communication']);
    });

    it('should load service URLs from environment', () => {
      const identityService = service.getService('identity');
      const sportsService = service.getService('sports');

      expect(identityService).toBeDefined();
      expect(identityService?.url).toBe('http://localhost:3001');
      expect(sportsService).toBeDefined();
      expect(sportsService?.url).toBe('http://localhost:3002');
    });

    it('should log service registration', () => {
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Registered service: identity'),
        'ProxyService',
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Initialized 4 microservices'),
        'ProxyService',
      );
    });

    it('should use default URLs when environment variables are missing', () => {
      configService.get.mockImplementation((key: string, defaultValue?: string) => defaultValue);

      const testModule = Test.createTestingModule({
        providers: [
          ProxyService,
          { provide: HttpService, useValue: httpService },
          { provide: ConfigService, useValue: configService },
          { provide: LoggerService, useValue: loggerService },
          { provide: CircuitBreakerService, useValue: circuitBreakerService },
        ],
      });

      expect(() => testModule.compile()).not.toThrow();
    });
  });

  describe('Service Name Extraction', () => {
    it('should extract "identity" from auth path', async () => {
      const mockResponse = mockAxiosResponse({ success: true });
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/auth/login', undefined, {});

      expect(loggerService.logProxyRequest).toHaveBeenCalledWith(
        'corr-123',
        'identity',
        'GET',
        expect.any(String),
      );
    });

    it('should extract "sports" from athletes path', async () => {
      const mockResponse = mockAxiosResponse({ athletes: [] });
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/athletes/list', undefined, {});

      expect(loggerService.logProxyRequest).toHaveBeenCalledWith(
        'corr-123',
        'sports',
        'GET',
        expect.any(String),
      );
    });

    it('should extract "clubs" from clubs path', async () => {
      const mockResponse = mockAxiosResponse({ clubs: [] });
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/clubs/list', undefined, {});

      expect(loggerService.logProxyRequest).toHaveBeenCalledWith(
        'corr-123',
        'clubs',
        'GET',
        expect.any(String),
      );
    });

    it('should extract "communication" from notifications path', async () => {
      const mockResponse = mockAxiosResponse({ notifications: [] });
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/notifications/list', undefined, {});

      expect(loggerService.logProxyRequest).toHaveBeenCalledWith(
        'corr-123',
        'communication',
        'GET',
        expect.any(String),
      );
    });

    it('should throw error for unrecognized service path', async () => {
      await expect(
        service.routeRequest('corr-123', 'GET', '/api/v1/unknown/path', undefined, {}),
      ).rejects.toThrow('Cannot determine target service');
    });
  });

  describe('HTTP Method Routing', () => {
    const correlationId = 'test-corr-id';
    const path = '/api/v1/sports/athletes';
    const headers = { authorization: 'Bearer token' };

    it('should handle GET requests', async () => {
      const mockResponse = mockAxiosResponse({ data: 'test' });
      httpService.get.mockReturnValue(of(mockResponse) as any);

      const result = await service.routeRequest(correlationId, 'GET', path, undefined, headers);

      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3002/v1/sports/athletes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Correlation-ID': correlationId,
            authorization: 'Bearer token',
          }),
        }),
      );
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data: 'test' });
    });

    it('should handle POST requests', async () => {
      const body = { name: 'Test Athlete' };
      const mockResponse = mockAxiosResponse({ id: 1, ...body }, 201);
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.routeRequest(correlationId, 'POST', path, body, headers);

      expect(httpService.post).toHaveBeenCalledWith(
        'http://localhost:3002/v1/sports/athletes',
        body,
        expect.objectContaining({
          headers: expect.any(Object),
        }),
      );
      expect(result.status).toBe(201);
    });

    it('should handle PUT requests', async () => {
      const body = { name: 'Updated Athlete' };
      const mockResponse = mockAxiosResponse(body);
      httpService.put.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest(correlationId, 'PUT', path, body, headers);

      expect(httpService.put).toHaveBeenCalled();
    });

    it('should handle DELETE requests', async () => {
      const mockResponse = mockAxiosResponse({ success: true });
      httpService.delete.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest(correlationId, 'DELETE', path, undefined, headers);

      expect(httpService.delete).toHaveBeenCalled();
    });

    it('should handle PATCH requests', async () => {
      const body = { name: 'Patched Athlete' };
      const mockResponse = mockAxiosResponse(body);
      httpService.patch.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest(correlationId, 'PATCH', path, body, headers);

      expect(httpService.patch).toHaveBeenCalled();
    });

    it('should throw error for unsupported HTTP method', async () => {
      circuitBreakerService.executeWithBreaker.mockImplementation(async (_, fn) => fn());

      await expect(
        service.routeRequest(correlationId, 'OPTIONS', path, undefined, headers),
      ).rejects.toThrow('Unsupported HTTP method: OPTIONS');
    });
  });

  describe('Header Forwarding', () => {
    it('should add correlation ID to headers', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-456', 'GET', '/api/v1/auth/me', undefined, {});

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Correlation-ID': 'corr-456',
          }),
        }),
      );
    });

    it('should add X-Forwarded-By header', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-789', 'GET', '/api/v1/auth/me', undefined, {});

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Forwarded-By': 'api-gateway',
          }),
        }),
      );
    });

    it('should forward authorization header', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);
      const headers = { authorization: 'Bearer secret-token' };

      await service.routeRequest('corr-123', 'GET', '/api/v1/auth/me', undefined, headers);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer secret-token',
          }),
        }),
      );
    });

    it('should forward accept-language header', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);
      const headers = { 'accept-language': 'es-ES' };

      await service.routeRequest('corr-123', 'GET', '/api/v1/auth/me', undefined, headers);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'accept-language': 'es-ES',
          }),
        }),
      );
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should execute requests through circuit breaker', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {});

      expect(circuitBreakerService.executeWithBreaker).toHaveBeenCalledWith(
        'sports',
        expect.any(Function),
      );
    });

    it('should handle CircuitOpenException', async () => {
      const nextAttemptTime = new Date(Date.now() + 60000);
      const circuitOpenError = new CircuitOpenException('sports', nextAttemptTime);

      circuitBreakerService.executeWithBreaker.mockRejectedValue(circuitOpenError);

      await expect(
        service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {}),
      ).rejects.toThrow(HttpException);

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker OPEN'),
        'ProxyService',
      );
    });

    it('should return 503 when circuit is open', async () => {
      const nextAttemptTime = new Date(Date.now() + 60000);
      const circuitOpenError = new CircuitOpenException('sports', nextAttemptTime);

      circuitBreakerService.executeWithBreaker.mockRejectedValue(circuitOpenError);

      try {
        await service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {});
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      }
    });

    it('should handle TooManyRequestsException', async () => {
      const tooManyRequestsError = new TooManyRequestsException('sports');

      circuitBreakerService.executeWithBreaker.mockRejectedValue(tooManyRequestsError);

      await expect(
        service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {}),
      ).rejects.toThrow(HttpException);

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Too many requests'),
        'ProxyService',
      );
    });

    it('should return 429 for too many requests', async () => {
      const tooManyRequestsError = new TooManyRequestsException('sports');

      circuitBreakerService.executeWithBreaker.mockRejectedValue(tooManyRequestsError);

      try {
        await service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {});
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  describe('Error Handling', () => {
    it('should log errors', async () => {
      const error = new Error('Network error');
      circuitBreakerService.executeWithBreaker.mockRejectedValue(error);

      await expect(
        service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {}),
      ).rejects.toThrow('Network error');

      expect(loggerService.logError).toHaveBeenCalledWith(
        'corr-123',
        error,
        expect.stringContaining('routing to sports'),
      );
    });

    it('should propagate errors from circuit breaker', async () => {
      const error = new Error('Service error');
      circuitBreakerService.executeWithBreaker.mockRejectedValue(error);

      await expect(
        service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {}),
      ).rejects.toThrow();

      expect(loggerService.logError).toHaveBeenCalled();
    });
  });

  describe('Response Time Logging', () => {
    it('should log response time', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes', undefined, {});

      expect(loggerService.logProxyResponse).toHaveBeenCalledWith(
        'corr-123',
        'sports',
        200,
        expect.any(Number),
      );
    });
  });

  describe('URL Building', () => {
    it('should build correct target URL without /api prefix', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest('corr-123', 'GET', '/api/v1/sports/athletes/123', undefined, {});

      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3002/v1/sports/athletes/123',
        expect.any(Object),
      );
    });

    it('should handle paths with query parameters', async () => {
      const mockResponse = mockAxiosResponse({});
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.routeRequest(
        'corr-123',
        'GET',
        '/api/v1/sports/athletes?limit=10&offset=0',
        undefined,
        {},
      );

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3002/v1/sports/athletes?limit=10&offset=0'),
        expect.any(Object),
      );
    });
  });

  describe('Service Getters', () => {
    it('should return all services', () => {
      const services = service.getServices();

      expect(services).toHaveLength(4);
      expect(services[0]).toHaveProperty('name');
      expect(services[0]).toHaveProperty('url');
      expect(services[0]).toHaveProperty('basePath');
      expect(services[0]).toHaveProperty('port');
    });

    it('should return specific service by name', () => {
      const identityService = service.getService('identity');

      expect(identityService).toBeDefined();
      expect(identityService?.name).toBe('identity');
      expect(identityService?.port).toBe(3001);
    });

    it('should return undefined for non-existent service', () => {
      const result = service.getService('non-existent');

      expect(result).toBeUndefined();
    });
  });
});
