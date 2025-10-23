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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApiKeyService, ApiKey } from '../../../../libs/shared/common/src/security/api-key.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequireClubAdmin } from '../auth/decorators/permissions.decorator';
import { ThrottleAPI } from '../../../../libs/shared/common/src/security/throttle.decorators';

export class CreateApiKeyDto {
  name: string;
  service: string;
  permissions: string[];
  expiresInDays?: number;
}

export class RotateApiKeyDto {
  keyId: string;
}

@ApiTags('API Key Management')
@Controller('api-keys')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
@ThrottleAPI() // Moderate rate limiting for API management
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @RequireClubAdmin() // Only club admins can manage API keys
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate new API key',
    description: 'Creates a new API key for service-to-service authentication',
  })
  @ApiResponse({
    status: 201,
    description: 'API key generated successfully',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'The API key (store securely)' },
        apiKey: {
          type: 'object',
          description: 'API key metadata',
        },
      },
    },
  })
  async generateApiKey(@Body() createDto: CreateApiKeyDto) {
    const result = this.apiKeyService.generateApiKey(
      createDto.name,
      createDto.service,
      createDto.permissions,
      createDto.expiresInDays,
    );

    return {
      message: 'API key generated successfully',
      key: result.key,
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        service: result.apiKey.service,
        permissions: result.apiKey.permissions,
        createdAt: result.apiKey.createdAt,
        expiresAt: result.apiKey.expiresAt,
      },
      warning: 'Store this key securely. It will not be shown again.',
    };
  }

  @Get()
  @RequireClubAdmin()
  @ApiOperation({
    summary: 'List all API keys',
    description: 'Retrieves all API keys (without sensitive data)',
  })
  @ApiResponse({
    status: 200,
    description: 'API keys retrieved successfully',
  })
  async listApiKeys(): Promise<{ apiKeys: Omit<ApiKey, 'keyHash'>[] }> {
    const apiKeys = this.apiKeyService.listApiKeys();
    return { apiKeys };
  }

  @Get('analytics')
  @RequireClubAdmin()
  @ApiOperation({
    summary: 'Get API key usage analytics',
    description: 'Retrieves usage statistics and analytics for API keys',
  })
  @ApiQuery({
    name: 'keyId',
    required: false,
    description: 'Filter by specific API key ID',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 7)',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getAnalytics(@Query('keyId') keyId?: string, @Query('days') days?: string) {
    const analyticsDays = days ? parseInt(days, 10) : 7;
    const analytics = this.apiKeyService.getUsageAnalytics(keyId, analyticsDays);

    return {
      analytics,
      period: `${analyticsDays} days`,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post('rotate')
  @RequireClubAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate API key',
    description: 'Generates a new API key and invalidates the old one',
  })
  @ApiResponse({
    status: 200,
    description: 'API key rotated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  async rotateApiKey(@Body() rotateDto: RotateApiKeyDto) {
    const result = this.apiKeyService.rotateApiKey(rotateDto.keyId);

    if (!result) {
      return {
        statusCode: 404,
        message: 'API key not found',
      };
    }

    return {
      message: 'API key rotated successfully',
      newKey: result.key,
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        service: result.apiKey.service,
        createdAt: result.apiKey.createdAt,
      },
      warning: 'Update your services with the new key. The old key has been deactivated.',
    };
  }

  @Delete(':keyId')
  @RequireClubAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate API key',
    description: 'Deactivates an API key (makes it unusable)',
  })
  @ApiResponse({
    status: 200,
    description: 'API key deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  async deactivateApiKey(@Param('keyId') keyId: string) {
    const success = this.apiKeyService.deactivateApiKey(keyId);

    if (!success) {
      return {
        statusCode: 404,
        message: 'API key not found',
      };
    }

    return {
      message: 'API key deactivated successfully',
      keyId,
      deactivatedAt: new Date().toISOString(),
    };
  }

  @Get('system/env-vars')
  @RequireClubAdmin()
  @ApiOperation({
    summary: 'Get system environment variables',
    description: 'Retrieves environment variables for system API keys (for service configuration)',
  })
  @ApiResponse({
    status: 200,
    description: 'Environment variables retrieved successfully',
  })
  async getSystemEnvVars() {
    const envVars = this.apiKeyService.getSystemKeyEnvironmentVars();

    return {
      message: 'System environment variables for API keys',
      envVars,
      note: 'Use these variables in your service configurations for authentication',
    };
  }
}
