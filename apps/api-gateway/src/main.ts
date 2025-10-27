/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
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

  // Generate gateway instance ID once at startup
  const gatewayInstanceId = randomUUID();

  // Security Headers with Helmet
  app.use(helmet(securityConfig.helmet as any));

  // Override specific headers if needed
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Gateway-Service', 'API-Gateway-v1');
    res.setHeader('X-Request-ID', `${gatewayInstanceId}-${Date.now()}`);
    next();
  });

  // Custom security headers
  app.use(
    addCustomSecurityHeaders({
      'X-API-Version': 'v1',
    } as any),
  );

  // CORS Configuration
  app.enableCors(securityConfig.cors);

  // Global Security Validation Pipe and Rate Limiting - Configured in AppModule with ThrottlerGuard
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

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation for API Gateway
  const config = new DocumentBuilder()
    .setTitle('Sports Platform - API Gateway')
    .setDescription(
      'Central API Gateway for the sports platform - Routes requests to microservices',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Gateway', 'API Gateway routing and aggregation')
    .addTag('Health', 'Service health checks and status')
    .addServer('http://localhost:3000', 'Development server')
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

  // Expose Gateway Swagger JSON
  app.use('/api/docs-json', (req: any, res: any) => {
    try {
      res.header('Content-Type', 'application/json');
      res.header('Cache-Control', 'public, max-age=300');
      res.status(200).send(document);
    } catch (error) {
      console.error('Error serving API docs JSON:', error);
      res.status(500).json({ error: 'Failed to retrieve API documentation' });
    }
  });

  // Start server
  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║           🚀 API GATEWAY SERVICE STARTED 🚀              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Gateway running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔍 Health Check: http://localhost:${port}/api/v1/gateway/health`);
  console.log(`📊 Services Status: http://localhost:${port}/api/v1/gateway/services/health\n`);
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
