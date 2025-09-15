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
    // For now, return a mock response indicating OAuth flow would start
    return res.json({
      message: "Google OAuth flow would be initiated here",
      redirectUrl: "https://accounts.google.com/oauth/authorize?client_id=mock&redirect_uri=mock&scope=email+profile",
      status: "mock_implementation"
    });
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
}
