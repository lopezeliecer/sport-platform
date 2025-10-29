import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { LoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

/**
 * Service health status interface
 */
export interface ServiceHealth {
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  url: string;
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

/**
 * Health Check Service - Monitors microservices availability
 * Aggregates health status from all registered services
 */
@Injectable()
export class HealthCheckService {
  private readonly services = [
    {
      name: 'Identity Service',
      url: this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
      healthEndpoint: '/api/v1/health',
    },
    {
      name: 'Sports Service',
      url: this.configService.get('SPORTS_SERVICE_URL', 'http://localhost:3002'),
      healthEndpoint: '/api/v1/health',
    },
    {
      name: 'Club Management',
      url: this.configService.get('CLUB_MANAGEMENT_URL', 'http://localhost:3003'),
      healthEndpoint: '/api/v1/health',
    },
    {
      name: 'Communication Service',
      url: this.configService.get('COMMUNICATION_SERVICE_URL', 'http://localhost:3004'),
      healthEndpoint: '/api/v1/health',
    },
  ];

  private readonly serviceHealthCache = new Map<string, ServiceHealth>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    // Initialize cache with default down status
    this.services.forEach((service) => {
      this.serviceHealthCache.set(service.name, {
        name: service.name,
        status: 'DOWN',
        url: service.url,
        responseTime: 0,
        lastCheck: new Date(),
      });
    });
  }

  /**
   * Check health of all microservices
   */
  async checkAllServices(): Promise<ServiceHealth[]> {
    const healthChecks = this.services.map((service) =>
      this.checkServiceHealth(service.name, service.url, service.healthEndpoint),
    );

    const results = await Promise.all(healthChecks);
    results.forEach((health) => {
      this.serviceHealthCache.set(health.name, health);
    });

    return results;
  }

  /**
   * Check health of a single service
   */
  private async checkServiceHealth(
    serviceName: string,
    baseUrl: string,
    healthEndpoint: string,
  ): Promise<ServiceHealth> {
    const startTime = Date.now();
    const healthUrl = `${baseUrl}${healthEndpoint}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(healthUrl, {
          timeout: 5000,
        }),
      );

      const responseTime = Date.now() - startTime;
      const status = response?.status === 200 ? 'UP' : 'DEGRADED';

      // Update Prometheus metrics for service health
      const serviceKey = this.getServiceKey(serviceName);
      this.metricsService.updateServiceHealth(serviceKey, status);

      return {
        name: serviceName,
        status,
        url: baseUrl,
        responseTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Health check failed for ${serviceName}: ${errorMessage}`,
        'HealthCheckService',
      );

      // Update Prometheus metrics for service down
      const serviceKey = this.getServiceKey(serviceName);
      this.metricsService.updateServiceHealth(serviceKey, 'DOWN');

      return {
        name: serviceName,
        status: 'DOWN',
        url: baseUrl,
        responseTime,
        lastCheck: new Date(),
        error: errorMessage,
      };
    }
  }

  /**
   * Get cached health status for all services
   */
  getCachedHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealthCache.values());
  }

  /**
   * Get cached health status for a specific service
   */
  getCachedServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.serviceHealthCache.get(serviceName);
  }

  /**
   * Get overall system health status
   */
  getOverallStatus(): 'UP' | 'DEGRADED' | 'DOWN' {
    const health = this.getCachedHealth();

    if (health.every((h) => h.status === 'UP')) {
      return 'UP';
    }

    if (health.some((h) => h.status === 'UP')) {
      return 'DEGRADED';
    }

    return 'DOWN';
  }

  /**
   * Convert service name to normalized key for metrics
   * E.g., "Identity Service" -> "identity"
   */
  private getServiceKey(serviceName: string): string {
    return serviceName
      .toLowerCase()
      .replace(/\s+service/i, '')
      .trim();
  }

  /**
   * Get health check summary
   */
  getHealthSummary(): Record<string, unknown> {
    const health = this.getCachedHealth();
    const upCount = health.filter((h) => h.status === 'UP').length;
    const downCount = health.filter((h) => h.status === 'DOWN').length;
    const degradedCount = health.filter((h) => h.status === 'DEGRADED').length;

    return {
      overall: this.getOverallStatus(),
      timestamp: new Date().toISOString(),
      services: {
        total: health.length,
        up: upCount,
        down: downCount,
        degraded: degradedCount,
      },
      details: health,
    };
  }
}
