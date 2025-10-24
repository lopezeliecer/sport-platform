# API Gateway - Sports Platform

## Overview

The API Gateway is the central entry point for all microservices in the Sports Platform. It handles:

- **Request Routing**: Intelligently routes requests to appropriate microservices
- **Authentication**: JWT validation and authorization
- **Rate Limiting**: Per-user and per-endpoint rate limiting
- **Health Checks**: Monitors all microservices availability
- **Documentation**: Aggregates Swagger documentation from all services
- **Logging**: Centralized request/response logging with correlation IDs
- **Security**: Security headers, CORS configuration, input validation

## Architecture

```
Client Request
     ↓
API Gateway (Port 3000)
├── Authentication Middleware (JWT validation)
├── Rate Limiting
├── Request Logging (with Correlation ID)
├── Request Routing
├── Service Detection
└── Request Forwarding
     ↓
Microservices
├── Identity Service (3001)
├── Sports Service (3002)
├── Club Management (3003)
└── Communication Service (3004)
```

## Features

### 1. Dynamic Routing

- Automatically routes requests based on URL path
- Intelligent service discovery
- Path-based service mapping

### 2. Health Checks

- Monitors all microservices health
- Aggregated health status endpoint
- Caching for performance

### 3. Swagger Aggregation

- Combines documentation from all services
- Single unified API documentation
- Service-prefixed endpoints

### 4. Rate Limiting

- Short-term burst protection (3 req/sec)
- Long-term protection (100 req/min)
- Per-user throttling

### 5. Correlation IDs

- Unique ID for each request
- Passed to all microservices
- Enables end-to-end request tracing

### 6. Security

- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- JWT authentication support

## Quick Start

### Installation

```bash
cd apps/api-gateway
npm install
```

### Environment Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

# Microservices
IDENTITY_SERVICE_URL=http://localhost:3001
SPORTS_SERVICE_URL=http://localhost:3002
CLUB_MANAGEMENT_URL=http://localhost:3003
COMMUNICATION_SERVICE_URL=http://localhost:3004

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:4200
```

### Development Mode

```bash
npm run start:dev

# With file watching
npm run start:dev:watch
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Gateway Management

#### Health Check - Gateway

```http
GET http://localhost:3000/api/v1/gateway/health
```

Response:

```json
{
  "status": "UP",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "service": "API Gateway",
  "version": "1.0.0"
}
```

#### Health Check - All Services

```http
GET http://localhost:3000/api/v1/gateway/services/health
```

Response:

```json
{
  "overall": "UP",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "services": {
    "total": 4,
    "up": 4,
    "down": 0,
    "degraded": 0
  },
  "details": [
    {
      "name": "Identity Service",
      "status": "UP",
      "url": "http://localhost:3001",
      "responseTime": 45,
      "lastCheck": "2025-10-23T10:30:00.000Z"
    },
    ...
  ]
}
```

#### Aggregated Documentation

```http
GET http://localhost:3000/api/v1/gateway/docs
```

Returns combined Swagger/OpenAPI specification from all services.

### Service Proxying

#### Route to Identity Service

```http
GET http://localhost:3000/api/v1/auth/login
POST http://localhost:3000/api/v1/auth/register
```

#### Route to Sports Service

```http
GET http://localhost:3000/api/v1/sports/athletes
POST http://localhost:3000/api/v1/sports/athletes
GET http://localhost:3000/api/v1/sports/training
```

#### Route to Club Management

```http
GET http://localhost:3000/api/v1/clubs
POST http://localhost:3000/api/v1/clubs
```

#### Route to Communication Service

```http
POST http://localhost:3000/api/v1/communication/notifications
GET http://localhost:3000/api/v1/communication/messages
```

## Service Routing Map

| Path Pattern              | Service         | Port |
| ------------------------- | --------------- | ---- |
| `/api/v1/auth/*`          | Identity        | 3001 |
| `/api/v1/identity/*`      | Identity        | 3001 |
| `/api/v1/sports/*`        | Sports          | 3002 |
| `/api/v1/athletes/*`      | Sports          | 3002 |
| `/api/v1/training/*`      | Sports          | 3002 |
| `/api/v1/clubs/*`         | Club Management | 3003 |
| `/api/v1/communication/*` | Communication   | 3004 |
| `/api/v1/notifications/*` | Communication   | 3004 |
| `/api/v1/messages/*`      | Communication   | 3004 |

## Request Flow

### 1. Incoming Request

```
POST http://localhost:3000/api/v1/auth/login
```

### 2. Gateway Processing

- Generate Correlation ID: `550e8400-e29b-41d4-a716-446655440000`
- Extract service: `auth` → `identity-service`
- Validate JWT (if required)
- Check rate limits
- Log request

### 3. Service Routing

- Build target URL: `http://localhost:3001/api/v1/login`
- Add correlation ID header
- Forward request to Identity Service

### 4. Response Handling

- Receive response from Identity Service
- Add correlation ID to response
- Add response time header
- Log response
- Return to client

### 5. Response

```json
{
  "X-Correlation-ID": "550e8400-e29b-41d4-a716-446655440000",
  "X-Response-Time": "125ms",
  "data": {...}
}
```

## Configuration

### Service Configuration

Update `src/gateway/services/proxy.service.ts`:

```typescript
private initializeServices(): void {
  const services: ServiceConfig[] = [
    {
      name: 'identity',
      url: this.configService.get('IDENTITY_SERVICE_URL', 'http://localhost:3001'),
      basePath: '/api/v1/auth',
      port: 3001,
    },
    // ... other services
  ];
}
```

### Rate Limiting Configuration

Update `src/app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000, // 1 second
    limit: 3, // 3 requests
  },
  {
    name: 'long',
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests
  },
]);
```

### CORS Configuration

The CORS configuration is inherited from the shared security config. Customize in `libs/shared/common/src/security/security.config.ts`.

## Logging

### Correlation ID Tracking

All requests are assigned a unique correlation ID for end-to-end tracing:

```
[550e8400-e29b-41d4-a716-446655440000] POST /api/v1/auth/login
[550e8400-e29b-41d4-a716-446655440000] Proxying to identity: POST http://localhost:3001/api/v1/login
[550e8400-e29b-41d4-a716-446655440000] identity responded with 200 (45ms)
[550e8400-e29b-41d4-a716-446655440000] Gateway responded with 200 (125ms)
```

### Log Levels

- `debug`: Detailed request/response information
- `log`: Informational messages
- `warn`: Warning conditions
- `error`: Error conditions

## Performance

### Health Check Caching

- Health checks are cached for 5 seconds
- Reduces unnecessary service calls
- Can be cleared manually: `healthCheckService.clearCache()`

### Swagger Documentation Caching

- Documentation is cached for 5 minutes
- Refreshed on startup
- Falls back to cached version if services are unavailable

### Request Timeouts

- Service requests timeout after 10 seconds
- Max 5 redirects allowed per request
- Configurable in `HttpModule` configuration

## Error Handling

### Service Unavailable (503)

```json
{
  "statusCode": 503,
  "message": "Service not available",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "path": "/api/v1/sports/athletes"
}
```

### Invalid Service (400)

```json
{
  "statusCode": 400,
  "message": "Cannot determine target service for path: /api/v1/invalid",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "path": "/api/v1/invalid"
}
```

### Rate Limit Exceeded (429)

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "timestamp": "2025-10-23T10:30:00.000Z",
  "path": "/api/v1/sports/athletes"
}
```

## Development

### Running Tests

```bash
npm run test              # Run tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # End-to-end tests
```

### Linting

```bash
npm run lint             # Fix issues
npm run lint:check       # Check only
```

### Building

```bash
npm run build            # Build project
npm run prebuild         # Clean dist
```

## Troubleshooting

### Gateway Won't Start

1. Check port 3000 is available

   ```bash
   lsof -i :3000
   ```

2. Verify environment variables

   ```bash
   cat .env
   ```

3. Check dependencies are installed
   ```bash
   npm install
   ```

### Services Not Reachable

1. Verify service URLs in `.env`
2. Check services are running
3. Check network connectivity

### Rate Limiting Too Strict

Adjust in `src/app.module.ts`:

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,
    limit: 10, // Increase from 3
  },
  {
    name: 'long',
    ttl: 60000,
    limit: 200, // Increase from 100
  },
]);
```

### Correlation IDs Not Appearing

Check:

1. Logger service is injected properly
2. Correlation ID is generated: `logger.generateCorrelationId()`
3. Passed in headers: `X-Correlation-ID`

## Next Steps

1. **Phase 2**: Complete microservices structure
2. **Phase 3**: Docker Compose setup
3. **Phase 4**: Automation scripts
4. **Phase 5**: Configuration & documentation

## Related Documents

- [PROMPT_9_TRANSITION_PLAN.md](../../docs/PROMPT_9_TRANSITION_PLAN.md)
- [Architecture Overview](../../docs/CURRENT_STATUS.md)
- [Security Implementation](../../docs/STEP_10_SECURITY_ARCHITECTURE.md)
