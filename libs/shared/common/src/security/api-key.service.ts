import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  prefix: string;
  service: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

export interface ApiKeyUsage {
  keyId: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  ipAddress: string;
  userAgent?: string;
  statusCode: number;
  responseTime: number;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly apiKeys = new Map<string, ApiKey>();
  private readonly usageHistory: ApiKeyUsage[] = [];
  private readonly rateLimitTracking = new Map<string, { count: number; windowStart: number }>();

  constructor(private readonly configService: ConfigService) {
    this.initializeSystemKeys();
  }

  /**
   * Initialize system API keys for internal services
   */
  private initializeSystemKeys(): void {
    const systemKeys = [
      {
        name: 'identity-service',
        service: 'identity-service',
        permissions: ['user:read', 'user:write', 'session:manage', 'auth:verify'],
      },
      {
        name: 'sports-service',
        service: 'sports-service',
        permissions: ['athlete:read', 'athlete:write', 'training:manage', 'performance:read'],
      },
      {
        name: 'club-management',
        service: 'club-management',
        permissions: ['club:read', 'club:write', 'member:manage', 'billing:read'],
      },
      {
        name: 'communication',
        service: 'communication',
        permissions: ['notification:send', 'email:send', 'sms:send', 'push:send'],
      },
      {
        name: 'api-gateway',
        service: 'api-gateway',
        permissions: ['*'], // Gateway has full access for routing
      },
    ];

    systemKeys.forEach((keyConfig) => {
      const keyData = this.generateApiKey(keyConfig.name, keyConfig.service, keyConfig.permissions);
      this.logger.log(
        `Generated system API key for ${keyConfig.service}: ${keyData.apiKey.prefix}...`,
      );
    });
  }

  /**
   * Generate a new API key
   */
  generateApiKey(
    name: string,
    service: string,
    permissions: string[],
    expiresInDays?: number,
  ): { key: string; apiKey: ApiKey } {
    const id = randomBytes(16).toString('hex');
    const secret = randomBytes(32).toString('hex');
    const prefix = `sk_${service.substring(0, 4)}_`;
    const key = `${prefix}${secret}`;
    const keyHash = this.hashApiKey(key);

    const apiKey: ApiKey = {
      id,
      name,
      keyHash,
      prefix,
      service,
      permissions,
      isActive: true,
      createdAt: new Date(),
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      usageCount: 0,
      rateLimit: {
        requests: 1000, // Default: 1000 requests
        windowMs: 60 * 60 * 1000, // per hour
      },
    };

    this.apiKeys.set(id, apiKey);
    return { key, apiKey };
  }

  /**
   * Validate API key and return associated data
   */
  async validateApiKey(key: string, requiredPermission?: string): Promise<ApiKey | null> {
    if (!key || !key.includes('_')) {
      return null;
    }

    const prefix = key.substring(0, key.lastIndexOf('_') + 1);

    // Find API key by prefix (for faster lookup)
    const apiKey = Array.from(this.apiKeys.values()).find(
      (ak) => ak.prefix === prefix && ak.isActive,
    );

    if (!apiKey) {
      this.logger.warn(`API key validation failed: key not found for prefix ${prefix}`);
      return null;
    }

    // Verify key hash using timing-safe comparison
    const providedKeyHash = this.hashApiKey(key);
    const storedKeyBuffer = Buffer.from(apiKey.keyHash, 'hex');
    const providedKeyBuffer = Buffer.from(providedKeyHash, 'hex');

    if (!timingSafeEqual(storedKeyBuffer, providedKeyBuffer)) {
      this.logger.warn(`API key validation failed: hash mismatch for key ${apiKey.id}`);
      return null;
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      this.logger.warn(`API key validation failed: key ${apiKey.id} has expired`);
      return null;
    }

    // Check permissions
    if (requiredPermission && !this.hasPermission(apiKey, requiredPermission)) {
      this.logger.warn(
        `API key validation failed: insufficient permissions for ${requiredPermission}`,
      );
      return null;
    }

    // Check rate limits
    if (!this.checkRateLimit(apiKey)) {
      this.logger.warn(`API key validation failed: rate limit exceeded for key ${apiKey.id}`);
      return null;
    }

    // Update usage
    apiKey.lastUsedAt = new Date();
    apiKey.usageCount++;

    this.logger.debug(`API key validated successfully for service: ${apiKey.service}`);
    return apiKey;
  }

  /**
   * Check if API key has required permission
   */
  private hasPermission(apiKey: ApiKey, permission: string): boolean {
    return apiKey.permissions.includes('*') || apiKey.permissions.includes(permission);
  }

  /**
   * Check rate limits for API key
   */
  private checkRateLimit(apiKey: ApiKey): boolean {
    if (!apiKey.rateLimit) return true;

    const now = Date.now();
    const windowStart = now - apiKey.rateLimit.windowMs;
    const tracking = this.rateLimitTracking.get(apiKey.id);

    if (!tracking || tracking.windowStart < windowStart) {
      // New window or first request
      this.rateLimitTracking.set(apiKey.id, {
        count: 1,
        windowStart: now,
      });
      return true;
    }

    if (tracking.count >= apiKey.rateLimit.requests) {
      return false; // Rate limit exceeded
    }

    tracking.count++;
    return true;
  }

  /**
   * Hash API key for secure storage
   */
  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Record API key usage for analytics
   */
  recordUsage(
    apiKey: ApiKey,
    endpoint: string,
    method: string,
    ipAddress: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
  ): void {
    const usage: ApiKeyUsage = {
      keyId: apiKey.id,
      timestamp: new Date(),
      endpoint,
      method,
      ipAddress,
      userAgent,
      statusCode,
      responseTime,
    };

    this.usageHistory.push(usage);

    // Keep only last 10000 entries to prevent memory issues
    if (this.usageHistory.length > 10000) {
      this.usageHistory.splice(0, this.usageHistory.length - 10000);
    }

    this.logger.debug(
      `Recorded API usage for key ${apiKey.id}: ${method} ${endpoint} - ${statusCode}`,
    );
  }

  /**
   * Get API key usage analytics
   */
  getUsageAnalytics(
    keyId?: string,
    days: number = 7,
  ): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    requestsByDay: Array<{ date: string; count: number }>;
  } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let relevantUsage = this.usageHistory.filter((u) => u.timestamp >= cutoffDate);

    if (keyId) {
      relevantUsage = relevantUsage.filter((u) => u.keyId === keyId);
    }

    const totalRequests = relevantUsage.length;
    const successfulRequests = relevantUsage.filter((u) => u.statusCode < 400).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const averageResponseTime =
      totalRequests > 0
        ? relevantUsage.reduce((sum, u) => sum + u.responseTime, 0) / totalRequests
        : 0;

    // Top endpoints
    const endpointCounts = new Map<string, number>();
    relevantUsage.forEach((u) => {
      const key = `${u.method} ${u.endpoint}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    });
    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Requests by day
    const dayGroups = new Map<string, number>();
    relevantUsage.forEach((u) => {
      const day = u.timestamp.toISOString().split('T')[0];
      dayGroups.set(day, (dayGroups.get(day) || 0) + 1);
    });
    const requestsByDay = Array.from(dayGroups.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      topEndpoints,
      requestsByDay,
    };
  }

  /**
   * Rotate API key (generate new key, invalidate old)
   */
  rotateApiKey(keyId: string): { key: string; apiKey: ApiKey } | null {
    const existingKey = this.apiKeys.get(keyId);
    if (!existingKey) {
      return null;
    }

    // Generate new key with same configuration
    const newKeyData = this.generateApiKey(
      existingKey.name,
      existingKey.service,
      existingKey.permissions,
    );

    // Deactivate old key
    existingKey.isActive = false;

    this.logger.log(`API key rotated for service: ${existingKey.service}`);
    return newKeyData;
  }

  /**
   * List all API keys (without sensitive data)
   */
  listApiKeys(): Omit<ApiKey, 'keyHash'>[] {
    return Array.from(this.apiKeys.values()).map(({ keyHash, ...key }) => key);
  }

  /**
   * Deactivate API key
   */
  deactivateApiKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);
    if (apiKey) {
      apiKey.isActive = false;
      this.logger.log(`API key deactivated: ${keyId}`);
      return true;
    }
    return false;
  }

  /**
   * Get environment variables for system keys (for service configuration)
   */
  getSystemKeyEnvironmentVars(): Record<string, string> {
    const vars: Record<string, string> = {};

    this.apiKeys.forEach((apiKey, keyId) => {
      if (apiKey.service && apiKey.isActive) {
        // Reconstruct the key for system services
        // Note: In production, these should be stored securely
        const envVarName = `${apiKey.service.toUpperCase().replace('-', '_')}_API_KEY`;
        vars[envVarName] = `${apiKey.prefix}${keyId}`; // Simplified for demo
      }
    });

    return vars;
  }
}
