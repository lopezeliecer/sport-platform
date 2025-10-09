import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import {
  UserSession,
  AuthSessionStatus,
} from "@sports-platform/shared/database/prisma/generated/client";
import { randomBytes, createHash } from "crypto";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  clubId?: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface CreateSessionDto {
  userId: string;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    deviceType?: "mobile" | "desktop" | "tablet";
    browserName?: string;
    os?: string;
  };
  clubId?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: any;
  lastAccessed: Date;
  isActive: boolean;
  currentClubId?: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class EnhancedSessionsService {
  private readonly logger = new Logger(EnhancedSessionsService.name);
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly REFRESH_SECRET: string;
  private readonly REFRESH_EXPIRES_IN: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.JWT_SECRET =
      this.configService.get<string>("JWT_SECRET") || "development-jwt-secret";
    this.JWT_EXPIRES_IN =
      this.configService.get<string>("JWT_EXPIRES_IN") || "15m";
    this.REFRESH_SECRET =
      this.configService.get<string>("REFRESH_SECRET") ||
      "development-refresh-secret";
    this.REFRESH_EXPIRES_IN =
      this.configService.get<string>("REFRESH_EXPIRES_IN") || "7d";
  }

  /**
   * Crear nueva sesión multi-dispositivo
   */
  async createSession(createSessionDto: CreateSessionDto): Promise<{
    accessToken: string;
    refreshToken: string;
    session: UserSession;
  }> {
    const { userId, deviceInfo, clubId } = createSessionDto;

    // Generar tokens únicos
    const sessionToken = this.generateSecureToken();
    const refreshTokenValue = this.generateSecureToken();

    // Calcular fechas de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30); // 30 días

    // Crear sesión en base de datos
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        refreshToken: this.hashToken(refreshTokenValue),
        deviceInfo: deviceInfo || {},
        currentClubId: clubId,
        expiresAt,
        refreshExpiresAt,
        ipAddress: deviceInfo?.ip,
        userAgent: deviceInfo?.userAgent,
        deviceFingerprint: this.generateDeviceFingerprint(deviceInfo),
        status: AuthSessionStatus.ACTIVE,
      },
    });

    // Obtener datos del usuario para el JWT
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userClubRoles: {
          where: { isActive: true },
          include: { club: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    // Preparar payload para JWT
    const roles = user.userClubRoles
      .filter((role) => !clubId || role.clubId === clubId)
      .map((role) => role.role);

    const permissions = this.extractPermissions(roles);

    const jwtPayload: JwtPayload = {
      sub: userId,
      email: user.email,
      clubId: clubId || user.userClubRoles[0]?.clubId,
      roles,
      permissions,
      sessionId: session.id,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      sessionId: session.id,
    };

    // Generar tokens
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.REFRESH_SECRET,
      expiresIn: this.REFRESH_EXPIRES_IN,
    });

    this.logger.log(
      `Nueva sesión creada para usuario ${userId} en dispositivo ${deviceInfo?.deviceType || "unknown"}`
    );

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  /**
   * Renovar tokens usando refresh token
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verificar refresh token
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.REFRESH_SECRET,
        }
      );

      // Buscar sesión activa
      const session = await this.prisma.userSession.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          status: AuthSessionStatus.ACTIVE,
          expiresAt: { gt: new Date() },
          refreshExpiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              userClubRoles: {
                where: { isActive: true },
                include: { club: true },
              },
            },
          },
        },
      });

      if (!session) {
        this.logger.warn(
          `Intento de refresh con token inválido para sesión ${payload.sessionId}`
        );
        throw new UnauthorizedException("Refresh token inválido");
      }

      // Generar nuevos tokens
      const newRefreshTokenValue = this.generateSecureToken();

      // Actualizar sesión con nuevo refresh token
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: this.hashToken(newRefreshTokenValue),
          lastActivityAt: new Date(),
        },
      });

      // Preparar nuevo JWT payload
      const roles = session.user.userClubRoles
        .filter(
          (role) =>
            !session.currentClubId || role.clubId === session.currentClubId
        )
        .map((role) => role.role);

      const permissions = this.extractPermissions(roles);

      const jwtPayload: JwtPayload = {
        sub: session.userId,
        email: session.user.email,
        clubId: session.currentClubId || session.user.userClubRoles[0]?.clubId,
        roles,
        permissions,
        sessionId: session.id,
      };

      const refreshPayload: RefreshTokenPayload = {
        sub: session.userId,
        sessionId: session.id,
      };

      // Generar nuevos tokens
      const accessToken = this.jwtService.sign(jwtPayload, {
        secret: this.JWT_SECRET,
        expiresIn: this.JWT_EXPIRES_IN,
      });

      const newRefreshToken = this.jwtService.sign(refreshPayload, {
        secret: this.REFRESH_SECRET,
        expiresIn: this.REFRESH_EXPIRES_IN,
      });

      this.logger.log(
        `Tokens renovados para usuario ${session.userId}, sesión ${session.id}`
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(`Error al renovar tokens: ${error.message}`);
      throw new UnauthorizedException("Refresh token inválido");
    }
  }

  /**
   * Cambiar contexto de club sin re-autenticación
   */
  async switchClubContext(sessionId: string, clubId: string): Promise<string> {
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        status: AuthSessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userClubRoles: {
              where: { isActive: true, clubId },
              include: { club: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException("Sesión inválida");
    }

    if (session.user.userClubRoles.length === 0) {
      throw new UnauthorizedException("No tienes permisos en este club");
    }

    // Actualizar club actual en sesión
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { currentClubId: clubId },
    });

    // Generar nuevo JWT con contexto del nuevo club
    const roles = session.user.userClubRoles.map((role) => role.role);
    const permissions = this.extractPermissions(roles);

    const jwtPayload: JwtPayload = {
      sub: session.userId,
      email: session.user.email,
      clubId,
      roles,
      permissions,
      sessionId: session.id,
    };

    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_EXPIRES_IN,
    });

    this.logger.log(`Usuario ${session.userId} cambió a club ${clubId}`);

    return accessToken;
  }

  /**
   * Obtener sesiones activas del usuario
   */
  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        status: AuthSessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivityAt: "desc" },
    });

    return sessions.map((session) => ({
      sessionId: session.id,
      userId: session.userId,
      deviceInfo: session.deviceInfo,
      lastAccessed: session.lastActivityAt,
      isActive: session.status === AuthSessionStatus.ACTIVE,
      currentClubId: session.currentClubId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }));
  }

  /**
   * Revocar sesión específica
   */
  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Sesión ${sessionId} revocada para usuario ${userId}`);
  }

  /**
   * Revocar todas las sesiones del usuario (excepto la actual)
   */
  async revokeAllUserSessions(
    userId: string,
    excludeSessionId?: string
  ): Promise<void> {
    const where: any = {
      userId,
      status: AuthSessionStatus.ACTIVE,
    };

    if (excludeSessionId) {
      where.id = { not: excludeSessionId };
    }

    await this.prisma.userSession.updateMany({
      where,
      data: {
        status: AuthSessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    this.logger.log(
      `Todas las sesiones revocadas para usuario ${userId}${excludeSessionId ? ` (excepto ${excludeSessionId})` : ""}`
    );
  }

  /**
   * Validar sesión activa
   */
  async validateSession(sessionId: string): Promise<UserSession | null> {
    return this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        status: AuthSessionStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userClubRoles: {
              where: { isActive: true },
              include: { club: true },
            },
          },
        },
      },
    });
  }

  /**
   * Cleanup de sesiones expiradas
   */
  async cleanupExpiredSessions(): Promise<void> {
    const expiredCount = await this.prisma.userSession.updateMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { refreshExpiresAt: { lt: new Date() } },
        ],
        status: AuthSessionStatus.ACTIVE,
      },
      data: {
        status: AuthSessionStatus.EXPIRED,
      },
    });

    this.logger.log(
      `${expiredCount.count} sesiones expiradas marcadas para limpieza`
    );
  }

  // Métodos privados

  private generateSecureToken(): string {
    return randomBytes(32).toString("hex");
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private generateDeviceFingerprint(deviceInfo?: any): string {
    if (!deviceInfo) return this.generateSecureToken();

    const fingerprint = `${deviceInfo.userAgent || ""}${deviceInfo.ip || ""}${deviceInfo.browserName || ""}${deviceInfo.os || ""}`;
    return createHash("md5").update(fingerprint).digest("hex");
  }

  private extractPermissions(roles: string[]): string[] {
    // Implementación básica - en producción esto sería más complejo
    const allPermissions = new Set<string>();

    roles.forEach((role) => {
      // Agregar permisos base según el rol
      switch (role) {
        case "CLUB_ADMIN":
          allPermissions.add("*");
          break;
        case "COACH":
          allPermissions.add("athletes:read");
          allPermissions.add("training:*");
          allPermissions.add("performance:*");
          break;
        case "ATHLETE":
          allPermissions.add("training:read:own");
          allPermissions.add("performance:*:own");
          break;
        case "MEDICAL_STAFF":
          allPermissions.add("medical:*");
          allPermissions.add("athletes:read");
          break;
        case "PARENT":
          allPermissions.add("athletes:read:children");
          allPermissions.add("payments:*:children");
          break;
        case "CLUB_DIRECTOR":
          allPermissions.add("reports:*");
          allPermissions.add("analytics:*");
          break;
      }
    });

    return Array.from(allPermissions);
  }

  // Service-to-Service methods

  async getSessionById(sessionId: string) {
    return await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
  }

  async getActiveSessionsCount(): Promise<number> {
    return await this.prisma.userSession.count({
      where: {
        status: "ACTIVE",
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }
}
