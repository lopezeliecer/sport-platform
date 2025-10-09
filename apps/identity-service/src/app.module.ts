import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard, seconds } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { EnhancedAuthModule } from "./auth/enhanced-auth.module";
import { UsersModule } from "./users/users.module";
import { createThrottlerOptions } from "../../../libs/shared/common/src/security/throttler.config";
import { SanitizationService } from "../../../libs/shared/common/src/validation/sanitization.service";
import { CustomThrottlerGuard } from "@sports-platform/shared/common/src/security/custom-throttler.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    ThrottlerModule.forRoot(createThrottlerOptions()),
    EnhancedAuthModule, // Único módulo de autenticación
    UsersModule,
  ],
  providers: [
    // Security Services (must be provided before guards)
    SanitizationService,
    CustomThrottlerGuard,
    // Global Security Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
