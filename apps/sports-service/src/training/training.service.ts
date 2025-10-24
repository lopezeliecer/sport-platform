import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTrainingSessionDto,
  SessionType,
  SessionIntensity,
} from './dto/create-training-session.dto';
import { RecordAttendanceDto, AttendanceStatus } from './dto/attendance.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new training session
   */
  async createSession(createSessionDto: CreateTrainingSessionDto, clubId: string, coachId: string) {
    const {
      title,
      description,
      type,
      intensity,
      startTime,
      endTime,
      location,
      athleteIds = [],
      plannedDuration,
      notes,
    } = createSessionDto;

    // Validate that start time is before end time
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }

    // Map SessionType to Sport enum
    const sportMap: Record<
      string,
      'SWIMMING' | 'TRACK_FIELD' | 'SOCCER' | 'BASKETBALL' | 'TENNIS'
    > = {
      TRAINING: 'SWIMMING',
      COMPETITION: 'SWIMMING',
      FRIENDLY: 'SWIMMING',
      TECHNIQUE: 'SWIMMING',
      RECOVERY: 'SWIMMING',
    };

    // Create training session
    const session = await this.prisma.trainingSession.create({
      data: {
        title,
        description,
        sport: sportMap[type],
        category: type,
        level: 'INTERMEDIATE',
        scheduledAt: start,
        duration: plannedDuration || 60,
        location,
        clubId,
        coachId,
        notes,
        status: 'SCHEDULED',
      },
      include: {
        coach: {
          select: { id: true, email: true },
        },
      },
    });

    // Assign athletes to session if provided
    if (athleteIds.length > 0) {
      await this.assignAthletesToSession(session.id, athleteIds, clubId, coachId);
    }

    return session;
  }

  /**
   * Get all training sessions for a club with filters
   */
  async getSessions(
    clubId: string,
    filters?: {
      coachId?: string;
      athleteId?: string;
      startDate?: string;
      endDate?: string;
      type?: SessionType;
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const {
      coachId,
      athleteId,
      startDate,
      endDate,
      type,
      status,
      limit = 20,
      offset = 0,
    } = filters || {};

    const where: Record<string, unknown> = { clubId };

    if (coachId) where.coachId = coachId;
    if (type) where.category = type;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) {
        (where.scheduledAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.scheduledAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const sessions = await this.prisma.trainingSession.findMany({
      where,
      include: {
        coach: {
          select: { id: true, email: true },
        },
        trainingAssignments: {
          select: { athleteId: true, attendanceStatus: true },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { scheduledAt: 'desc' },
    });

    const total = await this.prisma.trainingSession.count({ where });

    return {
      data: sessions,
      pagination: { total, limit, offset, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a specific training session
   */
  async getSessionById(sessionId: string, clubId: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        clubId,
      },
      include: {
        coach: {
          select: { id: true, email: true },
        },
        trainingAssignments: {
          include: {
            athlete: {
              select: { id: true, level: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Training session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Update training session
   */
  async updateSession(
    sessionId: string,
    clubId: string,
    updateData: Partial<CreateTrainingSessionDto>,
  ) {
    const session = await this.getSessionById(sessionId, clubId);

    // If dates are being updated, validate them
    if (updateData.startTime && updateData.endTime) {
      const start = new Date(updateData.startTime);
      const end = new Date(updateData.endTime);
      if (start >= end) {
        throw new Error('Start time must be before end time');
      }
    }

    const updated = await this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        title: updateData.title,
        description: updateData.description,
        category: updateData.type,
        scheduledAt: updateData.startTime ? new Date(updateData.startTime) : undefined,
        duration: updateData.plannedDuration,
        location: updateData.location,
        notes: updateData.notes,
      },
      include: {
        coach: {
          select: { id: true, email: true },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel or mark session as completed
   */
  async updateSessionStatus(
    sessionId: string,
    clubId: string,
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED',
  ) {
    await this.getSessionById(sessionId, clubId);

    const updated = await this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        status,
      },
    });

    return updated;
  }

  /**
   * Delete training session
   */
  async deleteSession(sessionId: string, clubId: string) {
    await this.getSessionById(sessionId, clubId);

    await this.prisma.trainingSession.delete({
      where: { id: sessionId },
    });

    return { message: 'Training session deleted successfully' };
  }

  /**
   * Assign athletes to session
   */
  async assignAthletesToSession(
    sessionId: string,
    athleteIds: string[],
    clubId: string,
    coachId: string,
  ) {
    // Create training assignments for each athlete
    const assignments = await Promise.all(
      athleteIds.map((athleteId) =>
        this.prisma.trainingAssignment.create({
          data: {
            sessionId,
            athleteId,
            clubId,
            assignedBy: coachId,
            status: 'ASSIGNED',
            attendanceStatus: 'SCHEDULED',
          },
        }),
      ),
    );

    return assignments;
  }

  /**
   * Record attendance for a training session
   */
  async recordAttendance(recordAttendanceDto: RecordAttendanceDto, clubId: string) {
    const { athleteId, sessionId, status, checkInTime, checkOutTime, notes } = recordAttendanceDto;

    // Verify session exists and belongs to club
    const session = await this.prisma.trainingSession.findFirst({
      where: {
        id: sessionId,
        clubId,
      },
    });

    if (!session) {
      throw new Error(`Training session ${sessionId} not found`);
    }

    // Update or create training assignment record
    const attendance = await this.prisma.trainingAssignment.upsert({
      where: {
        sessionId_athleteId: {
          sessionId,
          athleteId,
        },
      },
      update: {
        attendanceStatus: status as any,
        checkedInAt: checkInTime ? new Date(checkInTime) : undefined,
        checkedOutAt: checkOutTime ? new Date(checkOutTime) : undefined,
        coachNotes: notes,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        athleteId,
        clubId,
        assignedBy: 'system',
        attendanceStatus: status as any,
        checkedInAt: checkInTime ? new Date(checkInTime) : undefined,
        checkedOutAt: checkOutTime ? new Date(checkOutTime) : undefined,
        coachNotes: notes,
      },
      include: {
        athlete: {
          select: { id: true, level: true },
        },
      },
    });

    return attendance;
  }

  /**
   * Get attendance summary for a session
   */
  async getSessionAttendanceSummary(sessionId: string, clubId: string) {
    const session = await this.getSessionById(sessionId, clubId);

    const attendances = await this.prisma.trainingAssignment.groupBy({
      by: ['attendanceStatus'],
      where: { sessionId },
      _count: true,
    });

    const summary = {
      sessionId,
      date: session.scheduledAt,
      total: attendances.reduce((sum, a) => sum + (a._count || 0), 0),
      present: attendances.find((a) => a.attendanceStatus === 'PRESENT')?._count || 0,
      absent: attendances.find((a) => a.attendanceStatus === 'ABSENT')?._count || 0,
      late: attendances.find((a) => a.attendanceStatus === 'LATE')?._count || 0,
      earlyDeparture:
        attendances.find((a) => a.attendanceStatus === 'EARLY_DEPARTURE')?._count || 0,
    };

    const total = summary.present + summary.absent + summary.late + summary.earlyDeparture;
    summary['attendanceRate'] = total > 0 ? (summary.present / total) * 100 : 0;

    return summary;
  }

  /**
   * Get training calendar for a club
   */
  async getCalendar(
    clubId: string,
    filters?: {
      coachId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const { coachId, startDate, endDate } = filters || {};

    const where: Record<string, unknown> = { clubId };

    if (coachId) where.coachId = coachId;

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) {
        (where.scheduledAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.scheduledAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const sessions = await this.prisma.trainingSession.findMany({
      where,
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        duration: true,
        category: true,
        sport: true,
        coach: {
          select: { id: true, email: true },
        },
        status: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return sessions;
  }
}
