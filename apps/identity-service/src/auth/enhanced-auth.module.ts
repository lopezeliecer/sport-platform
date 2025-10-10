import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";

// Services
import { AuthService } from "./auth.service";
import { EnhancedSessionsService } from "../sessions/enhanced-sessions-v2.service";
import { SessionsService } from "../sessions/sessions.service";

// Controllers
import { EnhancedAuthController } from "./enhanced-auth.controller";

// Strategies
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";

// Guards
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RbacGuard } from "./guards/rbac.guard";

// Middleware
import { ClubContextMiddleware } from "./middleware/club-context.middleware";

// Other modules
import { PrismaModule } from "../prisma/prisma.module";
import { AuditLogModule } from "../audit/audit-log.module";

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
    PrismaModule,
    AuditLogModule, // Add audit logging capabilities
  ],
  controllers: [
    EnhancedAuthController, // Controlador único de autenticación
  ],
  providers: [
    // Services
    AuthService,
    SessionsService, // Servicio original
    EnhancedSessionsService, // Nuevo servicio con funcionalidades avanzadas

    // Strategies
    JwtStrategy,
    GoogleStrategy,

    // Guards
    JwtAuthGuard,
    RbacGuard,
  ],
  exports: [
    AuthService,
    EnhancedSessionsService,
    JwtAuthGuard,
    RbacGuard,
    JwtModule,
    PassportModule,
  ],
})
export class EnhancedAuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar middleware de contexto de club a todas las rutas protegidas
    consumer.apply(ClubContextMiddleware).forRoutes("*"); // Aplicar a todas las rutas
  }
}
