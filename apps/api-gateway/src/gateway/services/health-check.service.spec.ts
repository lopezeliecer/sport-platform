import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HealthCheckService, ServiceHealth } from './health-check.service';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

// Create a mock class for MetricsService
class MockMetricsService {
  recordHttpRequest = jest.fn();
  recordHttpError = jest.fn();
  updateCircuitBreakerState = jest.fn();
  updateServiceHealth = jest.fn();
  incrementActiveRequests = jest.fn();
  decrementActiveRequests = jest.fn();
  getMetrics = jest.fn();
  getContentType = jest.fn();
  resetMetrics = jest.fn();
  clearMetrics = jest.fn();
  onModuleInit = jest.fn();
}

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let httpService: jest.Mocked<HttpService>;
  let loggerService: jest.Mocked<LoggerService>;
  let metricsService: MockMetricsService;

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
      generateCorrelationId: jest.fn(),
      logIncomingRequest: jest.fn(),
      logGatewayResponse: jest.fn(),
      logProxyRequest: jest.fn(),
      logProxyResponse: jest.fn(),
      logError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        { provide: MetricsService, useClass: MockMetricsService },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
    httpService = module.get(HttpService);
    loggerService = module.get(LoggerService);
    metricsService = module.get(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default DOWN status for all services', () => {
      const cachedHealth = service.getCachedHealth();

      expect(cachedHealth).toHaveLength(4);
      cachedHealth.forEach((health) => {
        expect(health.status).toBe('DOWN');
        expect(health.responseTime).toBe(0);
      });
    });

    it('should load service URLs from configuration', () => {
      const cachedHealth = service.getCachedHealth();

      expect(cachedHealth.find((h) => h.name === 'Identity Service')?.url).toBe(
        'http://localhost:3001',
      );
      expect(cachedHealth.find((h) => h.name === 'Sports Service')?.url).toBe(
        'http://localhost:3002',
      );
      expect(cachedHealth.find((h) => h.name === 'Club Management')?.url).toBe(
        'http://localhost:3003',
      );
      expect(cachedHealth.find((h) => h.name === 'Communication Service')?.url).toBe(
        'http://localhost:3004',
      );
    });
  });

  describe('checkAllServices', () => {
    it('should check all services and return health status', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      const results = await service.checkAllServices();

      expect(results).toHaveLength(4);
      expect(httpService.get).toHaveBeenCalledTimes(4);
      results.forEach((result) => {
        expect(result.status).toBe('UP');
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should update cache with health check results', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();

      const cachedHealth = service.getCachedHealth();
      cachedHealth.forEach((health) => {
        expect(health.status).toBe('UP');
      });
    });

    it('should handle mixed service availability', async () => {
      httpService.get.mockImplementation((url: string) => {
        if (url.includes('3001') || url.includes('3002')) {
          // Identity and Sports services are UP
          return of(mockAxiosResponse({ status: 'UP' }, 200)) as any;
        }
        // Clubs and Communication services are DOWN
        return throwError(() => new Error('Connection refused')) as any;
      });

      const results = await service.checkAllServices();

      const upServices = results.filter((r) => r.status === 'UP');
      const downServices = results.filter((r) => r.status === 'DOWN');

      expect(upServices).toHaveLength(2);
      expect(downServices).toHaveLength(2);
    });

    it('should set error message for failed health checks', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Network timeout')) as any);

      const results = await service.checkAllServices();

      results.forEach((result) => {
        expect(result.status).toBe('DOWN');
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Network timeout');
      });
    });

    it('should measure response time for all checks', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      const results = await service.checkAllServices();

      results.forEach((result) => {
        // Response time should be a number (even if it's 0 for mocked responses)
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(typeof result.responseTime).toBe('number');
      });
    });

    it('should update lastCheck timestamp', async () => {
      const beforeCheck = new Date();
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      const results = await service.checkAllServices();
      const afterCheck = new Date();

      results.forEach((result) => {
        expect(result.lastCheck.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime());
        expect(result.lastCheck.getTime()).toBeLessThanOrEqual(afterCheck.getTime());
      });
    });

    it('should call health endpoints with correct URLs', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();

      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/health',
        expect.objectContaining({ timeout: 5000 }),
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3002/api/v1/health',
        expect.objectContaining({ timeout: 5000 }),
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3003/api/v1/health',
        expect.objectContaining({ timeout: 5000 }),
      );
      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3004/api/v1/health',
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('should log warnings for failed health checks', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Connection refused')) as any);

      await service.checkAllServices();

      expect(loggerService.warn).toHaveBeenCalledTimes(4);
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Health check failed'),
        'HealthCheckService',
      );
    });

    it('should handle timeout errors', async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error('Timeout of 5000ms exceeded')) as any,
      );

      const results = await service.checkAllServices();

      results.forEach((result) => {
        expect(result.status).toBe('DOWN');
        expect(result.error).toContain('Timeout');
      });
    });

    it('should mark service as DEGRADED for non-200 status', async () => {
      const mockResponse = mockAxiosResponse({ status: 'DEGRADED' }, 503);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      const results = await service.checkAllServices();

      results.forEach((result) => {
        expect(result.status).toBe('DEGRADED');
      });
    });
  });

  describe('getCachedHealth', () => {
    it('should return cached health status', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();
      const cached = service.getCachedHealth();

      expect(cached).toHaveLength(4);
      expect(cached.every((h) => h.status === 'UP')).toBe(true);
    });

    it('should return latest health status after multiple checks', async () => {
      // First check: all services UP
      const upResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(upResponse) as any);
      await service.checkAllServices();

      let cached = service.getCachedHealth();
      expect(cached.every((h) => h.status === 'UP')).toBe(true);

      // Second check: all services DOWN
      httpService.get.mockReturnValue(throwError(() => new Error('Connection refused')) as any);
      await service.checkAllServices();

      cached = service.getCachedHealth();
      expect(cached.every((h) => h.status === 'DOWN')).toBe(true);
    });
  });

  describe('getCachedServiceHealth', () => {
    it('should return health for specific service', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();
      const identityHealth = service.getCachedServiceHealth('Identity Service');

      expect(identityHealth).toBeDefined();
      expect(identityHealth?.name).toBe('Identity Service');
      expect(identityHealth?.status).toBe('UP');
    });

    it('should return undefined for non-existent service', () => {
      const result = service.getCachedServiceHealth('Non-Existent Service');

      expect(result).toBeUndefined();
    });
  });

  describe('getOverallStatus', () => {
    it('should return UP when all services are UP', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();
      const status = service.getOverallStatus();

      expect(status).toBe('UP');
    });

    it('should return DOWN when all services are DOWN', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('Connection refused')) as any);

      await service.checkAllServices();
      const status = service.getOverallStatus();

      expect(status).toBe('DOWN');
    });

    it('should return DEGRADED when some services are UP', async () => {
      httpService.get.mockImplementation((url: string) => {
        if (url.includes('3001')) {
          // Identity service is UP
          return of(mockAxiosResponse({ status: 'UP' }, 200)) as any;
        }
        // Other services are DOWN
        return throwError(() => new Error('Connection refused')) as any;
      });

      await service.checkAllServices();
      const status = service.getOverallStatus();

      expect(status).toBe('DEGRADED');
    });

    it('should return DEGRADED when some services have DEGRADED status', async () => {
      httpService.get.mockImplementation((url: string) => {
        if (url.includes('3001') || url.includes('3002')) {
          return of(mockAxiosResponse({ status: 'UP' }, 200)) as any;
        }
        return of(mockAxiosResponse({ status: 'DEGRADED' }, 503)) as any;
      });

      await service.checkAllServices();
      const status = service.getOverallStatus();

      expect(status).toBe('DEGRADED');
    });
  });

  describe('getHealthSummary', () => {
    it('should return comprehensive health summary', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();
      const summary = service.getHealthSummary();

      expect(summary).toHaveProperty('overall');
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('services');
      expect(summary).toHaveProperty('details');
    });

    it('should count services correctly', async () => {
      httpService.get.mockImplementation((url: string) => {
        if (url.includes('3001') || url.includes('3002')) {
          return of(mockAxiosResponse({ status: 'UP' }, 200)) as any;
        }
        return throwError(() => new Error('Connection refused')) as any;
      });

      await service.checkAllServices();
      const summary = service.getHealthSummary();
      const services = summary.services as any;

      expect(services.total).toBe(4);
      expect(services.up).toBe(2);
      expect(services.down).toBe(2);
      expect(services.degraded).toBe(0);
    });

    it('should include all service details', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();
      const summary = service.getHealthSummary();
      const details = summary.details as ServiceHealth[];

      expect(details).toHaveLength(4);
      details.forEach((detail) => {
        expect(detail).toHaveProperty('name');
        expect(detail).toHaveProperty('status');
        expect(detail).toHaveProperty('url');
        expect(detail).toHaveProperty('responseTime');
        expect(detail).toHaveProperty('lastCheck');
      });
    });

    it('should have valid ISO timestamp', async () => {
      const mockResponse = mockAxiosResponse({ status: 'UP' }, 200);
      httpService.get.mockReturnValue(of(mockResponse) as any);

      await service.checkAllServices();
      const summary = service.getHealthSummary();
      const timestamp = summary.timestamp as string;

      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});
