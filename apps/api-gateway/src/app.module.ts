import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GatewayController } from './gateway/gateway.controller';
import { ProxyService } from './gateway/services/proxy.service';
import { HealthCheckService } from './gateway/services/health-check.service';
import { SwaggerAggregatorService } from './gateway/services/swagger-aggregator.service';
import { LoggerService } from './gateway/services/logger.service';
import { SanitizationService } from '@sports-platform/shared/common/src/validation/sanitization.service';
import { CircuitBreakerModule } from './gateway/circuit-breaker/circuit-breaker.module';

@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // HTTP client for service communication
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),

    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second for burst protection
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Circuit Breaker for resilience
    CircuitBreakerModule,
  ],
  controllers: [GatewayController],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ProxyService,
    HealthCheckService,
    SwaggerAggregatorService,
    LoggerService,
    SanitizationService,
  ],
})
export class AppModule {}
