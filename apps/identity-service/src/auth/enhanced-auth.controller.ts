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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { EnhancedSessionsService } from '../sessions/enhanced-sessions-v2.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RbacGuard } from './guards/rbac.guard';
import { ClubContextMiddleware } from './middleware/club-context.middleware';
import {
  CurrentUser,
  CurrentClubId,
  ClubContext,
} from './middleware/club-context.middleware';
import {
  RequireClubAdmin,
  RequireClubContext,
  CanManageAthletes,
} from './decorators/permissions.decorator';
import { GoogleAuthDto, AuthResponseDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@ApiTags('Authentication & Authorization')
@Controller('auth')
export class EnhancedAuthController {
  private readonly logger = new Logger(EnhancedAuthController.name);

  constructor(
    private authService: AuthService,
    private sessionsService: EnhancedSessionsService,
  ) {}

  @Post('google')
  @ApiOperation({ summary: 'Google OAuth authentication' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Request() req: any,
  ): Promise<AuthResponseDto> {
    this.logger.log('Google OAuth authentication initiated');

    // Extraer información del dispositivo
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      deviceType: this.detectDeviceType(req.headers['user-agent']),
    };

    // Usar el AuthService existente para crear/encontrar usuario
    const authResult = await this.authService.googleAuth(
      googleAuthDto,
      deviceInfo.ip,
      deviceInfo.userAgent,
    );

    // Crear sesión enhanced con el nuevo sistema
    const sessionResult = await this.sessionsService.createSession({
      userId: authResult.user.id,
      deviceInfo,
      clubId: authResult.defaultClubId,
    });

    this.logger.log(`Usuario ${authResult.user.email} autenticado exitosamente`);

    return {
      accessToken: sessionResult.accessToken,
      refreshToken: sessionResult.refreshToken,
      user: authResult.user,
      clubs: authResult.clubs,
      defaultClubId: authResult.defaultClubId,
      expiresIn: 900, // 15 minutos
      tokenType: 'Bearer',
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokens = await this.sessionsService.refreshTokens(refreshToken);

    return {
      ...tokens,
      expiresIn: 900, // 15 minutos
    };
  }

  @Post('switch-club/:clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch club context without re-authentication' })
  @ApiResponse({ status: 200, description: 'Club context switched successfully' })
  @HttpCode(HttpStatus.OK)
  async switchClub(
    @Param('clubId') clubId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ accessToken: string; clubId: string; message: string }> {
    const accessToken = await this.sessionsService.switchClubContext(
      user.sessionId,
      clubId,
    );

    return {
      accessToken,
      clubId,
      message: 'Contexto de club cambiado exitosamente',
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user active sessions (multi-device)' })
  @ApiResponse({ status: 200, description: 'User sessions retrieved successfully' })
  async getUserSessions(
    @CurrentUser() user: JwtPayload,
  ) {
    const sessions = await this.sessionsService.getUserSessions(user.sub);
    return {
      message: 'Sesiones activas',
      sessions,
      totalSessions: sessions.length,
    };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.sessionsService.revokeSession(sessionId, user.sub);
    return {
      message: 'Sesión revocada exitosamente',
      revokedSessionId: sessionId,
    };
  }

  @Delete('sessions/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  @ApiResponse({ status: 200, description: 'All sessions revoked successfully' })
  async revokeAllSessions(
    @CurrentUser() user: JwtPayload,
  ) {
    await this.sessionsService.revokeAllUserSessions(user.sub, user.sessionId);
    return {
      message: 'Todas las sesiones revocadas exitosamente (excepto la actual)',
      currentSessionId: user.sessionId,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireClubContext()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile with club context' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(
    @CurrentUser() user: JwtPayload,
    @CurrentClubId() clubId: string,
    @ClubContext() clubContext: any,
  ) {
    return {
      message: 'Perfil de usuario',
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

  @Get('permissions')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireClubContext()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user permissions in current club' })
  @ApiResponse({ status: 200, description: 'User permissions retrieved successfully' })
  async getPermissions(
    @ClubContext() clubContext: any,
  ) {
    return {
      message: 'Permisos del usuario en el club actual',
      clubId: clubContext.clubId,
      roles: clubContext.userRoles,
      permissions: clubContext.permissions,
    };
  }

  // Ejemplo de endpoint que requiere permisos específicos
  @Get('test/club-admin')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequireClubAdmin()
  @RequireClubContext()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint - Club Admin only' })
  @ApiResponse({ status: 200, description: 'Access granted for club admin' })
  async testClubAdmin(
    @CurrentUser() user: JwtPayload,
    @CurrentClubId() clubId: string,
  ) {
    return {
      message: 'Acceso autorizado para administrador de club',
      userId: user.sub,
      clubId,
      timestamp: new Date(),
    };
  }

  @Get('test/manage-athletes')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @CanManageAthletes()
  @RequireClubContext()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint - Manage Athletes permission' })
  @ApiResponse({ status: 200, description: 'Access granted for athlete management' })
  async testManageAthletes(
    @CurrentUser() user: JwtPayload,
    @ClubContext() clubContext: any,
  ) {
    return {
      message: 'Acceso autorizado para gestión de atletas',
      userId: user.sub,
      clubContext,
      timestamp: new Date(),
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: JwtPayload,
  ) {
    await this.sessionsService.revokeSession(user.sessionId, user.sub);
    
    this.logger.log(`Usuario ${user.email} cerró sesión`);
    
    return {
      message: 'Sesión cerrada exitosamente',
      sessionId: user.sessionId,
    };
  }

  // Métodos privados

  private detectDeviceType(userAgent?: string): 'mobile' | 'desktop' | 'tablet' {
    if (!userAgent) return 'desktop';

    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }
    
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    
    return 'desktop';
  }
}