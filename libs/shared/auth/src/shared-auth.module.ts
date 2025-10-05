import { Module, Global } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";

// Guards y strategies compartidos
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RbacGuard } from "./guards/rbac.guard";
import { JwtStrategy } from "./strategies/jwt.strategy";

// Servicios compartidos
import { AuthValidationService } from "./services/auth-validation.service";

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(
          "JWT_SECRET",
          "development-jwt-secret"
        ),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "15m"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard, RbacGuard, AuthValidationService],
  exports: [
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RbacGuard,
    AuthValidationService,
  ],
})
export class SharedAuthModule {}
