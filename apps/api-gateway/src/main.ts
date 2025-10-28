import { NextFunction, Request, Response } from 'express';
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
  app.use(helmet(securityConfig.helmet));

  // Override specific headers if needed
  app.use((req: Request, res: Response, next: NextFunction) => {
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

  // Swagger documentation for API Gateway (Gateway-only endpoints)
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

  // Setup Gateway-only Swagger UI at /api/docs
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
  app.use('/api/docs-json', (req: Request, res: Response) => {
    try {
      res.header('Content-Type', 'application/json');
      res.header('Cache-Control', 'public, max-age=300');
      res.status(200).send(document);
    } catch (error) {
      console.error('Error serving API docs JSON:', error);
      res.status(500).json({ error: 'Failed to retrieve API documentation' });
    }
  });

  // Setup Aggregated Swagger UI at /api/docs/all (combines all microservices)
  // This dynamically fetches and combines docs from all services
  app.use('/api/docs/all', async (req: Request, res: Response) => {
    try {
      // Import the swagger aggregator service
      const swaggerAggregatorService = app.get('SwaggerAggregatorService');
      const aggregatedDocs = await swaggerAggregatorService.getAggregatedDocs();

      // Return Swagger UI HTML that uses the aggregated docs
      const swaggerUiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sports Platform - Complete API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css">
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.5/favicon-32x32.png" sizes="32x32" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; padding:0; }
    .topbar { display: none; }
    .swagger-ui .info .title { font-size: 36px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(aggregatedDocs)};
      
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        docExpansion: "none",
        filter: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
        displayRequestDuration: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>`;

      res.header('Content-Type', 'text/html');
      res.status(200).send(swaggerUiHtml);
    } catch (error) {
      console.error('Error serving aggregated Swagger UI:', error);
      res.status(500).send(`
<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
  <h1>Failed to load aggregated documentation</h1>
  <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
  <p>Please check that all microservices are running and accessible.</p>
  <ul>
    <li><a href="http://localhost:3001/api/docs">Identity Service</a></li>
    <li><a href="http://localhost:3002/api/docs">Sports Service</a></li>
    <li><a href="http://localhost:3003/api/docs">Club Management</a></li>
    <li><a href="http://localhost:3004/api/docs">Communication Service</a></li>
  </ul>
</body>
</html>`);
    }
  });

  // Start server
  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.info('\n╔════════════════════════════════════════════════════════════╗');
  console.info('║                                                            ║');
  console.info('║           🚀 API GATEWAY SERVICE STARTED 🚀              ║');
  console.info('║                                                            ║');
  console.info('╚════════════════════════════════════════════════════════════╝\n');
  console.info(`✅ Gateway running on: http://localhost:${port}`);
  console.info(`📚 Gateway API Docs: http://localhost:${port}/api/docs`);
  console.info(`📖 Complete API Docs (All Services): http://localhost:${port}/api/docs/all`);
  console.info(`🔍 Health Check: http://localhost:${port}/api/v1/gateway/health`);
  console.info(`📊 Services Status: http://localhost:${port}/api/v1/gateway/services/health`);
  console.info(`⚡ Circuit Breakers: http://localhost:${port}/api/v1/gateway/circuit-breakers\n`);
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
