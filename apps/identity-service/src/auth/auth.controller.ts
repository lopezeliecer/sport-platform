import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
  Delete,
  Param,
  Query,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  GoogleAuthDto,
  RefreshTokenDto,
  AuthResponseDto,
  LogoutDto,
  SwitchClubDto,
  UserInfoDto,
  ClubMembershipDto,
  SessionInfoDto,
  RevokeSessionDto,
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/auth.decorators";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

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

  @Post("google")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Google OAuth authentication",
    description: "Authenticate user with Google OAuth token and create session",
  })
  @ApiResponse({
    status: 200,
    description: "User authenticated successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid Google token",
  })
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Req() req: Request
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    return this.authService.googleAuth(googleAuthDto, ipAddress, userAgent);
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description: "Get new access token using refresh token",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Invalid refresh token",
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<Omit<AuthResponseDto, "user" | "clubs" | "defaultClubId">> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Logout user",
    description: "Logout user and revoke session(s)",
  })
  @ApiResponse({
    status: 204,
    description: "User logged out successfully",
  })
  async logout(@Body() logoutDto: LogoutDto, @Req() req: any): Promise<void> {
    await this.authService.logout(req.user.sessionId, logoutDto.allDevices);
  }

  @Post("switch-club")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Switch active club context",
    description: "Change the active club context for the current session",
  })
  @ApiResponse({
    status: 200,
    description: "Club context switched successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Access denied to the requested club",
  })
  async switchClub(
    @Body() switchClubDto: SwitchClubDto,
    @Req() req: any
  ): Promise<{ message: string }> {
    await this.authService.switchClub(req.user.sessionId, switchClubDto.clubId);
    return { message: "Club context switched successfully" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user info",
    description: "Get information about the currently authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "User information retrieved successfully",
    type: UserInfoDto,
  })
  async getCurrentUser(@Req() req: any): Promise<UserInfoDto> {
    return this.authService.getUserInfo(req.user.userId);
  }

  @Get("clubs")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user club memberships",
    description: "Get all clubs where the user has roles and permissions",
  })
  @ApiResponse({
    status: 200,
    description: "Club memberships retrieved successfully",
    type: [ClubMembershipDto],
  })
  async getUserClubs(@Req() req: any): Promise<ClubMembershipDto[]> {
    return this.authService.getUserClubs(req.user.userId);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get active sessions",
    description: "Get all active sessions for the current user",
  })
  @ApiResponse({
    status: 200,
    description: "Active sessions retrieved successfully",
    type: [SessionInfoDto],
  })
  async getActiveSessions(@Req() req: any): Promise<SessionInfoDto[]> {
    const sessions = await this.authService.getUserActiveSessions(
      req.user.userId
    );

    return sessions.map((session) => ({
      id: session.id,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      status: session.status,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === req.user.sessionId,
    }));
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Revoke session",
    description: "Revoke a specific session",
  })
  @ApiResponse({
    status: 204,
    description: "Session revoked successfully",
  })
  async revokeSession(
    @Param("sessionId") sessionId: string,
    @Req() req: any
  ): Promise<void> {
    await this.authService.revokeSession(sessionId, req.user.userId);
  }

  @Get("health")
  @Public()
  @ApiOperation({
    summary: "Health check",
    description: "Check if the authentication service is healthy",
  })
  @ApiResponse({
    status: 200,
    description: "Service is healthy",
  })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("jwt-test")
  @Public()
  @ApiOperation({
    summary: "JWT functionality test",
    description: "Test JWT token generation and validation (mock)",
  })
  @ApiResponse({
    status: 200,
    description: "JWT test completed successfully",
  })
  async jwtTest(): Promise<{
    message: string;
    tokenGenerated: boolean;
    timestamp: string;
    mockPayload: any;
  }> {
    // Test JWT generation with mock data
    try {
      const mockPayload = {
        sub: "test-user-123",
        email: "test@example.com",
        sessionId: "test-session-456",
        clubId: "test-club-789",
        roles: [
          {
            clubId: "test-club-789",
            role: "MEMBER",
            permissions: ["view_profile"],
          },
        ],
      };

      // Generate a test token (without saving to DB)
      const testToken = await this.authService.generateTestToken(mockPayload);

      return {
        message: "JWT foundation is working correctly",
        tokenGenerated: !!testToken,
        timestamp: new Date().toISOString(),
        mockPayload,
      };
    } catch (error) {
      return {
        message: `JWT test failed: ${error.message}`,
        tokenGenerated: false,
        timestamp: new Date().toISOString(),
        mockPayload: null,
      };
    }
  }

  @Get("config-check")
  @Public()
  @ApiOperation({
    summary: "Check OAuth configuration",
    description: "Check the current OAuth configuration status",
  })
  @ApiResponse({
    status: 200,
    description: "Configuration status retrieved successfully",
  })
  configCheck(): {
    message: string;
    googleOAuth: {
      clientIdConfigured: boolean;
      clientSecretConfigured: boolean;
      redirectUri: string;
      status: string;
    };
    environment: string;
    timestamp: string;
  } {
    const hasGoogleClientId =
      !!process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_ID !== "your-google-client-id";
    const hasGoogleClientSecret =
      !!process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_SECRET !== "your-google-client-secret";
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      process.env.GOOGLE_CALLBACK_URL ||
      "http://localhost:3001/api/v1/auth/google/callback";

    return {
      message: "OAuth configuration status",
      googleOAuth: {
        clientIdConfigured: hasGoogleClientId,
        clientSecretConfigured: hasGoogleClientSecret,
        redirectUri,
        status:
          hasGoogleClientId && hasGoogleClientSecret
            ? "ready"
            : "needs_configuration",
      },
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    };
  }
}
