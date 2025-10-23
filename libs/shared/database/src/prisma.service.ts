import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Enable Row Level Security context
    this.$use(async (params, next) => {
      // Set current club context for multi-tenancy
      const clubId = this.getCurrentClubId();
      if (clubId) {
        await this.$executeRaw`SELECT set_config('app.current_club_id', ${clubId}, true)`;
      }

      // Set current user context for audit logs
      const userId = this.getCurrentUserId();
      if (userId) {
        await this.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
      }

      return next(params);
    });

    // Middleware for automatic club filtering
    this.$use(async (params, next) => {
      if (this.isMultiTenantModel(params.model)) {
        const clubId = this.getCurrentClubId();
        if (clubId && !this.hasClubIdFilter(params)) {
          this.addClubIdFilter(params, clubId);
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Multi-tenancy helpers
  private currentClubId: string | null = null;
  private currentUserId: string | null = null;

  setClubContext(clubId: string): void {
    this.currentClubId = clubId;
  }

  setUserContext(userId: string): void {
    this.currentUserId = userId;
  }

  getCurrentClubId(): string | null {
    return this.currentClubId;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  clearContext(): void {
    this.currentClubId = null;
    this.currentUserId = null;
  }

  // Multi-tenant models that need automatic club filtering
  private multiTenantModels = [
    'Athlete',
    'TrainingTemplate',
    'TrainingSession',
    'TrainingAssignment',
    'PerformanceData',
    'Competition',
    'CompetitionEntry',
    'Payment',
    'Communication',
    'MedicalRecord',
    'File',
    'AuditLog',
  ];

  private isMultiTenantModel(model: string | undefined): boolean {
    return model ? this.multiTenantModels.includes(model) : false;
  }

  private hasClubIdFilter(params: any): boolean {
    const where = params.args?.where;
    return where && (where.clubId !== undefined || where.club?.id !== undefined);
  }

  private addClubIdFilter(params: any, clubId: string): void {
    if (!params.args) {
      params.args = {};
    }

    if (!params.args.where) {
      params.args.where = {};
    }

    // Add clubId filter if not already present
    if (params.args.where.clubId === undefined) {
      params.args.where.clubId = clubId;
    }
  }

  // Transaction helpers
  async executeInTransaction<T>(
    fn: (
      prisma: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>,
    ) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (prisma) => {
      // Preserve context in transaction
      const txPrisma = prisma as PrismaService;
      txPrisma.setClubContext(this.getCurrentClubId() || '');
      txPrisma.setUserContext(this.getCurrentUserId() || '');

      return fn(txPrisma);
    });
  }

  // Soft delete helpers
  async softDelete<T extends { isActive?: boolean }>(
    model: string,
    where: Record<string, any>,
  ): Promise<T> {
    const prismaModel = (this as any)[model.toLowerCase()];
    if (!prismaModel) {
      throw new Error(`Model ${model} not found`);
    }

    return prismaModel.update({
      where,
      data: { isActive: false },
    });
  }

  // Generic pagination helper
  async paginate<T>(
    model: string,
    options: {
      page?: number;
      limit?: number;
      where?: Record<string, any>;
      orderBy?: Record<string, any>;
      include?: Record<string, any>;
      select?: Record<string, any>;
    } = {},
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      where = {},
      orderBy = { createdAt: 'desc' },
      include,
      select,
    } = options;

    const skip = (page - 1) * limit;
    const prismaModel = (this as any)[model.toLowerCase()];

    if (!prismaModel) {
      throw new Error(`Model ${model} not found`);
    }

    const [data, total] = await Promise.all([
      prismaModel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
        select,
      }),
      prismaModel.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  // JSONB query helpers
  async findByJsonPath<T>(
    model: string,
    field: string,
    path: string,
    value: any,
    options: {
      where?: Record<string, any>;
      include?: Record<string, any>;
    } = {},
  ): Promise<T[]> {
    const prismaModel = (this as any)[model.toLowerCase()];
    if (!prismaModel) {
      throw new Error(`Model ${model} not found`);
    }

    const where = {
      ...options.where,
      [field]: {
        path: path.split('.'),
        equals: value,
      },
    };

    return prismaModel.findMany({
      where,
      include: options.include,
    });
  }

  // Performance data specific helpers
  async getAthletePersonalBests(athleteId: string, sport: string): Promise<any> {
    const athlete = await this.athlete.findUnique({
      where: { id: athleteId },
      select: { personalBests: true },
    });

    return athlete?.personalBests || {};
  }

  async updatePersonalBest(athleteId: string, event: string, metrics: any): Promise<void> {
    await this.athlete.update({
      where: { id: athleteId },
      data: {
        personalBests: {
          merge: {
            [event]: metrics,
          },
        },
      },
    });
  }

  // Search helpers with text similarity
  async searchAthletes(
    clubId: string,
    searchTerm: string,
    options: {
      limit?: number;
      include?: Record<string, any>;
    } = {},
  ): Promise<any[]> {
    const { limit = 10, include } = options;

    return this.$queryRaw`
      SELECT a.*, 
             similarity(CONCAT(a.first_name, ' ', a.last_name), ${searchTerm}) as similarity_score
      FROM athletes a
      WHERE a.club_id = ${clubId}::uuid
        AND a.is_active = true
        AND (
          a.first_name ILIKE ${'%' + searchTerm + '%'} OR
          a.last_name ILIKE ${'%' + searchTerm + '%'} OR
          CONCAT(a.first_name, ' ', a.last_name) % ${searchTerm}
        )
      ORDER BY similarity_score DESC, a.first_name ASC
      LIMIT ${limit}
    `;
  }
}
