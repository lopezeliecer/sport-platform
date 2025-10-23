import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { SecurityMonitoringService } from './security-monitoring.service';
import {
  SecuritySeverity,
  SecurityMetrics,
  SecurityAlert,
} from './interfaces/security-event.interface';
import { CreateSecurityEventDto, ResolveAlertDto, SecurityMetricsQueryDto } from './dto';

@ApiTags('security-monitoring')
@Controller('security-monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SecurityMonitoringController {
  constructor(private readonly securityMonitoringService: SecurityMonitoringService) {}

  /**
   * Get security metrics and statistics
   */
  @Get('metrics')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get security metrics',
    description: 'Retrieve comprehensive security metrics and statistics for monitoring dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Security metrics retrieved successfully',
    type: Object,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for metrics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for metrics (ISO string)',
  })
  async getSecurityMetrics(@Query() query: SecurityMetricsQueryDto): Promise<SecurityMetrics> {
    const timeRange =
      query.startDate && query.endDate
        ? { start: new Date(query.startDate), end: new Date(query.endDate) }
        : undefined;

    return this.securityMonitoringService.getSecurityMetrics(timeRange);
  }

  /**
   * Get recent security alerts
   */
  @Get('alerts')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get recent security alerts',
    description: 'Retrieve recent security alerts for monitoring and response',
  })
  @ApiResponse({
    status: 200,
    description: 'Security alerts retrieved successfully',
    type: [Object],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of alerts to return (default: 50)',
  })
  async getRecentAlerts(@Query('limit') limit?: number): Promise<SecurityAlert[]> {
    return this.securityMonitoringService.getRecentAlerts(limit);
  }

  /**
   * Get unresolved security alerts
   */
  @Get('alerts/unresolved')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get unresolved security alerts',
    description: 'Retrieve unresolved security alerts that require attention',
  })
  @ApiResponse({
    status: 200,
    description: 'Unresolved security alerts retrieved successfully',
    type: [Object],
  })
  async getUnresolvedAlerts(): Promise<SecurityAlert[]> {
    const recentAlerts = this.securityMonitoringService.getRecentAlerts(100);
    return recentAlerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get security alerts by severity
   */
  @Get('alerts/severity/:severity')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get security alerts by severity',
    description: 'Retrieve security alerts filtered by severity level',
  })
  @ApiResponse({
    status: 200,
    description: 'Security alerts by severity retrieved successfully',
    type: [Object],
  })
  @ApiParam({
    name: 'severity',
    enum: SecuritySeverity,
    description: 'Security severity level to filter by',
  })
  async getAlertsBySeverity(
    @Param('severity') severity: SecuritySeverity,
  ): Promise<SecurityAlert[]> {
    const recentAlerts = this.securityMonitoringService.getRecentAlerts(200);
    return recentAlerts.filter((alert) => alert.severity === severity);
  }

  /**
   * Manually record a security event
   */
  @Post('events')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record security event',
    description: 'Manually record a security event for monitoring and analysis',
  })
  @ApiResponse({
    status: 201,
    description: 'Security event recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async recordSecurityEvent(
    @Body() eventDto: CreateSecurityEventDto,
  ): Promise<{ message: string }> {
    await this.securityMonitoringService.recordSecurityEvent({
      type: eventDto.type,
      severity: eventDto.severity,
      sourceIp: eventDto.sourceIp,
      userAgent: eventDto.userAgent,
      userId: eventDto.userId,
      clubId: eventDto.clubId,
      details: eventDto.details || {},
      metadata: {
        endpoint: eventDto.endpoint,
        method: eventDto.method,
        statusCode: eventDto.statusCode,
        responseTime: eventDto.responseTime,
      },
    });

    return { message: 'Security event recorded successfully' };
  }

  /**
   * Resolve a security alert
   */
  @Put('alerts/:alertId/resolve')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve security alert',
    description: 'Mark a security alert as resolved with optional notes',
  })
  @ApiResponse({
    status: 200,
    description: 'Security alert resolved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Security alert not found',
  })
  @ApiParam({
    name: 'alertId',
    description: 'Unique identifier of the security alert to resolve',
  })
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() resolveDto: ResolveAlertDto,
  ): Promise<{ message: string }> {
    await this.securityMonitoringService.resolveAlert(
      alertId,
      resolveDto.resolvedBy,
      resolveDto.notes,
    );

    return { message: 'Security alert resolved successfully' };
  }

  /**
   * Get blocked IP addresses
   */
  @Get('blocked-ips')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get blocked IP addresses',
    description: 'Retrieve list of currently blocked IP addresses',
  })
  @ApiResponse({
    status: 200,
    description: 'Blocked IP addresses retrieved successfully',
    type: [String],
  })
  async getBlockedIps(): Promise<string[]> {
    // This would need to be implemented in the service
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check if IP is blocked
   */
  @Get('blocked-ips/:ip')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Check if IP is blocked',
    description: 'Check if a specific IP address is currently blocked',
  })
  @ApiResponse({
    status: 200,
    description: 'IP block status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        ip: { type: 'string' },
        blocked: { type: 'boolean' },
      },
    },
  })
  @ApiParam({
    name: 'ip',
    description: 'IP address to check',
  })
  async checkIpBlocked(@Param('ip') ip: string): Promise<{ ip: string; blocked: boolean }> {
    const blocked = this.securityMonitoringService.isIpBlocked(ip);
    return { ip, blocked };
  }

  /**
   * Get security system health status
   */
  @Get('health')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get security system health',
    description: 'Get overall health status of the security monitoring system',
  })
  @ApiResponse({
    status: 200,
    description: 'Security system health status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
        details: { type: 'object' },
      },
    },
  })
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    details: any;
  }> {
    return this.securityMonitoringService.getHealthStatus();
  }

  /**
   * Get security dashboard summary
   */
  @Get('dashboard')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get security dashboard summary',
    description: 'Get comprehensive security dashboard data for monitoring interface',
  })
  @ApiResponse({
    status: 200,
    description: 'Security dashboard data retrieved successfully',
  })
  async getSecurityDashboard(): Promise<{
    metrics: SecurityMetrics;
    recentAlerts: SecurityAlert[];
    healthStatus: { status: 'healthy' | 'warning' | 'critical'; details: any };
    unresolvedAlerts: number;
    criticalAlerts: number;
  }> {
    const metrics = this.securityMonitoringService.getSecurityMetrics();
    const recentAlerts = this.securityMonitoringService.getRecentAlerts(20);
    const healthStatus = this.securityMonitoringService.getHealthStatus();
    const unresolvedAlerts = recentAlerts.filter((alert) => !alert.resolved).length;
    const criticalAlerts = recentAlerts.filter(
      (alert) => alert.severity === SecuritySeverity.CRITICAL && !alert.resolved,
    ).length;

    return {
      metrics,
      recentAlerts,
      healthStatus,
      unresolvedAlerts,
      criticalAlerts,
    };
  }
}
