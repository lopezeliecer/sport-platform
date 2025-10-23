// Database service and module exports
export * from './prisma.service';
export * from './database.module';

// Type exports
export * from './types/sports.types';

// Utility exports - rename ClubContext to avoid conflicts
export {
  MultiTenantService,
  ClubContext as RequireClubContext,
  RequireClubAdmin,
  Public,
  applyClubFilter,
  createClubContext,
  validateResourceOwnership,
  extractClubId,
  extractUserId,
} from './utils/multi-tenant.util';
export * from './utils/jsonb.util';
export * from './utils/pagination.util';

// Re-export Prisma client and types
export { PrismaClient } from '@prisma/client';
export * from '../prisma/generated/client';
