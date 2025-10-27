import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerformanceMetricDto } from './dto/create-performance-metric.dto';

describe('PerformanceService', () => {
  let service: PerformanceService;

  const mockPrismaService = {
    athlete: {
      findFirst: jest.fn(),
    },
    performanceData: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockClubId = '550e8400-e29b-41d4-a716-446655440000';
  const mockAthleteId = '550e8400-e29b-41d4-a716-446655440003';
  const mockSessionId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  describe('recordMetric', () => {
    it('should record a performance metric successfully', async () => {
      const createMetricDto: CreatePerformanceMetricDto = {
        athleteId: mockAthleteId,
        sessionId: mockSessionId,
        metricType: 'time',
        value: 245.5,
        unit: 'seconds',
        recordedAt: '2025-10-24T10:30:00Z',
        notes: 'Personal best attempt',
      };

      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
        level: 'ADVANCED',
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);

      const result = await service.recordMetric(createMetricDto, mockClubId);

      expect(mockPrismaService.athlete.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockAthleteId,
          clubId: mockClubId,
        },
      });
      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          metricType: 'time',
          value: 245.5,
        }),
      );
    });

    it('should throw error if athlete not found', async () => {
      const createMetricDto: CreatePerformanceMetricDto = {
        athleteId: mockAthleteId,
        metricType: 'time',
        value: 245.5,
        unit: 'seconds',
        recordedAt: '2025-10-24T10:30:00Z',
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(null);

      await expect(service.recordMetric(createMetricDto, mockClubId)).rejects.toThrow(
        `Athlete ${mockAthleteId} not found in club ${mockClubId}`,
      );
    });
  });

  describe('getAthleteMetrics', () => {
    it('should retrieve athlete metrics with pagination', async () => {
      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
      };

      const mockMetrics = [
        {
          id: '1',
          athleteId: mockAthleteId,
          metricType: 'time',
          value: 245,
        },
      ];

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);
      mockPrismaService.performanceData.findMany.mockResolvedValue(mockMetrics);

      const result = await service.getAthleteMetrics(mockAthleteId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          pagination: expect.objectContaining({
            limit: 50,
            offset: 0,
          }),
        }),
      );
    });

    it('should apply filters when retrieving metrics', async () => {
      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);

      const result = await service.getAthleteMetrics(mockAthleteId, mockClubId, {
        metricType: 'time',
        limit: 25,
        offset: 10,
      });

      expect(result).toBeDefined();
      expect(result.athleteId).toEqual(mockAthleteId);
    });

    it('should throw error if athlete not found', async () => {
      mockPrismaService.athlete.findFirst.mockResolvedValue(null);

      await expect(service.getAthleteMetrics(mockAthleteId, mockClubId)).rejects.toThrow(
        `Athlete ${mockAthleteId} not found in club ${mockClubId}`,
      );
    });
  });

  describe('getPersonalRecords', () => {
    it('should retrieve personal records for athlete', async () => {
      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);

      const result = await service.getPersonalRecords(mockAthleteId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          personalRecords: expect.any(Array),
        }),
      );
    });

    it('should throw error if athlete not found', async () => {
      mockPrismaService.athlete.findFirst.mockResolvedValue(null);

      await expect(service.getPersonalRecords(mockAthleteId, mockClubId)).rejects.toThrow(
        `Athlete ${mockAthleteId} not found in club ${mockClubId}`,
      );
    });
  });

  describe('getPerformanceTrends', () => {
    it('should retrieve performance trends for metric', async () => {
      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);

      const result = await service.getPerformanceTrends(mockAthleteId, mockClubId, 'time');

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          metricType: 'time',
          trends: expect.any(Array),
        }),
      );
    });

    it('should accept custom grouping', async () => {
      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);

      const result = await service.getPerformanceTrends(mockAthleteId, mockClubId, 'distance', {
        groupBy: 'month',
      });

      expect(result.groupedBy).toBe('month');
    });

    it('should throw error if athlete not found', async () => {
      mockPrismaService.athlete.findFirst.mockResolvedValue(null);

      await expect(service.getPerformanceTrends(mockAthleteId, mockClubId, 'time')).rejects.toThrow(
        `Athlete ${mockAthleteId} not found in club ${mockClubId}`,
      );
    });
  });

  describe('getPerformanceSummary', () => {
    it('should retrieve performance summary for period', async () => {
      const mockAthlete = {
        id: mockAthleteId,
        clubId: mockClubId,
      };

      mockPrismaService.athlete.findFirst.mockResolvedValue(mockAthlete);

      const result = await service.getPerformanceSummary(
        mockAthleteId,
        mockClubId,
        '2025-10-01T00:00:00Z',
        '2025-10-31T23:59:59Z',
      );

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          period: expect.any(Object),
          summary: expect.any(Object),
        }),
      );
    });

    it('should throw error if athlete not found', async () => {
      mockPrismaService.athlete.findFirst.mockResolvedValue(null);

      await expect(
        service.getPerformanceSummary(
          mockAthleteId,
          mockClubId,
          '2025-10-01T00:00:00Z',
          '2025-10-31T23:59:59Z',
        ),
      ).rejects.toThrow(`Athlete ${mockAthleteId} not found in club ${mockClubId}`);
    });
  });

  describe('compareAthletes', () => {
    it('should compare performance between athletes', async () => {
      const athleteIds = [mockAthleteId, '550e8400-e29b-41d4-a716-446655440004'];

      const result = await service.compareAthletes(athleteIds, mockClubId, 'time');

      expect(result).toEqual(
        expect.objectContaining({
          metricType: 'time',
          comparison: expect.any(Array),
        }),
      );
    });
  });
});
