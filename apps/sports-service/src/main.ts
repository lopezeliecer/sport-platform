import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4200",
    credentials: true,
  });

  // Global prefix for API routes
  app.setGlobalPrefix("api/v1");

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle("Sports Platform - Sports Service API")
    .setDescription(
      "API for managing athletes, training sessions, and performance data"
    )
    .setVersion("1.0.0")
    .addBearerAuth()
    .addTag("Athletes", "Athlete management endpoints")
    .addTag("Training", "Training session management")
    .addTag("Performance", "Performance tracking and metrics")
    .addServer("http://localhost:3001", "Development server")
    .addServer("https://api.sports-platform.com", "Production server")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  // Start the server
  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🚀 Sports Service is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

bootstrap();
