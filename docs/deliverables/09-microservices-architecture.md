# 🏗️ Microservices Architecture Design

## Executive Summary

A practical microservices architecture designed for educational value while being production-ready for MVP deployment. The design balances simplicity for a small team with scalability for future growth, using 5 core services with clear separation of concerns.

## 1. System Architecture Overview

### **High-Level Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Angular 18 + PrimeNG + NgRx                                              │
│  - Training Calendar (Primary Feature)                                     │
│  - Athlete Management Dashboard                                            │
│  - Communication Hub                                                       │
│  - Performance Analytics                                                   │
│  Hosted: Vercel (Port 4200 dev, HTTPS prod)                              │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │ HTTPS/WSS
┌─────────────────────────▼───────────────────────────────────────────────────┐
│                           API GATEWAY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  NestJS Gateway Service (Port 3000)                                        │
│  ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐                 │
│  │ Authentication  │ │ Rate Limiting│ │ Request Routing │                 │
│  │ & Authorization │ │ & Throttling │ │ & Load Balancing│                 │
│  └─────────────────┘ └──────────────┘ └─────────────────┘                 │
│  ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐                 │
│  │ CORS & Security │ │ Request      │ │ Circuit Breaker │                 │
│  │ Headers         │ │ Logging      │ │ & Health Checks │                 │
│  └─────────────────┘ └──────────────┘ └─────────────────┘                 │
│  Hosted: Railway                                                           │
└─────────┬───────────┬─────────────┬─────────────┬─────────────────────────┘
          │           │             │             │
    ┌─────▼─────┐┌───▼────┐┌────────▼────┐┌──────▼──────┐
    │ Identity  ││ Sports ││ Club Mgmt   ││Communication│
    │ Service   ││Service ││ Service     ││ Service     │
    │Port 3001  ││Port    ││ Port 3003   ││ Port 3004   │
    └─────┬─────┘│ 3002   │└─────────────┘└─────────────┘
          │      └────┬───┘
          │           │
┌─────────▼───────────▼───────────────────────────────────────────────────────┐
│                          DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL + Prisma ORM                                                   │
│  ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐                 │
│  │ Users & Auth    │ │ Sports Data  │ │ Club & Finance  │                 │
│  │ - User profiles │ │ - Athletes   │ │ - Club info     │                 │
│  │ - Sessions      │ │ - Training   │ │ - Memberships   │                 │
│  │ - Permissions   │ │ - Performance│ │ - Payments      │                 │
│  └─────────────────┘ └──────────────┘ └─────────────────┘                 │
│  Multi-tenant with club_id isolation + Row Level Security                  │
│  Hosted: Supabase (Free tier → Cloud SQL)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

External Integrations:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Google OAuth │ │Email Service│ │File Storage │ │Push Notific.│
│Authentication│ │(Resend)     │ │(Cloudinary) │ │(Web Push)   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### **Service Communication Flow**

```
Training Session Creation Example:
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│Frontend │───▶│Gateway  │───▶│Sports   │───▶│Identity │───▶│Comm     │
│Angular  │    │Port 3000│    │Port 3002│    │Port 3001│    │Port 3004│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     │ 1.Create     │ 2.Validate   │ 3.Create     │ 4.Get        │ 5.Notify
     │ Session      │ JWT & Route  │ Session      │ Athletes     │ Athletes
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
WebSocket◄─────────────────────Real-time Updates─────────────────────────
```

## 2. Detailed Service Definitions

### **🌐 API Gateway (Port 3000) - Central Entry Point**

**Primary Responsibilities:**

- **Request Routing**: Intelligent routing to appropriate microservices
- **Authentication**: Centralized JWT validation and user context
- **Rate Limiting**: Protect backend services from abuse
- **Security**: CORS, security headers, request sanitization
- **Monitoring**: Request/response logging and metrics collection

**Core Features:**

```typescript
// Gateway routing configuration
@Controller()
export class GatewayController {
  @Get('api/training/*')
  @UseGuards(JwtAuthGuard)
  async forwardToSports(@Req() req, @Res() res) {
    return this.httpService.forward(req, 'sports-service:3002');
  }

  @Get('api/users/*')
  @UseGuards(JwtAuthGuard)
  async forwardToIdentity(@Req() req, @Res() res) {
    return this.httpService.forward(req, 'identity-service:3001');
  }
}
```

**Technology Stack:**

- **Framework**: NestJS with Express
- **Middleware**: JWT validation, rate limiting (express-rate-limit)
- **Monitoring**: Request logging with correlation IDs
- **Health Checks**: Service discovery and health monitoring

**Deployment:**

- **Hosting**: Railway (primary service)
- **Environment**: Production HTTPS with custom domain
- **Scaling**: Horizontal scaling based on request volume

### **👤 Identity Service (Port 3001) - Authentication & Authorization**

**Primary Responsibilities:**

- **User Management**: User profiles, registration, deactivation
- **Authentication**: Google OAuth integration and session management
- **Authorization**: Role-based access control (RBAC) and permissions
- **Multi-tenancy**: Club membership and cross-club access management
- **Session Management**: JWT generation, refresh, and revocation

**Core Features:**

```typescript
@Controller('auth')
export class AuthController {
  @Post('google')
  async googleAuth(@Body() googleTokenDto: GoogleTokenDto) {
    const user = await this.authService.validateGoogleToken(googleTokenDto.token);
    const session = await this.sessionService.createSession(user.id);
    const jwt = this.jwtService.generateToken(user, session);
    return { user, jwt, session };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserContext) {
    return this.userService.getProfile(user.id);
  }
}
```

**Data Entities:**

- **Users**: Basic user information and Google OAuth data
- **Sessions**: Active sessions with device and location tracking
- **Roles**: Predefined roles (coach, admin, athlete, parent, medical, director)
- **Permissions**: Granular permissions for each role
- **ClubMemberships**: User-club relationships with role assignments

**Security Features:**

- **OAuth Integration**: Google OAuth 2.0 with PKCE
- **JWT Management**: Short-lived access tokens with refresh tokens
- **Multi-device Support**: Track and manage multiple active sessions
- **Audit Logging**: Track authentication events and permission changes

### **🏊‍♂️ Sports Service (Port 3002) - Core Business Logic**

**Primary Responsibilities:**

- **Athlete Management**: Comprehensive athlete profiles and performance tracking
- **Training Management**: Session creation, scheduling, and attendance
- **Performance Analytics**: Performance data collection and trend analysis
- **Competition Management**: Competition registration and results tracking
- **Sports Intelligence**: Performance insights and improvement recommendations

**Core Features:**

```typescript
@Controller('training')
export class TrainingController {
  @Post('sessions')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('training:create')
  async createSession(@Body() createSessionDto: CreateTrainingSessionDto) {
    const session = await this.trainingService.createSession(createSessionDto);

    // Notify assigned athletes
    await this.communicationService.notifyAthletes(
      session.assignedAthletes,
      'training-session-created',
      session,
    );

    return session;
  }

  @Get('sessions/calendar')
  @UseGuards(JwtAuthGuard)
  async getCalendar(@CurrentUser() user: UserContext, @Query() filters: CalendarFiltersDto) {
    return this.trainingService.getCalendar(user.clubId, filters);
  }
}
```

**Data Entities:**

- **Athletes**: Comprehensive athlete profiles with performance history
- **TrainingSessions**: Training session details, assignments, and attendance
- **PerformanceData**: Flexible JSONB storage for sport-specific metrics
- **Competitions**: Competition information and athlete registrations
- **Goals**: Personal and team goals with progress tracking

**Business Logic:**

- **Performance Calculations**: Automatic PR detection and trend analysis
- **Training Load Management**: Volume and intensity calculations
- **Competition Readiness**: Performance predictions for upcoming competitions
- **Injury Risk Assessment**: Training load vs. recovery analysis

### **🏢 Club Management Service (Port 3003) - Administrative Operations**

**Primary Responsibilities:**

- **Club Administration**: Club information, settings, and configuration
- **Membership Management**: Membership tiers, billing, and renewals
- **Financial Operations**: Payment processing, invoicing, and reporting
- **Facility Management**: Pool scheduling and resource allocation
- **Administrative Reporting**: Business intelligence and operational metrics

**Core Features:**

```typescript
@Controller('clubs')
export class ClubController {
  @Get(':clubId/dashboard')
  @UseGuards(JwtAuthGuard, ClubAccessGuard)
  @RequirePermission('club:view')
  async getClubDashboard(@Param('clubId') clubId: string) {
    const [members, revenue, sessions, performance] = await Promise.all([
      this.membershipService.getMemberStats(clubId),
      this.financeService.getRevenueStats(clubId),
      this.trainingService.getSessionStats(clubId),
      this.performanceService.getClubPerformance(clubId),
    ]);

    return { members, revenue, sessions, performance };
  }
}
```

**Data Entities:**

- **Clubs**: Club information, settings, and branding
- **Memberships**: Membership records with tier and status
- **Payments**: Payment transactions and billing history
- **Invoices**: Generated invoices and payment tracking
- **Reports**: Cached financial and operational reports

**Financial Features:**

- **Automated Billing**: Monthly membership fee processing
- **Payment Integration**: Multiple payment gateway support
- **Financial Reporting**: Revenue, expenses, and profitability analysis
- **Compliance**: Tax reporting and financial audit trails

### **📢 Communication Service (Port 3004) - Messaging & Notifications**

**Primary Responsibilities:**

- **Push Notifications**: Real-time browser and mobile notifications
- **Email Communications**: Transactional and marketing emails
- **In-app Messaging**: Announcements, alerts, and direct messaging
- **Communication Preferences**: User notification preferences and settings
- **Communication Analytics**: Delivery tracking and engagement metrics

**Core Features:**

```typescript
@Controller('notifications')
export class NotificationController {
  @Post('send')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('communication:send')
  async sendNotification(@Body() notificationDto: SendNotificationDto) {
    const notification = await this.notificationService.create(notificationDto);

    // Multi-channel delivery
    await Promise.all([
      this.pushService.send(notification),
      this.emailService.send(notification),
      this.websocketService.broadcast(notification),
    ]);

    return notification;
  }
}
```

**Communication Channels:**

- **WebSocket**: Real-time updates for training calendar changes
- **Email**: Transactional emails via Resend service
- **Push Notifications**: Browser push notifications with service worker
- **In-app**: Toast notifications and announcement banners

**Message Types:**

- **Training Updates**: Session changes, cancellations, assignments
- **Performance Alerts**: Personal records, goal achievements
- **Administrative**: Billing reminders, club announcements
- **Emergency**: Urgent club communications and alerts

## 3. Inter-Service Communication Strategy

### **HTTP REST Communication**

**Synchronous Communication Pattern:**

```typescript
// Sports Service calling Identity Service
@Injectable()
export class AthleteService {
  constructor(@Inject('IDENTITY_SERVICE') private identityService: ClientProxy) {}

  async getAthleteWithUserInfo(athleteId: string) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    // Synchronous HTTP call to Identity Service
    const userInfo = await this.identityService
      .send({ cmd: 'get_user' }, { userId: athlete.userId })
      .toPromise();

    return { ...athlete, userInfo };
  }
}
```

**Circuit Breaker Pattern:**

```typescript
@Injectable()
export class ServiceCommunication {
  async callWithCircuitBreaker<T>(serviceCall: () => Promise<T>, fallback: () => T): Promise<T> {
    try {
      return await timeout(serviceCall(), 5000); // 5s timeout
    } catch (error) {
      console.error('Service call failed, using fallback:', error);
      return fallback();
    }
  }
}
```

### **Event-Driven Updates (Simple)**

**Training Session Creation Flow:**

```typescript
// 1. Sports Service creates session
const session = await this.trainingService.create(sessionData);

// 2. Get affected athletes from Identity Service
const athletes = await this.identityService.getAthletesByIds(session.athleteIds);

// 3. Send notifications via Communication Service
await this.communicationService.notifyAthletes(athletes, {
  type: 'training-session-created',
  sessionId: session.id,
  message: `New training session: ${session.title}`,
});

// 4. Real-time update via WebSocket
this.websocketGateway.emit('session-created', {
  clubId: session.clubId,
  session,
});
```

### **Distributed Transaction Handling**

**Saga Pattern for Complex Operations:**

```typescript
@Injectable()
export class AthleteRegistrationSaga {
  async registerAthlete(registrationData: AthleteRegistrationDto) {
    const transaction = await this.db.transaction();

    try {
      // Step 1: Create user in Identity Service
      const user = await this.identityService.createUser(registrationData.userInfo);

      // Step 2: Create athlete in Sports Service
      const athlete = await this.sportsService.createAthlete({
        ...registrationData.athleteInfo,
        userId: user.id,
      });

      // Step 3: Create membership in Club Management
      const membership = await this.clubService.createMembership({
        userId: user.id,
        clubId: registrationData.clubId,
        membershipType: registrationData.membershipType,
      });

      // Step 4: Send welcome communications
      await this.communicationService.sendWelcomeEmail(user.email, {
        athleteName: athlete.name,
        clubName: membership.club.name,
      });

      await transaction.commit();
      return { user, athlete, membership };
    } catch (error) {
      await transaction.rollback();
      // Implement compensation logic
      await this.compensateFailedRegistration(user?.id, athlete?.id);
      throw error;
    }
  }
}
```

## 4. Monorepo Structure and Organization

### **Complete Project Structure**

```
sports-platform/
├── apps/                                    # Microservices applications
│   ├── api-gateway/                        # Port 3000 - Central gateway
│   │   ├── src/
│   │   │   ├── main.ts                    # Gateway entry point
│   │   │   ├── gateway.module.ts          # Main gateway module
│   │   │   ├── auth/                      # Authentication middleware
│   │   │   ├── routing/                   # Service routing logic
│   │   │   ├── security/                  # Security middleware
│   │   │   └── monitoring/                # Health checks and metrics
│   │   ├── Dockerfile                     # Container configuration
│   │   └── package.json                   # Service-specific dependencies
│   │
│   ├── identity-service/                   # Port 3001 - User management
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── identity.module.ts
│   │   │   ├── auth/                      # OAuth and JWT handling
│   │   │   ├── users/                     # User management
│   │   │   ├── roles/                     # RBAC implementation
│   │   │   └── sessions/                  # Session management
│   │   └── Dockerfile
│   │
│   ├── sports-service/                     # Port 3002 - Core sports logic
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── sports.module.ts
│   │   │   ├── athletes/                  # Athlete management
│   │   │   ├── training/                  # Training sessions
│   │   │   ├── performance/               # Performance tracking
│   │   │   ├── competitions/              # Competition management
│   │   │   └── analytics/                 # Sports analytics
│   │   └── Dockerfile
│   │
│   ├── club-management/                    # Port 3003 - Administrative
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── club.module.ts
│   │   │   ├── clubs/                     # Club information
│   │   │   ├── memberships/               # Membership management
│   │   │   ├── finance/                   # Financial operations
│   │   │   └── reports/                   # Administrative reporting
│   │   └── Dockerfile
│   │
│   └── communication/                      # Port 3004 - Messaging
│       ├── src/
│       │   ├── main.ts
│       │   ├── communication.module.ts
│       │   ├── notifications/             # Push notifications
│       │   ├── email/                     # Email service
│       │   ├── websocket/                 # Real-time messaging
│       │   └── preferences/               # Communication preferences
│       └── Dockerfile
│
├── libs/                                   # Shared libraries
│   ├── shared/
│   │   ├── auth/                          # Authentication utilities
│   │   │   ├── guards/                    # Route guards
│   │   │   ├── strategies/                # Passport strategies
│   │   │   ├── decorators/                # Custom decorators
│   │   │   └── jwt/                       # JWT utilities
│   │   │
│   │   ├── database/                      # Database configuration
│   │   │   ├── prisma/                    # Prisma schema and client
│   │   │   ├── migrations/                # Database migrations
│   │   │   ├── seeds/                     # Database seeding
│   │   │   └── config/                    # Database configuration
│   │   │
│   │   ├── common/                        # Common utilities
│   │   │   ├── dto/                       # Data Transfer Objects
│   │   │   ├── interfaces/                # TypeScript interfaces
│   │   │   ├── enums/                     # Shared enumerations
│   │   │   ├── validators/                # Custom validators
│   │   │   └── utils/                     # Utility functions
│   │   │
│   │   ├── communication/                 # Communication utilities
│   │   │   ├── email/                     # Email templates and service
│   │   │   ├── push/                      # Push notification service
│   │   │   └── websocket/                 # WebSocket utilities
│   │   │
│   │   └── monitoring/                    # Monitoring and logging
│   │       ├── logging/                   # Structured logging
│   │       ├── metrics/                   # Performance metrics
│   │       └── health/                    # Health check utilities
│   │
│   └── types/                             # Shared TypeScript types
│       ├── user.types.ts                  # User-related types
│       ├── sports.types.ts                # Sports-specific types
│       └── club.types.ts                  # Club management types
│
├── frontend/                              # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                      # Core services and guards
│   │   │   ├── shared/                    # Shared components
│   │   │   ├── features/                  # Feature modules
│   │   │   │   ├── training/              # Training calendar
│   │   │   │   ├── athletes/              # Athlete management
│   │   │   │   ├── performance/           # Performance tracking
│   │   │   │   └── communication/         # Communication hub
│   │   │   └── store/                     # NgRx state management
│   │   └── environments/                  # Environment configurations
│   └── Dockerfile
│
├── docs/                                  # Documentation
│   ├── api/                              # API documentation
│   │   ├── gateway.md                    # Gateway API docs
│   │   ├── identity.md                   # Identity service docs
│   │   ├── sports.md                     # Sports service docs
│   │   ├── club.md                       # Club management docs
│   │   └── communication.md              # Communication docs
│   ├── architecture/                     # Architecture documentation
│   │   ├── decisions/                    # Architecture Decision Records
│   │   ├── diagrams/                     # System diagrams
│   │   └── patterns/                     # Design patterns used
│   └── deployment/                       # Deployment guides
│       ├── development.md                # Local development setup
│       ├── staging.md                    # Staging deployment
│       └── production.md                 # Production deployment
│
├── scripts/                              # Development and deployment scripts
│   ├── dev/                             # Development utilities
│   │   ├── start-all.sh                 # Start all services
│   │   ├── reset-db.sh                  # Reset development database
│   │   └── generate-docs.sh             # Generate API documentation
│   ├── build/                           # Build scripts
│   │   ├── build-all.sh                 # Build all services
│   │   ├── docker-build.sh              # Build Docker images
│   │   └── test-all.sh                  # Run all tests
│   └── deploy/                          # Deployment scripts
│       ├── deploy-staging.sh            # Deploy to staging
│       ├── deploy-production.sh         # Deploy to production
│       └── migrate-db.sh                # Database migration
│
├── docker-compose.yml                    # Local development environment
├── docker-compose.prod.yml              # Production environment
├── package.json                         # Root package.json with workspaces
├── nx.json                              # Nx configuration (optional)
├── tsconfig.base.json                   # Base TypeScript configuration
├── .env.example                         # Environment variables template
├── .gitignore                           # Git ignore rules
└── README.md                            # Project documentation
```

### **Development Scripts**

```bash
# filepath: /Users/eliecer.lopez/sports-platform/scripts/dev/start-all.sh
#!/bin/bash

echo "🏊‍♂️ Starting Sports Platform Development Environment"
echo "=================================================="

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start database if not running
if ! docker ps | grep -q postgres; then
    echo "🗄️ Starting PostgreSQL database..."
    docker-compose up -d postgres redis
    sleep 5
fi

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Start all services concurrently
echo "🚀 Starting all microservices..."
npm run dev:all

echo "✅ All services started!"
echo ""
echo "🌐 Frontend:          http://localhost:4200"
echo "🚪 API Gateway:       http://localhost:3000"
echo "👤 Identity Service:  http://localhost:3001"
echo "🏊‍♂️ Sports Service:    http://localhost:3002"
echo "🏢 Club Management:   http://localhost:3003"
echo "📢 Communication:     http://localhost:3004"
echo ""
echo "📚 API Docs:          http://localhost:3000/api/docs"
echo "🗄️ Database Studio:   http://localhost:5555"
```
