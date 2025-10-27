import {
  Controller,
  Get,
  Post,
  Delete,
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
import { EnvironmentSecurityService } from './environment-security.service';
import { SecretsManagementService } from './secrets-management.service';
import {
  EnvironmentSecurityConfig,
  SecurityViolation,
} from './interfaces/environment-security.interface';
import { SecretMetadata, SecretAccessLog } from './interfaces/secrets.interface';

@ApiTags('environment-security')
@Controller('environment-security')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class EnvironmentSecurityController {
  constructor(
    private readonly environmentSecurity: EnvironmentSecurityService,
    private readonly secretsManagement: SecretsManagementService,
  ) {}

  /**
   * Get current environment security configuration
   */
  @Get('config')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get environment security configuration',
    description: 'Retrieve current environment security configuration (sensitive values redacted)',
  })
  @ApiResponse({
    status: 200,
    description: 'Environment security configuration retrieved successfully',
  })
  async getSecurityConfig(): Promise<Partial<EnvironmentSecurityConfig>> {
    const config = this.environmentSecurity.getSecurityConfig();

    // Redact sensitive information
    return {
      environment: config.environment,
      securityLevel: config.securityLevel,
      debugMode: config.debugMode,
      maintenanceMode: config.maintenanceMode,
      port: config.port,
      host: config.host,
      baseUrl: config.baseUrl,
      apiVersion: config.apiVersion,
      database: {
        ...config.database,
        // Hide connection details
      },
      jwt: {
        ...config.jwt,
        // Hide secret information
      },
      rateLimiting: config.rateLimiting,
      cors: config.cors,
      headers: config.headers,
      audit: config.audit,
      monitoring: config.monitoring,
      features: config.features,
      services: {
        googleOAuth: {
          enabled: config.services.googleOAuth.enabled,
          // Hide client details
        },
        emailService: {
          enabled: config.services.emailService.enabled,
          provider: config.services.emailService.provider,
          useTLS: config.services.emailService.useTLS,
          // Hide credentials like smtpHost, smtpPort
        },
        notificationService: {
          enabled: config.services.notificationService.enabled,
          // Hide webhook URLs
        },
      },
      policies: config.policies,
      compliance: config.compliance,
      development: config.development,
    };
  }

  /**
   * Get database security configuration
   */
  @Get('config/database')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get database security configuration',
    description: 'Retrieve database-specific security configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Database security configuration retrieved successfully',
  })
  async getDatabaseConfig() {
    return this.environmentSecurity.getDatabaseConfig();
  }

  /**
   * Get JWT security configuration
   */
  @Get('config/jwt')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get JWT security configuration',
    description: 'Retrieve JWT-specific security configuration (secrets redacted)',
  })
  @ApiResponse({
    status: 200,
    description: 'JWT security configuration retrieved successfully',
  })
  async getJwtConfig() {
    const config = this.environmentSecurity.getJwtConfig();
    return {
      ...config,
      // Redact sensitive fields - secrets are managed separately
      algorithm: config.algorithm,
      expiresIn: config.expiresIn,
      refreshExpiresIn: config.refreshExpiresIn,
      issuer: config.issuer,
      audience: config.audience,
      requireHttpsOnly: config.requireHttpsOnly,
    };
  }

  /**
   * Get rate limiting configuration
   */
  @Get('config/rate-limiting')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get rate limiting configuration',
    description: 'Retrieve rate limiting security configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'Rate limiting configuration retrieved successfully',
  })
  async getRateLimitingConfig() {
    return this.environmentSecurity.getRateLimitingConfig();
  }

  /**
   * Get encryption configuration
   */
  @Get('config/encryption')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get encryption configuration',
    description: 'Retrieve encryption configuration (keys redacted)',
  })
  @ApiResponse({
    status: 200,
    description: 'Encryption configuration retrieved successfully',
  })
  async getEncryptionConfig() {
    const config = this.environmentSecurity.getEncryptionConfig();
    return {
      algorithm: config.algorithm,
      keyDerivationRounds: config.keyDerivationRounds,
      saltLength: config.saltLength,
      ivLength: config.ivLength,
      tagLength: config.tagLength,
      encoding: config.encoding,
    };
  }

  /**
   * Get security violations
   */
  @Get('violations')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get security violations',
    description: 'Retrieve list of detected security violations',
  })
  @ApiResponse({
    status: 200,
    description: 'Security violations retrieved successfully',
    type: [Object],
  })
  async getSecurityViolations(): Promise<SecurityViolation[]> {
    return this.environmentSecurity.getSecurityViolations();
  }

  /**
   * Clear resolved security violations
   */
  @Delete('violations')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Clear resolved security violations',
    description: 'Remove resolved security violations from the list',
  })
  @ApiResponse({
    status: 204,
    description: 'Security violations cleared successfully',
  })
  async clearResolvedViolations(@Body() violationIds: { violationIds: string[] }): Promise<void> {
    this.environmentSecurity.clearResolvedViolations(violationIds.violationIds);
  }

  /**
   * Check environment status
   */
  @Get('status')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get environment security status',
    description: 'Get comprehensive environment security status and health check',
  })
  @ApiResponse({
    status: 200,
    description: 'Environment security status retrieved successfully',
  })
  async getEnvironmentStatus() {
    const config = this.environmentSecurity.getSecurityConfig();
    const violations = this.environmentSecurity.getSecurityViolations();
    const secretsHealth = this.secretsManagement.getHealthStatus();

    return {
      environment: config.environment,
      securityLevel: config.securityLevel,
      isProduction: this.environmentSecurity.isProduction(),
      maintenanceMode: config.maintenanceMode,
      securityViolations: {
        total: violations.length,
        critical: violations.filter((v) => v.severity === 'CRITICAL').length,
        high: violations.filter((v) => v.severity === 'HIGH').length,
        medium: violations.filter((v) => v.severity === 'MEDIUM').length,
        low: violations.filter((v) => v.severity === 'LOW').length,
      },
      secrets: secretsHealth,
      features: {
        enabled: Object.entries(config.features).filter(([, enabled]) => enabled).length,
        total: Object.keys(config.features).length,
        details: config.features,
      },
      services: {
        googleOAuth: config.services.googleOAuth.enabled,
        emailService: config.services.emailService.enabled,
        notificationService: config.services.notificationService.enabled,
      },
      lastCheck: new Date(),
    };
  }

  // ==================== SECRETS MANAGEMENT ====================

  /**
   * List all secrets metadata
   */
  @Get('secrets')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'List secrets metadata',
    description: 'Retrieve metadata for all stored secrets (values not included)',
  })
  @ApiResponse({
    status: 200,
    description: 'Secrets metadata retrieved successfully',
    type: [Object],
  })
  @ApiQuery({
    name: 'includeDeprecated',
    required: false,
    description: 'Include deprecated secrets in the list',
    type: Boolean,
  })
  async listSecrets(
    @Query('includeDeprecated') includeDeprecated: boolean = false,
  ): Promise<SecretMetadata[]> {
    return this.secretsManagement.listSecrets(includeDeprecated);
  }

  /**
   * Get secret metadata by name
   */
  @Get('secrets/:name/metadata')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get secret metadata',
    description: 'Retrieve metadata for a specific secret by name',
  })
  @ApiResponse({
    status: 200,
    description: 'Secret metadata retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Secret not found',
  })
  @ApiParam({
    name: 'name',
    description: 'Name of the secret',
  })
  async getSecretMetadata(@Param('name') name: string): Promise<SecretMetadata> {
    const metadata = this.secretsManagement.getSecretMetadata(name);
    if (!metadata) {
      throw new Error(`Secret '${name}' not found`);
    }
    return metadata;
  }

  /**
   * Check if secret exists
   */
  @Get('secrets/:name/exists')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Check if secret exists',
    description: 'Check if a secret with the given name exists and is active',
  })
  @ApiResponse({
    status: 200,
    description: 'Secret existence check completed',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        exists: { type: 'boolean' },
      },
    },
  })
  @ApiParam({
    name: 'name',
    description: 'Name of the secret to check',
  })
  async checkSecretExists(@Param('name') name: string): Promise<{ name: string; exists: boolean }> {
    const exists = this.secretsManagement.hasSecret(name);
    return { name, exists };
  }

  /**
   * Rotate a secret
   */
  @Post('secrets/:name/rotate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate secret',
    description: 'Create a new version of an existing secret (manual rotation)',
  })
  @ApiResponse({
    status: 200,
    description: 'Secret rotated successfully',
    schema: {
      type: 'object',
      properties: {
        secretId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Secret not found',
  })
  @ApiParam({
    name: 'name',
    description: 'Name of the secret to rotate',
  })
  async rotateSecret(
    @Param('name') name: string,
    @Body() body: { newValue?: string } = {},
  ): Promise<{ secretId: string; message: string }> {
    const secretId = await this.secretsManagement.rotateSecret(name, body.newValue);
    return {
      secretId,
      message: `Secret '${name}' rotated successfully`,
    };
  }

  /**
   * Delete a secret
   */
  @Delete('secrets/:name')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete secret',
    description: 'Permanently delete a secret and all its versions',
  })
  @ApiResponse({
    status: 204,
    description: 'Secret deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Secret not found',
  })
  @ApiParam({
    name: 'name',
    description: 'Name of the secret to delete',
  })
  async deleteSecret(@Param('name') name: string): Promise<void> {
    await this.secretsManagement.deleteSecret(name);
  }

  /**
   * Get secret access logs
   */
  @Get('secrets/access-logs')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get secret access logs',
    description: 'Retrieve access logs for secrets',
  })
  @ApiResponse({
    status: 200,
    description: 'Secret access logs retrieved successfully',
    type: [Object],
  })
  @ApiQuery({
    name: 'secretName',
    required: false,
    description: 'Filter logs by secret name',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of logs to return',
    type: Number,
  })
  async getSecretAccessLogs(
    @Query('secretName') secretName?: string,
    @Query('limit') limit: number = 100,
  ): Promise<SecretAccessLog[]> {
    return this.secretsManagement.getAccessLogs(secretName, limit);
  }

  /**
   * Get secrets health status
   */
  @Get('secrets/health')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get secrets health status',
    description: 'Retrieve health status and statistics for the secrets management system',
  })
  @ApiResponse({
    status: 200,
    description: 'Secrets health status retrieved successfully',
  })
  async getSecretsHealth() {
    return this.secretsManagement.getHealthStatus();
  }

  /**
   * Check if security feature is enabled
   */
  @Get('features/:feature')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Check security feature status',
    description: 'Check if a specific security feature is enabled',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        feature: { type: 'string' },
        enabled: { type: 'boolean' },
      },
    },
  })
  @ApiParam({
    name: 'feature',
    description: 'Name of the security feature to check',
  })
  async checkFeatureStatus(
    @Param('feature') feature: string,
  ): Promise<{ feature: string; enabled: boolean }> {
    const config = this.environmentSecurity.getSecurityConfig();
    const enabled = config.features[feature as keyof typeof config.features] || false;
    return { feature, enabled };
  }

  /**
   * Get security dashboard data
   */
  @Get('dashboard')
  @Roles('ADMIN', 'SECURITY_OFFICER')
  @ApiOperation({
    summary: 'Get security dashboard data',
    description: 'Get comprehensive security dashboard data for monitoring interface',
  })
  @ApiResponse({
    status: 200,
    description: 'Security dashboard data retrieved successfully',
  })
  async getSecurityDashboard() {
    const config = this.environmentSecurity.getSecurityConfig();
    const violations = this.environmentSecurity.getSecurityViolations();
    const secretsHealth = this.secretsManagement.getHealthStatus();
    const recentLogs = this.secretsManagement.getAccessLogs(undefined, 20);

    return {
      overview: {
        environment: config.environment,
        securityLevel: config.securityLevel,
        isProduction: this.environmentSecurity.isProduction(),
        maintenanceMode: config.maintenanceMode,
      },
      violations: {
        total: violations.length,
        byType: this.groupViolationsByType(violations),
        bySeverity: this.groupViolationsBySeverity(violations),
        recent: violations.slice(0, 10),
      },
      secrets: {
        ...secretsHealth,
        recentActivity: recentLogs,
      },
      features: {
        enabled: Object.entries(config.features)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name),
        disabled: Object.entries(config.features)
          .filter(([, enabled]) => !enabled)
          .map(([name]) => name),
      },
      services: {
        googleOAuth: config.services.googleOAuth.enabled,
        emailService: config.services.emailService.enabled,
        notificationService: config.services.notificationService.enabled,
      },
      policies: {
        passwordPolicy: config.policies.passwordPolicy,
        sessionPolicy: config.policies.sessionPolicy,
        accessPolicy: config.policies.accessPolicy,
      },
      compliance: config.compliance,
      lastUpdated: new Date(),
    };
  }

  /**
   * Group violations by type
   */
  private groupViolationsByType(violations: SecurityViolation[]): Record<string, number> {
    return violations.reduce(
      (acc, violation) => {
        acc[violation.type] = (acc[violation.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Group violations by severity
   */
  private groupViolationsBySeverity(violations: SecurityViolation[]): Record<string, number> {
    return violations.reduce(
      (acc, violation) => {
        acc[violation.severity] = (acc[violation.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
