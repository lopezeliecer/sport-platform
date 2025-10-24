/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  createSecurityConfig,
  addCustomSecurityHeaders,
} from '@sports-platform/shared/common/src/security/security.config';
import { SecurityValidationPipe } from '@sports-platform/shared/common/src/validation/security-validation.pipe';
import { SanitizationService } from '@sports-platform/shared/common/src/validation/sanitization.service';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const sanitizationService = app.get(SanitizationService);

  const isProduction = configService.get('NODE_ENV') === 'production';
  const securityConfig = createSecurityConfig(isProduction);

  // Security Headers with Helmet
  app.use(helmet(securityConfig.helmet as any));

  // Override specific headers if needed and generate unique request ID per request
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Sports-Service', 'Sports-Service-v1');
    res.setHeader('X-Request-ID', randomUUID());
    res.setHeader('X-API-Version', 'v1');
    next();
  });

  // Custom security headers (without X-Request-ID which is now per-request)
  app.use(addCustomSecurityHeaders({} as any));

  // CORS configuration
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
        console.error('Validation errors:', errors);
        return new ValidationPipe().createExceptionFactory()(errors);
      },
    }),
  );

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Sports Platform - Sports Service API')
    .setDescription('API for managing athletes, training sessions, and performance data')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Athletes', 'Athlete management endpoints')
    .addTag('Training', 'Training session management')
    .addTag('Performance', 'Performance tracking and metrics')
    .addTag('Competitions', 'Competition management endpoints')
    .addServer('http://localhost:3002', 'Development server')
    .addServer('https://api.sports-platform.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start the server
  const port = configService.get('PORT', 3002);
  await app.listen(port);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║         🏊‍♂️  SPORTS SERVICE STARTED 🏊‍♂️                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Sports Service running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔍 Health Check: http://localhost:${port}/api/v1/health\n`);
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
