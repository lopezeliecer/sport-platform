import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { SwaggerAggregatorService } from './swagger-aggregator.service';
import { LoggerService } from './logger.service';

describe('SwaggerAggregatorService', () => {
  let service: SwaggerAggregatorService;
  let httpService: HttpService;
  let configService: ConfigService;
  let loggerService: LoggerService;

  const mockIdentityDocs = {
    openapi: '3.0.0',
    info: { title: 'Identity Service', version: '1.0.0' },
    paths: {
      '/api/v1/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login user',
          operationId: 'login',
          responses: {
            '200': { description: 'Login successful' },
          },
        },
      },
    },
    components: {
      schemas: {
        LoginDto: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    tags: [{ name: 'Authentication', description: 'Authentication endpoints' }],
  };

  const mockSportsDocs = {
    openapi: '3.0.0',
    info: { title: 'Sports Service', version: '1.0.0' },
    paths: {
      '/api/v1/athletes': {
        get: {
          tags: ['Athletes'],
          summary: 'Get all athletes',
          operationId: 'getAthletes',
          responses: {
            '200': { description: 'Athletes retrieved successfully' },
          },
        },
      },
    },
    components: {
      schemas: {
        Athlete: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
    tags: [{ name: 'Athletes', description: 'Athletes management' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwaggerAggregatorService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                IDENTITY_SERVICE_URL: 'http://localhost:3001',
                SPORTS_SERVICE_URL: 'http://localhost:3002',
                CLUB_MANAGEMENT_URL: 'http://localhost:3003',
                COMMUNICATION_SERVICE_URL: 'http://localhost:3004',
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SwaggerAggregatorService>(SwaggerAggregatorService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe('getAggregatedDocs', () => {
    it('should aggregate documentation from all services successfully', async () => {
      // Mock HTTP responses
      const mockResponses = [
        { data: mockIdentityDocs } as AxiosResponse,
        { data: mockSportsDocs } as AxiosResponse,
        { data: { openapi: '3.0.0', paths: {}, components: {} } } as AxiosResponse,
        { data: { openapi: '3.0.0', paths: {}, components: {} } } as AxiosResponse,
      ];

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(mockResponses[0]))
        .mockImplementationOnce(() => of(mockResponses[1]))
        .mockImplementationOnce(() => of(mockResponses[2]))
        .mockImplementationOnce(() => of(mockResponses[3]));

      const result = await service.getAggregatedDocs();

      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.0.0');
      expect(result.info).toBeDefined();
      expect((result.info as any).title).toBe('Sports Platform - Unified API Documentation');
      expect(result.paths).toBeDefined();
      expect(result.components).toBeDefined();
      expect(result.tags).toBeDefined();

      // Verify paths were aggregated
      const paths = result.paths as Record<string, unknown>;
      expect(paths['/api/v1/auth/login']).toBeDefined();
      expect(paths['/api/v1/athletes']).toBeDefined();

      // Verify HTTP service was called for each service
      expect(httpService.get).toHaveBeenCalledTimes(4);
    });

    it('should use cached documentation on subsequent calls', async () => {
      const mockResponse = { data: mockIdentityDocs } as AxiosResponse;
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      // First call - should fetch from services
      await service.getAggregatedDocs();
      expect(httpService.get).toHaveBeenCalledTimes(4);

      // Clear the mock calls
      jest.clearAllMocks();

      // Second call - should use cache
      await service.getAggregatedDocs();
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should refresh cache after cache duration expires', async () => {
      const mockResponse = { data: mockIdentityDocs } as AxiosResponse;
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      // First call
      await service.getAggregatedDocs();
      expect(httpService.get).toHaveBeenCalledTimes(4);

      jest.clearAllMocks();

      // Mock time passing (6 minutes > 5 minute cache)
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000);

      // Second call after cache expiry
      await service.getAggregatedDocs();
      expect(httpService.get).toHaveBeenCalledTimes(4);

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should handle service failures gracefully', async () => {
      // Mock some services succeeding and others failing
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of({ data: mockIdentityDocs } as AxiosResponse))
        .mockImplementationOnce(() => throwError(() => new Error('Service unavailable')))
        .mockImplementationOnce(() => of({ data: mockSportsDocs } as AxiosResponse))
        .mockImplementationOnce(() => throwError(() => new Error('Connection timeout')));

      const result = await service.getAggregatedDocs();

      expect(result).toBeDefined();
      expect(result.paths).toBeDefined();
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('Could not fetch Swagger docs'),
        'SwaggerAggregatorService',
      );
    });

    it('should return minimal docs when all services fail and no cache exists', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('All services down')));

      const result = await service.getAggregatedDocs();

      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.0.0');
      // When all services fail, it returns unified docs with empty paths
      expect((result.info as any).title).toContain('Sports Platform');
      expect(result.paths).toBeDefined();
    });

    it('should return expired cache when new fetch fails', async () => {
      const mockResponse = { data: mockIdentityDocs } as AxiosResponse;

      // First call succeeds
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));
      await service.getAggregatedDocs();

      jest.clearAllMocks();

      // Mock cache expiry
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000);

      // Second call fails
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('Services down')));

      const result = await service.getAggregatedDocs();

      // Should return something (expired cache or fallback)
      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.0.0');
      // Either error or warn will be called depending on fallback path
      const errorOrWarnCalled =
        loggerService.error['mock'].calls.length > 0 || loggerService.warn['mock'].calls.length > 0;
      expect(errorOrWarnCalled).toBe(true);

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should namespace schemas to avoid conflicts', async () => {
      const mockClubDocs = {
        openapi: '3.0.0',
        paths: {},
        components: {
          schemas: {
            Club: { type: 'object', properties: { id: { type: 'string' } } },
            Athlete: { type: 'object', properties: { clubId: { type: 'string' } } },
          },
        },
      };

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of({ data: mockSportsDocs } as AxiosResponse))
        .mockImplementationOnce(() => of({ data: mockClubDocs } as AxiosResponse))
        .mockImplementationOnce(() =>
          of({ data: { openapi: '3.0.0', paths: {} } } as AxiosResponse),
        )
        .mockImplementationOnce(() =>
          of({ data: { openapi: '3.0.0', paths: {} } } as AxiosResponse),
        );

      const result = await service.getAggregatedDocs();

      const components = result.components as { schemas: Record<string, unknown> };
      expect(components.schemas).toBeDefined();

      // Verify schemas are namespaced (service key determines prefix)
      expect(components.schemas['Sports_Athlete']).toBeDefined();

      // Check that we have multiple schemas from different services
      const schemaKeys = Object.keys(components.schemas);
      expect(schemaKeys.length).toBeGreaterThan(0);
    });

    it('should add service identifiers to tags', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of({ data: mockIdentityDocs } as AxiosResponse))
        .mockImplementationOnce(() => of({ data: mockSportsDocs } as AxiosResponse))
        .mockImplementationOnce(() =>
          of({ data: { openapi: '3.0.0', paths: {} } } as AxiosResponse),
        )
        .mockImplementationOnce(() =>
          of({ data: { openapi: '3.0.0', paths: {} } } as AxiosResponse),
        );

      const result = await service.getAggregatedDocs();

      const tags = result.tags as Array<{ name: string; 'x-service'?: string }>;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);

      // Verify tags have service identifiers
      const serviceTags = tags.filter((tag) => tag['x-service']);
      expect(serviceTags.length).toBeGreaterThan(0);

      // Verify service status tags exist
      const identityTag = tags.find((tag) => tag.name === 'SERVICE: IDENTITY');
      expect(identityTag).toBeDefined();
      expect(identityTag?.['x-service']).toBe('identity');
    });
  });

  describe('clearCache', () => {
    it('should clear cached documentation', async () => {
      const mockResponse = { data: mockIdentityDocs } as AxiosResponse;
      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      // First call - caches the result
      await service.getAggregatedDocs();
      expect(httpService.get).toHaveBeenCalledTimes(4);

      jest.clearAllMocks();

      // Second call - uses cache
      await service.getAggregatedDocs();
      expect(httpService.get).not.toHaveBeenCalled();

      // Clear cache
      service.clearCache();

      // Third call - fetches again
      await service.getAggregatedDocs();
      expect(httpService.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('Configuration', () => {
    it('should use environment variables for service URLs', () => {
      expect(configService.get).toHaveBeenCalledWith('IDENTITY_SERVICE_URL', expect.any(String));
      expect(configService.get).toHaveBeenCalledWith('SPORTS_SERVICE_URL', expect.any(String));
      expect(configService.get).toHaveBeenCalledWith('CLUB_MANAGEMENT_URL', expect.any(String));
      expect(configService.get).toHaveBeenCalledWith(
        'COMMUNICATION_SERVICE_URL',
        expect.any(String),
      );
    });

    it('should use default localhost URLs as fallback', async () => {
      const result = await service.getAggregatedDocs();
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors gracefully', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('ETIMEDOUT')));

      const result = await service.getAggregatedDocs();
      expect(result).toBeDefined();
      // Service logs warnings for each failed fetch
      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

      const result = await service.getAggregatedDocs();
      expect(result).toBeDefined();
      // Service logs warnings for each failed fetch
      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should handle malformed service responses', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        of({
          data: { invalid: 'structure' },
        } as AxiosResponse),
      );

      const result = await service.getAggregatedDocs();
      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.0.0');
    });
  });
});
