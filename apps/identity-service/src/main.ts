import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get("FRONTEND_URL", "http://localhost:4200"),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

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
