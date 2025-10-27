import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAthleteDto, UpdateAthleteDto, AthleteResponseDto } from './dto/athlete.dto';

@Injectable()
export class AthletesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAthleteDto: CreateAthleteDto,
    clubId: string,
    _userId: string,
  ): Promise<AthleteResponseDto> {
    try {
      const athlete = await this.prisma.athlete.create({
        data: {
          ...createAthleteDto,
          clubId,
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return this.mapToResponseDto(athlete);
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create athlete');
    }
  }

  async findAll(searchDto: any, clubId: string, _userId: string): Promise<any> {
    try {
      const where: any = {
        clubId,
      };

      // Add search filters if provided
      if (searchDto?.search) {
        where.OR = [
          { firstName: { contains: searchDto.search, mode: 'insensitive' } },
          { lastName: { contains: searchDto.search, mode: 'insensitive' } },
          { email: { contains: searchDto.search, mode: 'insensitive' } },
        ];
      }

      if (searchDto?.status) {
        where.status = searchDto.status;
      }

      const [athletes, total] = await Promise.all([
        this.prisma.athlete.findMany({
          where,
          include: {
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          skip: searchDto?.offset || 0,
          take: searchDto?.limit || 20,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.athlete.count({ where }),
      ]);

      return {
        data: athletes.map((athlete) => this.mapToResponseDto(athlete)),
        total,
        offset: searchDto?.offset || 0,
        limit: searchDto?.limit || 20,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to fetch athletes');
    }
  }

  async findOne(id: string, clubId: string, _userId: string): Promise<AthleteResponseDto> {
    try {
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          id,
          clubId,
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      return this.mapToResponseDto(athlete);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch athlete');
    }
  }

  async update(
    id: string,
    updateAthleteDto: UpdateAthleteDto,
    clubId: string,
    _userId: string,
  ): Promise<AthleteResponseDto> {
    try {
      // Verify athlete exists and belongs to club
      const existingAthlete = await this.prisma.athlete.findFirst({
        where: { id, clubId },
      });

      if (!existingAthlete) {
        throw new NotFoundException('Athlete not found');
      }

      const athlete = await this.prisma.athlete.update({
        where: { id },
        data: updateAthleteDto,
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return this.mapToResponseDto(athlete);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update athlete');
    }
  }

  async remove(id: string, clubId: string, _userId: string): Promise<void> {
    try {
      // Verify athlete exists and belongs to club
      const existingAthlete = await this.prisma.athlete.findFirst({
        where: { id, clubId },
      });

      if (!existingAthlete) {
        throw new NotFoundException('Athlete not found');
      }

      await this.prisma.athlete.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete athlete');
    }
  }

  async getStatistics(id: string, clubId: string, _userId: string): Promise<any> {
    try {
      // Verify athlete exists and belongs to club
      const athlete = await this.prisma.athlete.findFirst({
        where: { id, clubId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      // Return basic statistics
      // Note: This is simplified - full implementation would include
      // training sessions, performance metrics, etc.
      return {
        athleteId: id,
        totalTrainingSessions: 0,
        totalPerformanceRecords: 0,
        attendanceRate: 0,
        recentPerformances: [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch athlete statistics');
    }
  }

  private mapToResponseDto(athlete: any): AthleteResponseDto {
    return {
      id: athlete.id,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      email: athlete.email,
      phone: athlete.phone,
      dateOfBirth: athlete.dateOfBirth,
      gender: athlete.gender,
      status: athlete.status,
      club: athlete.club,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
    };
  }
}
