import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../../libs/shared/database/src/prisma.service";
import {
  CreateAthleteDto,
  UpdateAthleteDto,
  AthleteResponseDto,
  AthleteSearchDto,
  PaginatedResponseDto,
} from "../../../../libs/shared/common/src/dto/base.dto";
import {
  MultiTenantService,
  applyClubFilter,
  validateResourceOwnership,
} from "../../../../libs/shared/database/src/utils/multi-tenant.util";

@Injectable()
export class AthletesService {
  constructor(
    private prisma: PrismaService,
    private multiTenant: MultiTenantService
  ) {}

  /**
   * Create a new athlete
   */
  async create(
    createAthleteDto: CreateAthleteDto,
    clubId: string,
    userId: string
  ): Promise<AthleteResponseDto> {
    // Validate club access
    const hasAccess = await this.multiTenant.validateClubAccess(
      userId,
      clubId,
      this.prisma,
      ["ADMIN", "COACH", "DIRECTOR"]
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        "Insufficient permissions to create athletes"
      );
    }

    // Validate athlete number uniqueness within club
    if (createAthleteDto.athleteNumber) {
      const existingAthlete = await this.prisma.athlete.findFirst({
        where: {
          clubId,
          athleteNumber: createAthleteDto.athleteNumber,
          isActive: true,
        },
      });

      if (existingAthlete) {
        throw new BadRequestException(
          "Athlete number already exists in this club"
        );
      }
    }

    // Validate club membership limit
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      select: { maxAthletes: true },
    });

    if (club) {
      const currentAthleteCount = await this.prisma.athlete.count({
        where: {
          clubId,
          isActive: true,
        },
      });

      if (currentAthleteCount >= club.maxAthletes) {
        throw new BadRequestException("Club has reached maximum athlete limit");
      }
    }

    try {
      const athlete = await this.prisma.athlete.create({
        data: {
          ...createAthleteDto,
          clubId,
          joinedAt: createAthleteDto.joinedAt
            ? new Date(createAthleteDto.joinedAt)
            : new Date(),
          dateOfBirth: createAthleteDto.dateOfBirth
            ? new Date(createAthleteDto.dateOfBirth)
            : null,
          personalBests: createAthleteDto.personalBests || {},
          goals: createAthleteDto.goals || {},
          emergencyContacts: createAthleteDto.emergencyContacts || {},
        },
        include: {
          club: {
            select: {
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return this.mapToResponseDto(athlete);
    } catch (error) {
      console.error("Error creating athlete:", error);
      throw new BadRequestException("Failed to create athlete");
    }
  }

  /**
   * Find all athletes with pagination and filtering
   */
  async findAll(
    searchDto: AthleteSearchDto,
    clubId: string,
    userId: string
  ): Promise<PaginatedResponseDto<AthleteResponseDto>> {
    // Validate club access
    const hasAccess = await this.multiTenant.validateClubAccess(
      userId,
      clubId,
      this.prisma
    );
    if (!hasAccess) {
      throw new ForbiddenException("Access denied to this club");
    }

    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      query,
      sport,
      level,
      category,
      gender,
      isActive,
    } = searchDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = applyClubFilter(clubId, {
      ...(query && {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { nickname: { contains: query, mode: "insensitive" } },
          { athleteNumber: { contains: query, mode: "insensitive" } },
        ],
      }),
      ...(sport && { sport }),
      ...(level && { level }),
      ...(category && {
        category: { contains: category, mode: "insensitive" },
      }),
      ...(gender && { gender }),
      ...(isActive !== undefined && { isActive }),
    });

    try {
      const [athletes, total] = await Promise.all([
        this.prisma.athlete.findMany({
          where,
          include: {
            club: {
              select: {
                name: true,
                slug: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.athlete.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: athletes.map((athlete) => this.mapToResponseDto(athlete)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error finding athletes:", error);
      throw new BadRequestException("Failed to retrieve athletes");
    }
  }

  /**
   * Find one athlete by ID
   */
  async findOne(
    id: string,
    clubId: string,
    userId: string
  ): Promise<AthleteResponseDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id },
      include: {
        club: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        trainingSessions: {
          where: { isActive: true },
          take: 5,
          orderBy: { date: "desc" },
          select: {
            id: true,
            date: true,
            type: true,
            status: true,
          },
        },
        performances: {
          take: 10,
          orderBy: { recordedAt: "desc" },
          select: {
            id: true,
            recordedAt: true,
            metrics: true,
            notes: true,
          },
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException("Athlete not found");
    }

    // Validate resource ownership
    const isOwner = await validateResourceOwnership(athlete.clubId, clubId);
    if (!isOwner) {
      throw new ForbiddenException("Access denied to this athlete");
    }

    // Validate club access
    const hasAccess = await this.multiTenant.validateClubAccess(
      userId,
      clubId,
      this.prisma
    );
    if (!hasAccess) {
      throw new ForbiddenException("Access denied to this club");
    }

    return this.mapToResponseDto(athlete);
  }

  /**
   * Update an athlete
   */
  async update(
    id: string,
    updateAthleteDto: UpdateAthleteDto,
    clubId: string,
    userId: string
  ): Promise<AthleteResponseDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id },
      select: { clubId: true, athleteNumber: true },
    });

    if (!athlete) {
      throw new NotFoundException("Athlete not found");
    }

    // Validate resource ownership
    const isOwner = await validateResourceOwnership(athlete.clubId, clubId);
    if (!isOwner) {
      throw new ForbiddenException("Access denied to this athlete");
    }

    // Validate club access
    const hasAccess = await this.multiTenant.validateClubAccess(
      userId,
      clubId,
      this.prisma,
      ["ADMIN", "COACH", "DIRECTOR"]
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        "Insufficient permissions to update athletes"
      );
    }

    // Validate athlete number uniqueness if changed
    if (
      updateAthleteDto.athleteNumber &&
      updateAthleteDto.athleteNumber !== athlete.athleteNumber
    ) {
      const existingAthlete = await this.prisma.athlete.findFirst({
        where: {
          clubId,
          athleteNumber: updateAthleteDto.athleteNumber,
          isActive: true,
          id: { not: id },
        },
      });

      if (existingAthlete) {
        throw new BadRequestException(
          "Athlete number already exists in this club"
        );
      }
    }

    try {
      const updatedAthlete = await this.prisma.athlete.update({
        where: { id },
        data: {
          ...updateAthleteDto,
          dateOfBirth: updateAthleteDto.dateOfBirth
            ? new Date(updateAthleteDto.dateOfBirth)
            : undefined,
        },
        include: {
          club: {
            select: {
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return this.mapToResponseDto(updatedAthlete);
    } catch (error) {
      console.error("Error updating athlete:", error);
      throw new BadRequestException("Failed to update athlete");
    }
  }

  /**
   * Soft delete an athlete
   */
  async remove(id: string, clubId: string, userId: string): Promise<void> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id },
      select: { clubId: true },
    });

    if (!athlete) {
      throw new NotFoundException("Athlete not found");
    }

    // Validate resource ownership
    const isOwner = await validateResourceOwnership(athlete.clubId, clubId);
    if (!isOwner) {
      throw new ForbiddenException("Access denied to this athlete");
    }

    // Validate club access
    const hasAccess = await this.multiTenant.validateClubAccess(
      userId,
      clubId,
      this.prisma,
      ["ADMIN", "DIRECTOR"]
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        "Insufficient permissions to delete athletes"
      );
    }

    try {
      await this.prisma.athlete.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Error deleting athlete:", error);
      throw new BadRequestException("Failed to delete athlete");
    }
  }

  /**
   * Get athlete statistics
   */
  async getStatistics(
    athleteId: string,
    clubId: string,
    userId: string
  ): Promise<any> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { clubId: true },
    });

    if (!athlete) {
      throw new NotFoundException("Athlete not found");
    }

    // Validate resource ownership and access
    const isOwner = await validateResourceOwnership(athlete.clubId, clubId);
    if (!isOwner) {
      throw new ForbiddenException("Access denied to this athlete");
    }

    const hasAccess = await this.multiTenant.validateClubAccess(
      userId,
      clubId,
      this.prisma
    );
    if (!hasAccess) {
      throw new ForbiddenException("Access denied to this club");
    }

    try {
      const [
        totalTrainingSessions,
        completedSessions,
        totalPerformances,
        recentPerformances,
        attendanceStats,
      ] = await Promise.all([
        this.prisma.trainingSession.count({
          where: {
            athletes: {
              some: { id: athleteId },
            },
            isActive: true,
          },
        }),
        this.prisma.trainingSession.count({
          where: {
            athletes: {
              some: { id: athleteId },
            },
            status: "COMPLETED",
            isActive: true,
          },
        }),
        this.prisma.performance.count({
          where: { athleteId },
        }),
        this.prisma.performance.findMany({
          where: { athleteId },
          orderBy: { recordedAt: "desc" },
          take: 10,
          select: {
            id: true,
            recordedAt: true,
            metrics: true,
            notes: true,
          },
        }),
        this.prisma.attendance.groupBy({
          by: ["status"],
          where: { athleteId },
          _count: { status: true },
        }),
      ]);

      const attendanceRate =
        totalTrainingSessions > 0
          ? (completedSessions / totalTrainingSessions) * 100
          : 0;

      return {
        training: {
          totalSessions: totalTrainingSessions,
          completedSessions,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
        },
        performance: {
          totalRecords: totalPerformances,
          recentPerformances,
        },
        attendance: {
          byStatus: attendanceStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.status;
            return acc;
          }, {}),
        },
      };
    } catch (error) {
      console.error("Error getting athlete statistics:", error);
      throw new BadRequestException("Failed to retrieve athlete statistics");
    }
  }

  /**
   * Maps database entity to response DTO
   */
  private mapToResponseDto(athlete: any): AthleteResponseDto {
    return {
      id: athlete.id,
      clubId: athlete.clubId,
      userId: athlete.userId,
      athleteNumber: athlete.athleteNumber,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      nickname: athlete.nickname,
      dateOfBirth: athlete.dateOfBirth,
      gender: athlete.gender,
      profilePicture: athlete.profilePicture,
      sport: athlete.sport,
      category: athlete.category,
      level: athlete.level,
      joinedAt: athlete.joinedAt,
      isActive: athlete.isActive,
      personalBests: athlete.personalBests,
      goals: athlete.goals,
      notes: athlete.notes,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt,
    };
  }
}
