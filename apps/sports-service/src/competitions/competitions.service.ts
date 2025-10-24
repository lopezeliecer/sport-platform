import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompetitionDto,
  RegisterAthleteCompetitionDto,
  RecordCompetitionResultDto,
} from './dto/create-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new competition
   */
  async createCompetition(createCompetitionDto: CreateCompetitionDto, clubId: string) {
    const {
      name,
      description,
      status,
      startDate,
      endDate,
      location,
      organizer,
      expectedParticipants,
    } = createCompetitionDto;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      throw new Error('Start date must be before end date');
    }

    return {
      id: `comp_${Date.now()}`,
      name,
      description,
      status,
      startDate: start,
      endDate: end,
      location,
      organizer,
      expectedParticipants,
      clubId,
      createdAt: new Date(),
    };
  }

  /**
   * Get all competitions for a club
   */
  async getCompetitions(
    clubId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const { status, limit = 20, offset = 0 } = filters || {};

    return {
      clubId,
      competitions: [],
      pagination: { total: 0, limit, offset, pages: 0 },
    };
  }

  /**
   * Get specific competition details
   */
  async getCompetitionById(competitionId: string, clubId: string) {
    return {
      id: competitionId,
      clubId,
      name: 'Mock Competition',
      status: 'PLANNING',
      startDate: new Date(),
      endDate: new Date(),
      participants: [],
    };
  }

  /**
   * Register athlete for competition
   */
  async registerAthleteForCompetition(registerDto: RegisterAthleteCompetitionDto, clubId: string) {
    const { athleteId, competitionId, category, targetPerformance } = registerDto;

    return {
      id: `reg_${Date.now()}`,
      athleteId,
      competitionId,
      category,
      targetPerformance,
      registrationStatus: 'REGISTERED',
      registeredAt: new Date(),
    };
  }

  /**
   * Record competition results for athlete
   */
  async recordResult(recordResultDto: RecordCompetitionResultDto, clubId: string) {
    const { athleteId, competitionId, finalPerformance, position, qualified, notes } =
      recordResultDto;

    return {
      id: `result_${Date.now()}`,
      athleteId,
      competitionId,
      finalPerformance,
      position,
      qualified,
      notes,
      recordedAt: new Date(),
    };
  }

  /**
   * Get competition results
   */
  async getCompetitionResults(competitionId: string, clubId: string) {
    return {
      competitionId,
      results: [],
    };
  }

  /**
   * Get athlete's competition history
   */
  async getAthleteCompetitionHistory(athleteId: string, clubId: string) {
    return {
      athleteId,
      competitions: [],
    };
  }

  /**
   * Get competition statistics
   */
  async getCompetitionStatistics(competitionId: string, clubId: string) {
    return {
      competitionId,
      totalParticipants: 0,
      averagePerformance: 0,
      recordHolders: [],
    };
  }
}
