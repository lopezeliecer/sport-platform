import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EnhancedAuthModule } from "./auth/enhanced-auth.module";
import { UsersModule } from "./users/users.module";
import { ApiKeyModule } from "./api-keys/api-key.module";
import { AuditLogModule } from "./audit/audit-log.module";
import { SecurityMonitoringModule } from "./security-monitoring/security-monitoring.module";
import { EnvironmentSecurityModule } from "./environment-security/environment-security.module";
import { createThrottlerOptions } from "../../../libs/shared/common/src/security/throttler.config";
import { SanitizationService } from "../../../libs/shared/common/src/validation/sanitization.service";
import { CustomThrottlerGuard } from "@sports-platform/shared/common/src/security/custom-throttler.guard";
import { ApiKeyMiddleware } from "../../../libs/shared/common/src/security/api-key.middleware";
import { AuditLogInterceptor } from "../../../libs/shared/common/src/audit/audit-log.interceptor";
import { SecurityMonitoringInterceptor } from "./security-monitoring/security-monitoring.interceptor";

@Module({
  imports: [
    EnvironmentSecurityModule, // Must be first for configuration validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    ThrottlerModule.forRoot(createThrottlerOptions()),
    EnhancedAuthModule, // Único módulo de autenticación
    UsersModule,
    ApiKeyModule, // Add API key management
    AuditLogModule, // Add audit logging
    SecurityMonitoringModule, // Add security monitoring
  ],
  providers: [
    // Security Services (must be provided before guards)
    SanitizationService,
    CustomThrottlerGuard,
    // Global Security Guards
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    // Global Audit Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    // Global Security Monitoring Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityMonitoringInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply API key middleware to all routes
    consumer.apply(ApiKeyMiddleware).forRoutes("*");
  }
}
