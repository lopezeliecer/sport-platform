# API Gateway Architecture - Visual Reference

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│                     (Frontend / Mobile / CLI)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    HTTP/REST API Requests
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (3000)                           │
│                   Central Request Routing Point                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │            REQUEST PROCESSING PIPELINE                       │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  1. INCOMING REQUEST                                          │ │
│  │     └─ Method, Path, Headers, Body                           │ │
│  │                                                               │ │
│  │  2. SECURITY & VALIDATION LAYER                               │ │
│  │     ├─ Helmet.js Security Headers                            │ │
│  │     ├─ CORS Validation                                       │ │
│  │     ├─ Rate Limiting Check (Throttler)                       │ │
│  │     ├─ Input Validation & Sanitization                       │ │
│  │     └─ JWT Authentication (if required)                      │ │
│  │                                                               │ │
│  │  3. LOGGING & TRACING                                         │ │
│  │     ├─ Generate Correlation ID (UUID)                        │ │
│  │     ├─ Log Incoming Request                                  │ │
│  │     └─ Add X-Correlation-ID Header                           │ │
│  │                                                               │ │
│  │  4. REQUEST ROUTING                                           │ │
│  │     ├─ Extract Service Name from Path                        │ │
│  │     ├─ Validate Service Exists                               │ │
│  │     ├─ Build Target URL                                      │ │
│  │     └─ Determine HTTP Method                                 │ │
│  │                                                               │ │
│  │  5. FORWARD TO SERVICE                                        │ │
│  │     ├─ Set Request Headers (correlation ID, auth, etc.)      │ │
│  │     ├─ Send HTTP Request                                     │ │
│  │     └─ Wait for Response (10s timeout)                       │ │
│  │                                                               │ │
│  │  6. RESPONSE PROCESSING                                       │ │
│  │     ├─ Receive Response from Service                         │ │
│  │     ├─ Log Response & Timing                                 │ │
│  │     ├─ Add Response Headers (correlation ID, timing)         │ │
│  │     └─ Return to Client                                      │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │             GATEWAY MANAGEMENT SERVICES                       │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  HEALTH CHECK SERVICE                                         │ │
│  │  ├─ Polls all microservices every 5 seconds                  │ │
│  │  ├─ Measures response times                                  │ │
│  │  ├─ Determines UP/DOWN/DEGRADED status                       │ │
│  │  ├─ Caches results (5 sec TTL)                               │ │
│  │  └─ Provides aggregated summary                              │ │
│  │                                                               │ │
│  │  SWAGGER AGGREGATOR SERVICE                                   │ │
│  │  ├─ Fetches Swagger docs from all services                   │ │
│  │  ├─ Combines into single OpenAPI spec                        │ │
│  │  ├─ Caches combined docs (5 min TTL)                         │ │
│  │  ├─ Falls back to minimal docs if services down              │ │
│  │  └─ Prefixes paths with service names                        │ │
│  │                                                               │ │
│  │  LOGGER SERVICE                                               │ │
│  │  ├─ Generates unique Correlation IDs (UUID)                  │ │
│  │  ├─ Logs all incoming requests                               │ │
│  │  ├─ Logs all outgoing requests                               │ │
│  │  ├─ Logs service responses & timing                          │ │
│  │  ├─ Maintains request context                                │ │
│  │  └─ Cleans up old logs (hourly)                              │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │           │           │           │
          │           │           │           │
   HTTP  │    HTTP   │    HTTP   │    HTTP   │ Requests
Forwarded│ Forwarded │ Forwarded │ Forwarded │ with
         │           │           │           │ Correlation
         │           │           │           │ IDs
         ▼           ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐
    │ IDENTITY│  │ SPORTS │  │ CLUBS  │  │ COMMUNICATION
    │ SERVICE │  │SERVICE │  │SERVICE │  │  SERVICE
    │ (3001)  │  │ (3002) │  │ (3003) │  │  (3004)
    └────────┘  └────────┘  └────────┘  └──────────┘
         │           │           │           │
         │ Database  │ Database  │ Database  │ Database
         │ Calls     │ Calls     │ Calls     │ Calls
         └───────────┼───────────┼───────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  PostgreSQL     │
            │  SHARED DB      │
            │  (1 instance)   │
            └─────────────────┘
```

## Request Flow Sequence Diagram

```
Client                    Gateway                   Service
  │                          │                         │
  │ 1. POST /api/v1/auth    │                         │
  │────────────────────────>│                         │
  │                         │                         │
  │                    Generate UUID                  │
  │                    550e8400-e29b-...              │
  │                         │                         │
  │                    Rate Limit Check               │
  │                         ✓ Allowed                 │
  │                         │                         │
  │                    Validate Input                 │
  │                         ✓ Valid                   │
  │                         │                         │
  │                    Extract Service               │
  │                    "auth" → "identity"            │
  │                         │                         │
  │                    Build Target URL              │
  │                    http://localhost:3001/...      │
  │                         │                         │
  │                    2. POST (with X-Correlation-ID)
  │                    ───────────────────────────────>│
  │                         │                         │
  │                         │                    Process
  │                         │                    Request
  │                         │                         │
  │                    3. 200 OK Response             │
  │                    <───────────────────────────────│
  │                         │                         │
  │                    Add Response Headers           │
  │                    X-Correlation-ID: 550e8400...  │
  │                    X-Response-Time: 45ms          │
  │                         │                         │
  │                    4. 200 OK + Response           │
  │<────────────────────────────────────────────────────│
  │    (with Correlation ID for tracing)              │
  │                         │                         │
```

## Service Discovery & Routing Logic

```
Incoming Request: POST /api/v1/auth/login

Step 1: Extract Path Parts
┌─────────────────────────────────┐
│ /api/v1/auth/login              │
│  ↓ ↓ ↓ ↓ ↓                      │
│ api v1 auth login               │
│          ▲▲▲▲                   │
│       Service Name              │
└─────────────────────────────────┘

Step 2: Map to Service
┌─────────────────────────────────────────┐
│ Routing Map:                            │
│                                         │
│ "auth" → "identity-service"             │
│ "identity" → "identity-service"         │
│ "sports" → "sports-service"             │
│ "clubs" → "club-management"             │
│ "communication" → "communication"       │
└─────────────────────────────────────────┘

Step 3: Get Service Configuration
┌──────────────────────────────────────────────┐
│ Identity Service Config:                     │
│                                              │
│ name: "identity"                             │
│ url: "http://localhost:3001"                 │
│ basePath: "/api/v1/auth"                     │
│ port: 3001                                   │
└──────────────────────────────────────────────┘

Step 4: Build Target URL
┌──────────────────────────────────────────────┐
│ http://localhost:3001/api/v1/login           │
│                                              │
│ = BaseURL + Path (preserving structure)      │
└──────────────────────────────────────────────┘

Step 5: Forward Request
┌──────────────────────────────────────────────┐
│ POST http://localhost:3001/api/v1/login      │
│                                              │
│ Headers:                                     │
│ - X-Correlation-ID: 550e8400-...             │
│ - X-Forwarded-By: api-gateway                │
│ - Authorization: <preserved from original>   │
│ - Content-Type: application/json             │
│                                              │
│ Body: <original request body>                │
└──────────────────────────────────────────────┘
```

## Rate Limiting Logic

```
Request arrives at Gateway
              │
              ▼
    ┌─────────────────┐
    │ Check Rate Limit│
    │  "short" rule?  │
    └────────┬────────┘
             │
      ┌──────┴──────┐
      │             │
   YES│             │NO
      │             │
      ▼             │
  ┌─────────┐       │
  │ 3 req/s │       │
  │Exceeded?│       │
  └────┬────┘       │
       │            │
     YES│           │NO
       │            │
       ▼            │
  ┌────────────┐    │
  │ Return 429 │    │
  │ Too Many   │    │
  │ Requests   │    │
  └────────────┘    │
                    ▼
            ┌─────────────────┐
            │ Check Rate Limit│
            │  "long" rule?   │
            └────────┬────────┘
                     │
              ┌──────┴──────┐
              │             │
           YES│             │NO
              │             │
              ▼             │
          ┌─────────┐       │
          │100 req/m│       │
          │Exceeded?│       │
          └────┬────┘       │
               │            │
             YES│           │NO
               │            │
               ▼            │
          ┌────────────┐    │
          │ Return 429 │    │
          │ Too Many   │    │
          │ Requests   │    │
          └────────────┘    │
                            ▼
                    ┌──────────────┐
                    │ Allow Request│
                    │ Continue     │
                    │ Processing   │
                    └──────────────┘
```

## Health Check Process

```
Gateway Initialization
         │
         ▼
    Initialize Health Cache
    (Set all services to DOWN)
         │
         ▼
    Every 5 seconds (or on request)
         │
         ├─────────────────────────────────────┐
         │                                     │
         ▼                                     │
    Check Identity Service                    │
    Timeout: 5 seconds                        │
         │                                     │
         ├─ UP (200 OK) → cache as "UP"        │
         ├─ Error → cache as "DOWN"            │
         └─ Timeout → cache as "DOWN"          │
         │                                     │
         ▼                                     │
    Check Sports Service                      │
    (same logic)                              │
         │                                     │
         ▼                                     │
    Check Club Management                     │
    (same logic)                              │
         │                                     │
         ▼                                     │
    Check Communication                       │
    (same logic)                              │
         │                                     │
         ├────────────────────────────────────┤
         │
         ▼
    Generate Summary:
    - Overall: UP/DOWN/DEGRADED
    - Individual status for each
    - Response times
    - Timestamp
         │
         ▼
    Return to Client /api/v1/gateway/services/health
```

## Correlation ID Tracking

```
Request Timeline with Correlation ID: 550e8400-e29b-41d4-a716-446655440000

T+0ms   Client sends request
        [No ID yet]

T+5ms   Gateway receives request
        [550e8400...] POST /api/v1/auth/login
        Generate Correlation ID

T+10ms  Log incoming request
        [550e8400...] Incoming: POST /api/v1/auth/login

T+15ms  Validate and check rate limiting
        [550e8400...] Rate limit check: PASS

T+20ms  Forward to Identity Service
        [550e8400...] Proxying to identity: POST http://localhost:3001/api/v1/login
        Header: X-Correlation-ID: 550e8400-...

T+65ms  Identity Service responds
        [550e8400...] identity responded with 200 (45ms)

T+70ms  Add response headers
        [550e8400...] Gateway response: 200 (total: 70ms)
        Header: X-Correlation-ID: 550e8400-...
        Header: X-Response-Time: 70ms

T+75ms  Send response to client
        Response includes all correlation headers
        for client-side tracing

FULL TRACE: [550e8400-...] visible in all logs
```

## Service Dependencies

```
Gateway Dependencies:

    Gateway Module
         │
         ├─ @nestjs/axios
         │  └─ For HTTP calls to microservices
         │
         ├─ @nestjs/config
         │  └─ For environment configuration
         │
         ├─ @nestjs/throttler
         │  └─ For rate limiting
         │
         ├─ @nestjs/swagger
         │  └─ For documentation aggregation
         │
         ├─ helmet
         │  └─ For security headers
         │
         └─ uuid
            └─ For correlation ID generation

Service Dependencies:

    Shared Libraries
         │
         ├─ libs/shared/common
         │  ├─ security.config.ts (Helmet config)
         │  ├─ security-validation.pipe.ts
         │  └─ sanitization.service.ts
         │
         ├─ @prisma/client
         │  └─ For database type definitions
         │
         └─ helmet, passport, class-validator
            └─ For security and validation
```

## File Organization

```
apps/api-gateway/
│
├── src/
│   │
│   ├── main.ts (110 lines)
│   │   └─ NestJS bootstrap with security
│   │
│   ├── app.module.ts (50 lines)
│   │   └─ Root module configuration
│   │
│   └── gateway/
│       │
│       ├── gateway.controller.ts (130 lines)
│       │   └─ Main request handler
│       │
│       └── services/
│           │
│           ├── proxy.service.ts (250 lines)
│           │   └─ Dynamic routing engine
│           │
│           ├── health-check.service.ts (180 lines)
│           │   └─ Service health monitoring
│           │
│           ├── swagger-aggregator.service.ts (220 lines)
│           │   └─ Documentation combining
│           │
│           └── logger.service.ts (130 lines)
│               └─ Centralized logging
│
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env (environment configuration)
└── README.md (comprehensive guide)
```

This visual architecture provides a complete reference for understanding the API Gateway structure and how requests flow through the system.
