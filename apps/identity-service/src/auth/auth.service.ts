import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import {
  AuthProvider,
  UserRole,
} from "@sports-platform/shared/database/prisma/generated/client";
import { SessionsService } from "../sessions/sessions.service";
import {
  GoogleAuthDto,
  LoginDto,
  AuthResponseDto,
  UserInfoDto,
  ClubMembershipDto,
} from "./dto/auth.dto";
import { PermissionChecker } from "../permissions/permissions";
import * as bcrypt from "bcryptjs";

interface GoogleUserInfo {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  emailVerified: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private sessionsService: SessionsService,
    private configService: ConfigService,
    private jwtService: JwtService
  ) {}

  async googleAuth(
    googleAuthDto: GoogleAuthDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponseDto> {
    // Verify Google token and get user info
    const googleUserInfo = await this.verifyGoogleToken(
      googleAuthDto.accessToken
    );

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: googleUserInfo.email },
      include: {
        userClubRoles: {
          where: { isActive: true },
          include: {
            club: true,
          },
        },
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: googleUserInfo.email,
          googleId: googleUserInfo.googleId,
          firstName: googleUserInfo.firstName,
          lastName: googleUserInfo.lastName,
          profilePicture: googleUserInfo.profilePicture,
          emailVerified: googleUserInfo.emailVerified,
          authProvider: AuthProvider.GOOGLE,
          lastLoginAt: new Date(),
        },
        include: {
          userClubRoles: {
            where: { isActive: true },
            include: {
              club: true,
            },
          },
        },
      });
    } else {
      // Update existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUserInfo.googleId,
          profilePicture: googleUserInfo.profilePicture,
          emailVerified: googleUserInfo.emailVerified,
          lastLoginAt: new Date(),
        },
        include: {
          userClubRoles: {
            where: { isActive: true },
            include: {
              club: true,
            },
          },
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Get default club (first club with highest role priority)
    const defaultClub = this.getDefaultClub(user.userClubRoles);

    // Create session
    const sessionData = await this.sessionsService.createSession(
      {
        userId: user.id,
        clubId: defaultClub?.clubId,
        deviceInfo: googleAuthDto.deviceInfo,
        ipAddress,
        userAgent,
      },
      user.userClubRoles
    );

    // Build response
    return {
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      expiresIn: sessionData.expiresIn,
      tokenType: "Bearer",
      user: this.mapToUserInfo(user),
      clubs: this.mapToClubMemberships(user.userClubRoles),
      defaultClubId: defaultClub?.clubId,
    };
  }

  async refreshToken(
    refreshToken: string
  ): Promise<Omit<AuthResponseDto, "user" | "clubs" | "defaultClubId">> {
    const tokenData = await this.sessionsService.refreshSession(refreshToken);

    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      tokenType: "Bearer",
    };
  }

  async logout(sessionId: string, allDevices = false): Promise<void> {
    if (allDevices) {
      const session = await this.sessionsService.validateSession(sessionId);
      if (session) {
        await this.sessionsService.revokeAllUserSessions(session.userId);
      }
    } else {
      await this.sessionsService.revokeSession(sessionId);
    }
  }

  async switchClub(sessionId: string, clubId: string): Promise<void> {
    // Validate that user has access to the target club
    const session = await this.sessionsService.validateSession(sessionId);
    if (!session) {
      throw new UnauthorizedException("Invalid session");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        userClubRoles: {
          where: {
            isActive: true,
            clubId: clubId,
          },
        },
      },
    });

    if (!user || user.userClubRoles.length === 0) {
      throw new UnauthorizedException("Access denied to the requested club");
    }

    await this.sessionsService.switchClub(sessionId, clubId);
  }

  async getUserInfo(userId: string): Promise<UserInfoDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.mapToUserInfo(user);
  }

  async getUserClubs(userId: string): Promise<ClubMembershipDto[]> {
    const userClubRoles = await this.prisma.userClubRole.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        club: true,
      },
    });

    return this.mapToClubMemberships(userClubRoles);
  }

  async getUserActiveSessions(userId: string): Promise<any[]> {
    return this.sessionsService.getUserActiveSessions(userId);
  }

  async revokeSession(sessionId: string, revokedBy?: string): Promise<void> {
    await this.sessionsService.revokeSession(sessionId, revokedBy);
  }

  private async verifyGoogleToken(
    accessToken: string
  ): Promise<GoogleUserInfo> {
    try {
      // Call Google's userinfo endpoint
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new BadRequestException("Invalid Google token");
      }

      const googleUser = await response.json();

      return {
        googleId: googleUser.id,
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        profilePicture: googleUser.picture,
        emailVerified: googleUser.verified_email,
      };
    } catch (error) {
      throw new BadRequestException("Failed to verify Google token");
    }
  }

  private getDefaultClub(userClubRoles: any[]): { clubId: string } | null {
    if (userClubRoles.length === 0) {
      return null;
    }

    // Priority order for roles
    const rolePriority = {
      [UserRole.CLUB_ADMIN]: 1,
      [UserRole.CLUB_DIRECTOR]: 2,
      [UserRole.COACH]: 3,
      [UserRole.MEDICAL_STAFF]: 4,
      [UserRole.ATHLETE]: 5,
      [UserRole.PARENT]: 6,
    };

    // Sort by role priority and return the first one
    const sortedRoles = userClubRoles.sort(
      (a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99)
    );

    return { clubId: sortedRoles[0].clubId };
  }

  private mapToUserInfo(user: any): UserInfoDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      emailVerified: user.emailVerified,
      authProvider: user.authProvider,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    };
  }

  private mapToClubMemberships(userClubRoles: any[]): ClubMembershipDto[] {
    return userClubRoles.map((role) => ({
      clubId: role.clubId,
      clubName: role.club.name,
      clubSlug: role.club.slug,
      clubLogo: role.club.logo,
      role: role.role,
      isActive: role.isActive,
      permissions: PermissionChecker.getPermissionsForRole(role.role).map(
        (p) => p.permission
      ),
      expiresAt: role.expiresAt,
    }));
  }

  /**
   * Generate a test JWT token for validation purposes
   * This method is used for testing JWT functionality without creating actual sessions
   */
  async generateTestToken(payload: any): Promise<string> {
    try {
      // Create a simple test payload
      const testPayload = {
        sub: payload.sub,
        email: payload.email,
        sessionId: "test-session-123",
        clubId: payload.clubId,
        roles: payload.roles || [],
        test: true, // Mark as test token
      };

      return this.jwtService.sign(testPayload);
    } catch (error) {
      throw new BadRequestException(
        `JWT test token generation failed: ${error.message}`
      );
    }
  }

  /**
   * Authenticate user with Google OAuth authorization code
   */
  async authenticateWithGoogleCode(code: string): Promise<AuthResponseDto> {
    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeGoogleCode(code);

      // Get user info from Google
      const googleUserInfo = await this.getGoogleUserInfo(
        tokenResponse.access_token
      );

      // Find or create user and authenticate
      const user = await this.findOrCreateGoogleUser(googleUserInfo);

      // Create session
      const sessionData = await this.sessionsService.createSession(
        {
          userId: user.id,
          clubId: user.defaultClubId,
          deviceInfo: { oauth: true, timestamp: new Date().toISOString() },
          ipAddress: "127.0.0.1", // Should get real IP from request
          userAgent: "OAuth-Flow",
        },
        user.userClubRoles
      );

      // Build response
      return {
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresIn: sessionData.expiresIn,
        tokenType: "Bearer",
        user: this.mapToUserInfo(user),
        clubs: this.mapToClubMemberships(user.userClubRoles),
        defaultClubId: user.defaultClubId,
      };
    } catch (error) {
      console.error("Google OAuth authentication error:", error);
      throw new BadRequestException("Failed to authenticate with Google OAuth");
    }
  }

  /**
   * Exchange Google OAuth authorization code for access token
   */
  private async exchangeGoogleCode(code: string) {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");
    const redirectUri =
      this.configService.get<string>("GOOGLE_REDIRECT_URI") ||
      "http://localhost:3001/api/v1/auth/google/callback";

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const tokenUrl = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(
        `Token exchange failed: ${response.status} - ${errorData}`
      );
    }

    return await response.json();
  }

  /**
   * Get user information from Google using access token
   */
  private async getGoogleUserInfo(accessToken: string) {
    const userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Find existing user or create new one from Google user info
   */
  private async findOrCreateGoogleUser(googleUserInfo: any) {
    const {
      id: googleId,
      email,
      given_name,
      family_name,
      picture,
      verified_email,
    } = googleUserInfo;

    // Check if user exists by Google ID or email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleId }, { email: email }],
      },
      include: {
        userClubRoles: {
          where: { isActive: true },
          include: {
            club: true,
          },
        },
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          firstName: given_name || "Unknown",
          lastName: family_name || "User",
          profilePicture: picture,
          emailVerified: verified_email || false,
          authProvider: AuthProvider.GOOGLE,
          lastLoginAt: new Date(),
        },
        include: {
          userClubRoles: {
            where: { isActive: true },
            include: {
              club: true,
            },
          },
        },
      });
    } else {
      // Update existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleId, // Link Google ID if not already linked
          firstName: given_name || user.firstName,
          lastName: family_name || user.lastName,
          profilePicture: picture || user.profilePicture,
          emailVerified: verified_email || user.emailVerified,
          lastLoginAt: new Date(),
        },
        include: {
          userClubRoles: {
            where: { isActive: true },
            include: {
              club: true,
            },
          },
        },
      });
    }

    // Add default club ID for easy access
    const defaultClub = this.getDefaultClub(user.userClubRoles);
    return {
      ...user,
      defaultClubId: defaultClub?.clubId || null,
    };
  }

  // Service-to-Service Authentication Methods

  async verifyJwtToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException("Invalid JWT token");
    }
  }

  async createServiceToken(
    service: string,
    permissions: string[],
    expiresInMinutes: number = 60
  ): Promise<string> {
    const payload = {
      sub: `service:${service}`,
      service,
      permissions,
      type: "service",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
    };

    return this.jwtService.sign(payload, {
      expiresIn: `${expiresInMinutes}m`,
    });
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}
