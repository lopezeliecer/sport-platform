import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Delete,
  Res,
  Query,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { EnhancedSessionsService } from "../sessions/enhanced-sessions-v2.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RbacGuard } from "./guards/rbac.guard";
import { ClubContextMiddleware } from "./middleware/club-context.middleware";
import {
  CurrentUser,
  CurrentClubId,
  ClubContext,
} from "./middleware/club-context.middleware";
import {
  RequireClubAdmin,
  RequireClubContext,
  CanManageAthletes,
} from "./decorators/permissions.decorator";
import { GoogleAuthDto, AuthResponseDto } from "./dto/auth.dto";
import { JwtPayload } from "./strategies/jwt.strategy";
import {
  ThrottleLogin,
  ThrottleAPI,
  ThrottleStrict,
  SkipThrottle,
} from "../../../../libs/shared/common/src/security/throttle.decorators";
import { Public } from "./decorators/auth.decorators";
import {
  RequireApiKey,
  ApiKeyPermissions,
  AllowedServices,
} from "../../../../libs/shared/common/src/security/api-key.guard";

@ApiTags("Authentication & Authorization")
@Controller("auth")
export class EnhancedAuthController {
  private readonly logger = new Logger(EnhancedAuthController.name);

  constructor(
    private authService: AuthService,
    private sessionsService: EnhancedSessionsService
  ) {}

  @Post("google")
  @ThrottleLogin() // 3 requests per minute for auth
  @ApiOperation({ summary: "Google OAuth authentication" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: AuthResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Request() req: any
  ): Promise<AuthResponseDto> {
    this.logger.log("Google OAuth authentication initiated");

    // Extraer información del dispositivo
    const deviceInfo = {
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
      deviceType: this.detectDeviceType(req.headers["user-agent"]),
    };

    // Usar el AuthService existente para crear/encontrar usuario
    const authResult = await this.authService.googleAuth(
      googleAuthDto,
      deviceInfo.ip,
      deviceInfo.userAgent
    );

    // Crear sesión enhanced con el nuevo sistema
    const sessionResult = await this.sessionsService.createSession({
      userId: authResult.user.id,
      deviceInfo,
      clubId: authResult.defaultClubId,
    });

    this.logger.log(
      `Usuario ${authResult.user.email} autenticado exitosamente`
    );

    return {
      accessToken: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      user: authResult.user,
      clubs: authResult.clubs,
      defaultClubId: authResult.defaultClubId,
      expiresIn: 900, // 15 minutos
      tokenType: "Bearer",
    };
  }

  @Post("refresh")
  @ThrottleAPI() // 30 requests per minute for refresh
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body("refreshToken") refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokens = await this.sessionsService.refreshTokens(refreshToken);

    return {
      ...tokens,
      expiresIn: 900, // 15 minutos
    };
  }

  @Post("switch-club/:clubId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Switch club context without re-authentication" })
  @ApiResponse({
    status: 200,
    description: "Club context switched successfully",
  })
  @HttpCode(HttpStatus.OK)
  async switchClub(
    @Param("clubId") clubId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<{ accessToken: string; clubId: string; message: string }> {
    const accessToken = await this.sessionsService.switchClubContext(
      user.sessionId,
      clubId
    );

    return {
      accessToken,
      clubId,
      message: "Contexto de club cambiado exitosamente",
    };
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user active sessions (multi-device)" })
  @ApiResponse({
    status: 200,
    description: "User sessions retrieved successfully",
  })
  async getUserSessions(@CurrentUser() user: JwtPayload) {
    const sessions = await this.sessionsService.getUserSessions(user.sub);
    return {
      message: "Sesiones activas",
      sessions,
      totalSessions: sessions.length,
    };
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke specific session" })
  @ApiResponse({ status: 200, description: "Session revoked successfully" })
  async revokeSession(
    @Param("sessionId") sessionId: string,
    @CurrentUser() user: JwtPayload
  ) {
    await this.sessionsService.revokeSession(sessionId, user.sub);
    return {
      message: "Sesión revocada exitosamente",
      revokedSessionId: sessionId,
    };
  }

  @Delete("sessions/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke all sessions except current" })
  @ApiResponse({
    status: 200,
    description: "All sessions revoked successfully",
  })
  async revokeAllSessions(@CurrentUser() user: JwtPayload) {
    await this.sessionsService.revokeAllUserSessions(user.sub, user.sessionId);
    return {
      message: "Todas las sesiones revocadas exitosamente (excepto la actual)",
      currentSessionId: user.sessionId,
    };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireClubContext()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user profile with club context" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  async getProfile(
    @CurrentUser() user: JwtPayload,
    @CurrentClubId() clubId: string,
    @ClubContext() clubContext: any
  ) {
    return {
      message: "Perfil de usuario",
      user: {
        id: user.sub,
        email: user.email,
        currentClub: clubId,
        roles: clubContext.userRoles,
        permissions: clubContext.permissions,
      },
      clubContext,
    };
  }

  @Get("permissions")
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireClubContext()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user permissions in current club" })
  @ApiResponse({
    status: 200,
    description: "User permissions retrieved successfully",
  })
  async getPermissions(@ClubContext() clubContext: any) {
    return {
      message: "Permisos del usuario en el club actual",
      clubId: clubContext.clubId,
      roles: clubContext.userRoles,
      permissions: clubContext.permissions,
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout from current session" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: JwtPayload) {
    await this.sessionsService.revokeSession(user.sessionId, user.sub);

    this.logger.log(`Usuario ${user.email} cerró sesión`);

    return {
      message: "Sesión cerrada exitosamente",
      sessionId: user.sessionId,
    };
  }

  @Get("health")
  @SkipThrottle() // Skip throttling for health checks
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  healthCheck(): { status: string; timestamp: string; service: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "enhanced-auth-controller",
    };
  }

  @Get("google")
  @Public()
  @ApiOperation({
    summary: "Initiate Google OAuth flow",
    description: "Redirect to Google OAuth authorization page",
  })
  @ApiResponse({
    status: 302,
    description: "Redirect to Google OAuth",
  })
  googleAuthInit(@Res() res: Response) {
    // Check if Google OAuth is properly configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3001/api/v1/auth/google/callback";

    if (!clientId) {
      return res.status(500).json({
        error: "Google OAuth not configured",
        message: "GOOGLE_CLIENT_ID environment variable is missing",
      });
    }

    // Real Google OAuth URL construction
    const googleAuthUrl = new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "email profile openid");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");

    // For API testing, return the URL instead of redirecting
    if (process.env.NODE_ENV === "development") {
      return res.json({
        message: "Google OAuth flow initiated",
        authUrl: googleAuthUrl.toString(),
        redirectUri,
        status: "ready_for_oauth",
      });
    }

    // In production, redirect to Google
    return res.redirect(googleAuthUrl.toString());
  }

  @Get("google/callback")
  @Public()
  @ApiOperation({
    summary: "Handle Google OAuth callback",
    description: "Process the authorization code from Google OAuth",
  })
  @ApiResponse({
    status: 200,
    description: "User authenticated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "OAuth error",
  })
  async googleCallback(
    @Query("code") code: string,
    @Query("error") error: string,
    @Res() res: Response
  ) {
    if (error) {
      return res.status(400).json({
        error: "OAuth error",
        message: error,
        status: "oauth_failed",
      });
    }

    if (!code) {
      return res.status(400).json({
        error: "Missing authorization code",
        message: "No authorization code received from Google",
        status: "oauth_failed",
      });
    }

    try {
      // Exchange code for access token and authenticate user
      const authResult =
        await this.authService.authenticateWithGoogleCode(code);

      return res.json({
        message: "Authentication successful",
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn,
        status: "authenticated",
      });
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      return res.status(500).json({
        error: "Authentication failed",
        message: "Failed to process Google OAuth callback",
        status: "oauth_failed",
      });
    }
  }

  // Service-to-Service API Key Protected Endpoints

  @Get("service/verify-token")
  @RequireApiKey()
  @ApiKeyPermissions("auth:verify")
  @AllowedServices("api-gateway", "sports-service", "club-management")
  @SkipThrottle() // Internal service calls don't need throttling
  @ApiOperation({
    summary: "Verify JWT token (Service-to-Service)",
    description:
      "Validates a JWT token for other services. Requires API key authentication.",
  })
  @ApiResponse({
    status: 200,
    description: "Token is valid",
    schema: {
      type: "object",
      properties: {
        valid: { type: "boolean" },
        user: { type: "object" },
        clubId: { type: "string" },
        permissions: { type: "array" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid token or API key" })
  async verifyTokenForService(
    @Query("token") token: string,
    @Request() req: any
  ) {
    try {
      // Verify the JWT token
      const payload = await this.authService.verifyJwtToken(token);

      // Get session information
      const session = await this.sessionsService.getSessionById(
        payload.sessionId
      );

      return {
        valid: true,
        user: {
          id: payload.sub,
          email: payload.email,
          sessionId: payload.sessionId,
        },
        clubId: session?.currentClubId,
        permissions: [], // Would need to calculate from session data
        requestedBy: req.service, // API key service name
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        requestedBy: req.service,
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  @Post("service/create-service-token")
  @RequireApiKey()
  @ApiKeyPermissions("user:write", "session:manage")
  @AllowedServices("api-gateway", "identity-service")
  @ThrottleStrict() // Very limited for security
  @ApiOperation({
    summary: "Create service token (Service-to-Service)",
    description:
      "Creates a service-specific token for system operations. Requires high-level API key permissions.",
  })
  @ApiResponse({
    status: 201,
    description: "Service token created successfully",
  })
  async createServiceToken(
    @Body()
    createTokenDto: {
      service: string;
      permissions: string[];
      expiresInMinutes?: number;
    },
    @Request() req: any
  ) {
    const serviceToken = await this.authService.createServiceToken(
      createTokenDto.service,
      createTokenDto.permissions,
      createTokenDto.expiresInMinutes || 60 // Default 1 hour
    );

    this.logger.log(
      `Service token created for ${createTokenDto.service} by ${req.service}`
    );

    return {
      serviceToken,
      expiresIn: createTokenDto.expiresInMinutes || 60,
      createdBy: req.service,
      createdAt: new Date().toISOString(),
    };
  }

  @Get("service/user/:userId/profile")
  @RequireApiKey()
  @ApiKeyPermissions("user:read")
  @AllowedServices("sports-service", "club-management", "communication")
  @SkipThrottle()
  @ApiOperation({
    summary: "Get user profile (Service-to-Service)",
    description:
      "Retrieves user profile for other services. Requires API key with user:read permission.",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
  })
  async getUserProfileForService(
    @Param("userId") userId: string,
    @Request() req: any
  ) {
    const user = await this.authService.getUserProfile(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePicture,
        isActive: user.isActive,
      },
      requestedBy: req.service,
      retrievedAt: new Date().toISOString(),
    };
  }

  @Get("service/sessions/active-count")
  @RequireApiKey()
  @ApiKeyPermissions("session:manage")
  @AllowedServices("api-gateway", "identity-service")
  @SkipThrottle()
  @ApiOperation({
    summary: "Get active sessions count (Service-to-Service)",
    description:
      "Returns the count of active sessions for monitoring purposes.",
  })
  @ApiResponse({
    status: 200,
    description: "Active sessions count retrieved",
  })
  async getActiveSessionsCount(@Request() req: any) {
    const count = await this.sessionsService.getActiveSessionsCount();

    return {
      activeSessionsCount: count,
      requestedBy: req.service,
      timestamp: new Date().toISOString(),
    };
  }

  // Métodos privados

  private detectDeviceType(
    userAgent?: string
  ): "mobile" | "desktop" | "tablet" {
    if (!userAgent) return "desktop";

    const ua = userAgent.toLowerCase();

    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return "mobile";
    }

    if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    }

    return "desktop";
  }
}
