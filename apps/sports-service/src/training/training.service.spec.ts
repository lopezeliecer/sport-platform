import { Test, TestingModule } from '@nestjs/testing';
import { TrainingService } from './training.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTrainingSessionDto,
  SessionType,
  SessionIntensity,
} from './dto/create-training-session.dto';

describe('TrainingService', () => {
  let service: TrainingService;

  const mockPrismaService = {
    trainingSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    trainingAssignment: {
      create: jest.fn(),
      upsert: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockClubId = '550e8400-e29b-41d4-a716-446655440000';
  const mockCoachId = '550e8400-e29b-41d4-a716-446655440001';
  const mockSessionId = '550e8400-e29b-41d4-a716-446655440002';
  const mockAthleteId = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
  });

  describe('createSession', () => {
    it('should create a training session successfully', async () => {
      const createDto: CreateTrainingSessionDto = {
        title: 'Monday Training',
        description: 'Regular Monday session',
        type: SessionType.TRAINING,
        intensity: SessionIntensity.MODERATE,
        startTime: '2025-10-24T10:00:00Z',
        endTime: '2025-10-24T11:00:00Z',
        location: 'Pool A',
        coachId: mockCoachId,
        plannedDuration: 60,
        notes: 'Focus on technique',
      };

      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
        title: createDto.title,
        description: createDto.description,
        scheduledAt: new Date(createDto.startTime),
        duration: 60,
        location: createDto.location,
        coachId: mockCoachId,
        status: 'SCHEDULED',
        sport: 'SWIMMING',
        category: 'TRAINING',
        level: 'INTERMEDIATE',
        coach: { id: mockCoachId, email: 'coach@example.com' },
      };

      mockPrismaService.trainingSession.create.mockResolvedValue(mockSession);

      const result = await service.createSession(createDto, mockClubId, mockCoachId);

      expect(mockPrismaService.trainingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          description: createDto.description,
          clubId: mockClubId,
          coachId: mockCoachId,
        }),
        include: {
          coach: {
            select: { id: true, email: true },
          },
        },
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw error if start time is after end time', async () => {
      const createDto: CreateTrainingSessionDto = {
        title: 'Invalid Session',
        type: SessionType.TRAINING,
        intensity: SessionIntensity.HIGH,
        startTime: '2025-10-24T11:00:00Z',
        endTime: '2025-10-24T10:00:00Z',
        coachId: mockCoachId,
      };

      await expect(service.createSession(createDto, mockClubId, mockCoachId)).rejects.toThrow(
        'Start time must be before end time',
      );
    });

    it('should assign athletes to session if provided', async () => {
      const athleteIds = [mockAthleteId, '550e8400-e29b-41d4-a716-446655440004'];
      const createDto: CreateTrainingSessionDto = {
        title: 'Session with athletes',
        type: SessionType.TRAINING,
        intensity: SessionIntensity.MODERATE,
        startTime: '2025-10-24T10:00:00Z',
        endTime: '2025-10-24T11:00:00Z',
        coachId: mockCoachId,
        athleteIds,
      };

      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
        title: createDto.title,
        coachId: mockCoachId,
        sport: 'SWIMMING',
        category: 'TRAINING',
        level: 'INTERMEDIATE',
        status: 'SCHEDULED',
        coach: { id: mockCoachId, email: 'coach@example.com' },
      };

      mockPrismaService.trainingSession.create.mockResolvedValue(mockSession);
      mockPrismaService.trainingAssignment.create.mockResolvedValue({
        id: '123',
        sessionId: mockSessionId,
        athleteId: mockAthleteId,
      });

      await service.createSession(createDto, mockClubId, mockCoachId);

      expect(mockPrismaService.trainingAssignment.create).toHaveBeenCalledTimes(athleteIds.length);
    });
  });

  describe('getSessions', () => {
    it('should return paginated sessions for a club', async () => {
      const mockSessions = [
        {
          id: mockSessionId,
          clubId: mockClubId,
          title: 'Session 1',
          coach: { id: mockCoachId, email: 'coach@example.com' },
          trainingAssignments: [],
        },
      ];

      mockPrismaService.trainingSession.findMany.mockResolvedValue(mockSessions);
      mockPrismaService.trainingSession.count.mockResolvedValue(1);

      const result = await service.getSessions(mockClubId);

      expect(mockPrismaService.trainingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clubId: mockClubId },
          take: 20,
          skip: 0,
        }),
      );
      expect(result.data).toEqual(mockSessions);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should apply filters when getting sessions', async () => {
      mockPrismaService.trainingSession.findMany.mockResolvedValue([]);
      mockPrismaService.trainingSession.count.mockResolvedValue(0);

      await service.getSessions(mockClubId, {
        coachId: mockCoachId,
        status: 'COMPLETED',
        limit: 10,
        offset: 5,
      });

      expect(mockPrismaService.trainingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: mockClubId,
            coachId: mockCoachId,
            status: 'COMPLETED',
          }),
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('getSessionById', () => {
    it('should return a session by id', async () => {
      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
        title: 'Session Title',
        coach: { id: mockCoachId, email: 'coach@example.com' },
        trainingAssignments: [],
      };

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(mockSession);

      const result = await service.getSessionById(mockSessionId, mockClubId);

      expect(mockPrismaService.trainingSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSessionId, clubId: mockClubId },
        }),
      );
      expect(result).toEqual(mockSession);
    });

    it('should throw error if session not found', async () => {
      mockPrismaService.trainingSession.findFirst.mockResolvedValue(null);

      await expect(service.getSessionById(mockSessionId, mockClubId)).rejects.toThrow(
        `Training session ${mockSessionId} not found`,
      );
    });
  });

  describe('updateSession', () => {
    it('should update a training session', async () => {
      const updateDto: Partial<CreateTrainingSessionDto> = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
        title: 'Old Title',
      };

      const updatedSession = {
        ...mockSession,
        ...updateDto,
      };

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.trainingSession.update.mockResolvedValue(updatedSession);

      const result = await service.updateSession(mockSessionId, mockClubId, updateDto);

      expect(mockPrismaService.trainingSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSessionId },
          data: expect.objectContaining({
            title: updateDto.title,
          }),
        }),
      );
      expect(result.title).toBe(updateDto.title);
    });

    it('should validate dates when updating', async () => {
      const updateDto: Partial<CreateTrainingSessionDto> = {
        startTime: '2025-10-24T11:00:00Z',
        endTime: '2025-10-24T10:00:00Z',
      };

      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
      };

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(mockSession);

      await expect(service.updateSession(mockSessionId, mockClubId, updateDto)).rejects.toThrow(
        'Start time must be before end time',
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a training session', async () => {
      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
      };

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.trainingSession.delete.mockResolvedValue(mockSession);

      const result = await service.deleteSession(mockSessionId, mockClubId);

      expect(mockPrismaService.trainingSession.delete).toHaveBeenCalledWith({
        where: { id: mockSessionId },
      });
      expect(result).toEqual({ message: 'Training session deleted successfully' });
    });
  });

  describe('assignAthletesToSession', () => {
    it('should assign multiple athletes to a session', async () => {
      const athleteIds = [mockAthleteId, '550e8400-e29b-41d4-a716-446655440005'];

      mockPrismaService.trainingAssignment.create.mockResolvedValue({
        id: '123',
      });

      await service.assignAthletesToSession(mockSessionId, athleteIds, mockClubId, mockCoachId);

      expect(mockPrismaService.trainingAssignment.create).toHaveBeenCalledTimes(athleteIds.length);
      expect(mockPrismaService.trainingAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: mockSessionId,
            athleteId: expect.any(String),
            clubId: mockClubId,
            assignedBy: mockCoachId,
          }),
        }),
      );
    });
  });

  describe('recordAttendance', () => {
    it('should record attendance for an athlete', async () => {
      const attendanceDto = {
        athleteId: mockAthleteId,
        sessionId: mockSessionId,
        status: 'PRESENT',
        checkInTime: '2025-10-24T10:05:00Z',
        checkOutTime: '2025-10-24T11:00:00Z',
        notes: 'Good performance',
      };

      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
      };

      const mockAttendance = {
        id: '456',
        sessionId: mockSessionId,
        athleteId: mockAthleteId,
        status: attendanceDto.status,
        athlete: { id: mockAthleteId, level: 'INTERMEDIATE' },
      };

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.trainingAssignment.upsert.mockResolvedValue(mockAttendance);

      const result = await service.recordAttendance(attendanceDto as any, mockClubId);

      expect(mockPrismaService.trainingAssignment.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockAttendance);
    });

    it('should throw error if session not found when recording attendance', async () => {
      const attendanceDto = {
        athleteId: mockAthleteId,
        sessionId: mockSessionId,
        status: 'PRESENT',
      };

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(null);

      await expect(service.recordAttendance(attendanceDto as any, mockClubId)).rejects.toThrow(
        `Training session ${mockSessionId} not found`,
      );
    });
  });

  describe('getSessionAttendanceSummary', () => {
    it('should return attendance summary for a session', async () => {
      const mockSession = {
        id: mockSessionId,
        clubId: mockClubId,
        scheduledAt: new Date('2025-10-24T10:00:00Z'),
      };

      const mockAttendances = [
        { attendanceStatus: 'PRESENT', _count: 15 },
        { attendanceStatus: 'ABSENT', _count: 3 },
        { attendanceStatus: 'LATE', _count: 2 },
      ];

      mockPrismaService.trainingSession.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.trainingAssignment.groupBy.mockResolvedValue(mockAttendances);

      const result = await service.getSessionAttendanceSummary(mockSessionId, mockClubId);

      expect(result).toEqual(
        expect.objectContaining({
          sessionId: mockSessionId,
          total: 20,
          present: 15,
          absent: 3,
          late: 2,
        }),
      );
    });
  });

  describe('getCalendar', () => {
    it('should return calendar view of training sessions', async () => {
      const mockCalendar = [
        {
          id: mockSessionId,
          title: 'Session 1',
          scheduledAt: new Date('2025-10-24T10:00:00Z'),
          duration: 60,
          status: 'SCHEDULED',
        },
      ];

      mockPrismaService.trainingSession.findMany.mockResolvedValue(mockCalendar);

      const result = await service.getCalendar(mockClubId);

      expect(mockPrismaService.trainingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clubId: mockClubId },
        }),
      );
      expect(result).toEqual(mockCalendar);
    });

    it('should filter calendar by date range', async () => {
      mockPrismaService.trainingSession.findMany.mockResolvedValue([]);

      await service.getCalendar(mockClubId, {
        startDate: '2025-10-24T00:00:00Z',
        endDate: '2025-10-31T23:59:59Z',
      });

      expect(mockPrismaService.trainingSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: mockClubId,
            scheduledAt: expect.any(Object),
          }),
        }),
      );
    });
  });
});
