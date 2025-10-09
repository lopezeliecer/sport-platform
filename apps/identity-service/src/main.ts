import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";
import {
  createSecurityConfig,
  addCustomSecurityHeaders,
} from "../../../libs/shared/common/src/security/security.config";
import { CustomThrottlerGuard } from "../../../libs/shared/common/src/security/custom-throttler.guard";
import { SecurityValidationPipe } from "../../../libs/shared/common/src/validation/security-validation.pipe";
import { SanitizationService } from "../../../libs/shared/common/src/validation/sanitization.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const sanitizationService = app.get(SanitizationService);

  const isProduction = configService.get("NODE_ENV") === "production";
  const securityConfig = createSecurityConfig(isProduction);

  // Security Headers
  app.use(helmet(securityConfig.helmet));

  // Override specific headers if needed
  app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY"); // Force DENY instead of SAMEORIGIN
    next();
  });

  // Custom security headers
  app.use(
    addCustomSecurityHeaders({
      "X-API-Version": "v1",
      "X-Request-ID": Math.random().toString(36).substring(7),
    })
  );

  // CORS Configuration
  app.enableCors(securityConfig.cors);

  // Global Security Validation Pipe
  app.useGlobalPipes(
    new SecurityValidationPipe(sanitizationService),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.error("Validation errors:", errors);
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    })
  );

  // Global Rate Limiting - Now configured in AppModule with ThrottlerGuard
  const customThrottlerGuard = app.get(CustomThrottlerGuard);
  app.useGlobalGuards(customThrottlerGuard);

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Sports Platform - Identity Service")
    .setDescription(
      "Authentication and authorization service for the sports platform"
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Authentication", "User authentication and session management")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // Start server
  const port = configService.get("PORT", 3001);
  await app.listen(port);

  console.log(`🔐 Identity Service running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
