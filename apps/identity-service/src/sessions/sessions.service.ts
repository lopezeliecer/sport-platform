import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSessionStatus } from '@sports-platform/shared/database/prisma/generated/client';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { createHash, randomBytes } from 'crypto';

export interface CreateSessionData {
  userId: string;
  clubId?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  currentClubId?: string;
  deviceInfo: string;
  ipAddress?: string;
  userAgent?: string;
  status: AuthSessionStatus;
  expiresAt: Date;
  refreshExpiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  isActive: boolean;
}

@Injectable()
export class SessionsService {
  private readonly JWT_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_EXPIRY = '7d'; // 7 days

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createSession(
    data: CreateSessionData,
    userRoles: any[],
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    sessionId: string;
  }> {
    const sessionToken = this.generateSecureToken();
    const refreshToken = this.generateSecureToken();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days

    // Create session in database
    const session = await this.prisma.userSession.create({
      data: {
        userId: data.userId,
        currentClubId: data.clubId,
        sessionToken,
        refreshToken,
        deviceInfo: data.deviceInfo || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceFingerprint: data.deviceFingerprint,
        status: AuthSessionStatus.ACTIVE,
        expiresAt,
        refreshExpiresAt,
      },
    });

    // Create JWT payload
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: data.userId,
      email: userRoles[0]?.user?.email || '',
      sessionId: session.id,
      clubId: data.clubId,
      roles: userRoles.map((role) => ({
        clubId: role.clubId,
        role: role.role,
        permissions: role.permissions || [],
      })),
    };

    // Generate JWT
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_EXPIRY,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      sessionId: session.id,
    };
  }

  async refreshSession(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Find and validate refresh token
    const session = await this.prisma.userSession.findFirst({
      where: {
        refreshToken,
        status: AuthSessionStatus.ACTIVE,
        refreshExpiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            userClubRoles: {
              where: { isActive: true },
              include: {
                club: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const newSessionToken = this.generateSecureToken();
    const newRefreshToken = this.generateSecureToken();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    // Update session with new tokens
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        sessionToken: newSessionToken,
        refreshToken: newRefreshToken,
        expiresAt,
        refreshExpiresAt,
        lastActivityAt: new Date(),
      },
    });

    // Create new JWT
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: session.userId,
      email: session.user.email,
      sessionId: session.id,
      clubId: session.currentClubId,
      roles: session.user.userClubRoles.map((role) => ({
        clubId: role.clubId,
        role: role.role,
        permissions: role.permissions || [],
      })),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_EXPIRY,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60,
    };
  }

  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      currentClubId: session.currentClubId,
      deviceInfo: session.deviceInfo.toString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      status: session.status,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      isActive: session.status === AuthSessionStatus.ACTIVE && session.expiresAt > new Date(),
    };
  }

  async updateLastActivity(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }

  async switchClub(sessionId: string, clubId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { currentClubId: clubId },
    });
  }

  async revokeSession(sessionId: string, revokedBy?: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy,
      },
    });
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const whereCondition: { id?: object; userId: string; status: keyof typeof AuthSessionStatus } =
      {
        userId,
        status: AuthSessionStatus.ACTIVE,
      };

    if (exceptSessionId) {
      whereCondition.id = { not: exceptSessionId };
    }

    await this.prisma.userSession.updateMany({
      where: whereCondition,
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }

  async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        status: AuthSessionStatus.ACTIVE,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      currentClubId: session.currentClubId,
      deviceInfo: session.deviceInfo.toString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      status: session.status,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      isActive: true,
    }));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        status: AuthSessionStatus.ACTIVE,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: AuthSessionStatus.EXPIRED,
      },
    });
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
