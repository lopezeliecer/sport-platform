// Multi-tenant utilities for club-based access control and context management

import { Injectable, SetMetadata, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';

// ============================================================================
// METADATA KEYS AND DECORATORS
// ============================================================================

export const CLUB_CONTEXT_KEY = 'club_context';
export const REQUIRE_CLUB_ADMIN = 'require_club_admin';
export const PUBLIC_ENDPOINT = 'public_endpoint';

// Decorator to require club context
export const ClubContext = () => SetMetadata(CLUB_CONTEXT_KEY, true);

// Decorator to require club admin privileges
export const RequireClubAdmin = () => SetMetadata(REQUIRE_CLUB_ADMIN, true);

// Decorator to mark endpoints as public (bypass club context)
export const Public = () => SetMetadata(PUBLIC_ENDPOINT, true);

// ============================================================================
// MULTI-TENANT SERVICE
// ============================================================================

@Injectable()
export class MultiTenantService {
  constructor(private reflector: Reflector) {}

  /**
   * Validates club access for a user
   */
  async validateClubAccess(
    userId: string,
    clubId: string,
    prisma: PrismaClient,
    requiredRoles?: string[],
  ): Promise<boolean> {
    try {
      const clubMember = await prisma.clubMember.findFirst({
        where: {
          userId,
          clubId,
          isActive: true,
        },
        include: {
          club: {
            select: {
              isActive: true,
            },
          },
        },
      });

      if (!clubMember || !clubMember.club.isActive) {
        return false;
      }

      if (requiredRoles && requiredRoles.length > 0) {
        return requiredRoles.includes(clubMember.role);
      }

      return true;
    } catch (error) {
      console.error('Error validating club access:', error);
      return false;
    }
  }

  /**
   * Gets user's role in a specific club
   */
  async getUserClubRole(
    userId: string,
    clubId: string,
    prisma: PrismaClient,
  ): Promise<string | null> {
    try {
      const clubMember = await prisma.clubMember.findFirst({
        where: {
          userId,
          clubId,
          isActive: true,
        },
        select: {
          role: true,
        },
      });

      return clubMember?.role || null;
    } catch (error) {
      console.error('Error getting user club role:', error);
      return null;
    }
  }

  /**
   * Gets all clubs accessible by a user
   */
  async getUserClubs(userId: string, prisma: PrismaClient) {
    try {
      const clubMembers = await prisma.clubMember.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          club: {
            name: 'asc',
          },
        },
      });

      return clubMembers
        .filter((member) => member.club.isActive)
        .map((member) => ({
          ...member.club,
          role: member.role,
          joinedAt: member.joinedAt,
        }));
    } catch (error) {
      console.error('Error getting user clubs:', error);
      return [];
    }
  }

  /**
   * Checks if endpoint requires club context
   */
  isClubContextRequired(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(CLUB_CONTEXT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  /**
   * Checks if endpoint requires club admin privileges
   */
  isClubAdminRequired(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(REQUIRE_CLUB_ADMIN, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  /**
   * Checks if endpoint is public
   */
  isPublicEndpoint(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ENDPOINT, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Applies club-based filtering to Prisma queries
 */
export function applyClubFilter(clubId: string, baseWhere: any = {}) {
  return {
    ...baseWhere,
    clubId,
  };
}

/**
 * Creates a club context for multi-tenant operations
 */
export function createClubContext(clubId: string, userId: string) {
  return {
    clubId,
    userId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates club ownership of a resource
 */
export async function validateResourceOwnership(
  resourceClubId: string,
  requestClubId: string,
): Promise<boolean> {
  return resourceClubId === requestClubId;
}

/**
 * Helper to extract club ID from request headers or context
 */
export function extractClubId(request: any): string | null {
  // Check headers first
  if (request.headers['x-club-id']) {
    return request.headers['x-club-id'];
  }

  // Check query parameters
  if (request.query?.clubId) {
    return request.query.clubId;
  }

  // Check route parameters
  if (request.params?.clubId) {
    return request.params.clubId;
  }

  return null;
}

/**
 * Helper to extract user ID from JWT token or request context
 */
export function extractUserId(request: any): string | null {
  // Check user context from JWT
  if (request.user?.id) {
    return request.user.id;
  }

  // Check user sub from JWT
  if (request.user?.sub) {
    return request.user.sub;
  }

  return null;
}
