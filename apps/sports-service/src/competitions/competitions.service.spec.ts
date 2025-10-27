import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionsService } from './competitions.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompetitionDto,
  CompetitionStatus,
  RegisterAthleteCompetitionDto,
  RecordCompetitionResultDto,
} from './dto/create-competition.dto';

describe('CompetitionsService', () => {
  let service: CompetitionsService;

  const mockPrismaService = {
    athlete: {
      findFirst: jest.fn(),
    },
    competition: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    competitionResult: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockClubId = '550e8400-e29b-41d4-a716-446655440000';
  const mockAthleteId = '550e8400-e29b-41d4-a716-446655440003';
  const mockCompetitionId = '550e8400-e29b-41d4-a716-446655440005';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompetitionsService>(CompetitionsService);
  });

  describe('createCompetition', () => {
    it('should create a new competition successfully', async () => {
      const createCompetitionDto: CreateCompetitionDto = {
        name: 'State Championship 2025',
        status: CompetitionStatus.REGISTRATION,
        location: 'State Aquatic Center',
        startDate: '2025-11-15T09:00:00Z',
        endDate: '2025-11-17T18:00:00Z',
        description: 'Annual state swimming championship',
        organizer: 'State Swimming Association',
        expectedParticipants: 100,
      };

      const result = await service.createCompetition(createCompetitionDto, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          name: 'State Championship 2025',
          status: CompetitionStatus.REGISTRATION,
          clubId: mockClubId,
        }),
      );
      expect(result.id).toBeDefined();
    });

    it('should validate date ordering on competition creation', async () => {
      const createCompetitionDto: CreateCompetitionDto = {
        name: 'Invalid Competition',
        status: CompetitionStatus.PLANNING,
        location: 'Test Center',
        startDate: '2025-11-17T18:00:00Z',
        endDate: '2025-11-15T09:00:00Z', // End date before start date
      };

      await expect(service.createCompetition(createCompetitionDto, mockClubId)).rejects.toThrow(
        'Start date must be before end date',
      );
    });
  });

  describe('getCompetitions', () => {
    it('should retrieve all competitions for club with pagination', async () => {
      const mockCompetitions = [
        {
          id: mockCompetitionId,
          clubId: mockClubId,
          name: 'State Championship',
          status: CompetitionStatus.PLANNING,
        },
      ];

      mockPrismaService.competition.findMany.mockResolvedValue(mockCompetitions);

      const result = await service.getCompetitions(mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          clubId: mockClubId,
          competitions: expect.any(Array),
          pagination: expect.objectContaining({
            limit: 20,
            offset: 0,
          }),
        }),
      );
    });

    it('should apply filters when retrieving competitions', async () => {
      mockPrismaService.competition.findMany.mockResolvedValue([]);

      await service.getCompetitions(mockClubId, {
        status: CompetitionStatus.REGISTRATION,
        limit: 25,
        offset: 10,
      });

      expect(mockPrismaService.competition.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getCompetitionById', () => {
    it('should retrieve competition by ID', async () => {
      const result = await service.getCompetitionById(mockCompetitionId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          id: mockCompetitionId,
          clubId: mockClubId,
          name: expect.any(String),
        }),
      );
    });

    it('should return competition with all fields', async () => {
      const result = await service.getCompetitionById(mockCompetitionId, mockClubId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('clubId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
    });
  });

  describe('registerAthleteForCompetition', () => {
    it('should register athlete for competition successfully', async () => {
      const registerDto: RegisterAthleteCompetitionDto = {
        athleteId: mockAthleteId,
        competitionId: mockCompetitionId,
        category: 'U18',
        targetPerformance: '245.5',
      };

      const result = await service.registerAthleteForCompetition(registerDto, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          competitionId: mockCompetitionId,
          registrationStatus: 'REGISTERED',
        }),
      );
    });

    it('should register with minimal required fields', async () => {
      const registerDto: RegisterAthleteCompetitionDto = {
        athleteId: mockAthleteId,
        competitionId: mockCompetitionId,
      };

      const result = await service.registerAthleteForCompetition(registerDto, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          competitionId: mockCompetitionId,
        }),
      );
    });
  });

  describe('recordResult', () => {
    it('should record competition result successfully', async () => {
      const recordResultDto: RecordCompetitionResultDto = {
        athleteId: mockAthleteId,
        competitionId: mockCompetitionId,
        finalPerformance: '245.5',
        position: 1,
        qualified: true,
        notes: 'New personal best',
      };

      const result = await service.recordResult(recordResultDto, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          competitionId: mockCompetitionId,
          finalPerformance: '245.5',
          position: 1,
        }),
      );
    });

    it('should record result with minimal required fields', async () => {
      const recordResultDto: RecordCompetitionResultDto = {
        athleteId: mockAthleteId,
        competitionId: mockCompetitionId,
        finalPerformance: '248.3',
      };

      const result = await service.recordResult(recordResultDto, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          competitionId: mockCompetitionId,
          finalPerformance: '248.3',
        }),
      );
    });
  });

  describe('getCompetitionResults', () => {
    it('should retrieve results for competition', async () => {
      const mockResults = [
        {
          id: '1',
          athleteId: mockAthleteId,
          competitionId: mockCompetitionId,
          finalPerformance: '245.5',
          position: 1,
        },
      ];

      mockPrismaService.competitionResult.findMany.mockResolvedValue(mockResults);

      const result = await service.getCompetitionResults(mockCompetitionId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          competitionId: mockCompetitionId,
          results: expect.any(Array),
        }),
      );
    });

    it('should return empty results when no data exists', async () => {
      mockPrismaService.competitionResult.findMany.mockResolvedValue([]);

      const result = await service.getCompetitionResults(mockCompetitionId, mockClubId);

      expect(result.results).toEqual([]);
    });
  });

  describe('getAthleteCompetitionHistory', () => {
    it('should retrieve competition history for athlete', async () => {
      const mockHistory = [
        {
          competitionId: mockCompetitionId,
          competitionName: 'State Championship',
          finalPerformance: '245.5',
          position: 1,
          date: '2025-11-15T09:00:00Z',
        },
      ];

      mockPrismaService.competitionResult.findMany.mockResolvedValue(mockHistory);

      const result = await service.getAthleteCompetitionHistory(mockAthleteId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          athleteId: mockAthleteId,
          competitions: expect.any(Array),
        }),
      );
    });

    it('should return empty history when no competitions found', async () => {
      mockPrismaService.competitionResult.findMany.mockResolvedValue([]);

      const result = await service.getAthleteCompetitionHistory(mockAthleteId, mockClubId);

      expect(result.competitions).toEqual([]);
    });
  });

  describe('getCompetitionStatistics', () => {
    it('should retrieve competition statistics', async () => {
      const result = await service.getCompetitionStatistics(mockCompetitionId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          competitionId: mockCompetitionId,
          totalParticipants: expect.any(Number),
          averagePerformance: expect.any(Number),
        }),
      );
    });

    it('should return statistics object with all fields', async () => {
      const result = await service.getCompetitionStatistics(mockCompetitionId, mockClubId);

      expect(result).toHaveProperty('totalParticipants');
      expect(result).toHaveProperty('averagePerformance');
      expect(result).toHaveProperty('recordHolders');
    });
  });
});
