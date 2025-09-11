# Sports Management Platform

A comprehensive sports management platform designed for sports clubs, initially focused on swimming but scalable to other sports.

## 🏗️ Architecture

### Backend (NestJS Microservices)
- **api-gateway** (Port 3000): Centralized routing and request handling
- **identity-service** (Port 3001): Authentication, users, roles, and sessions
- **sports-service** (Port 3002): Athletes, training, and competitions management
- **club-management** (Port 3003): Clubs, payments, and memberships
- **communication** (Port 3004): Notifications and announcements

### Frontend (Angular)
- **Framework**: Angular 18/19 with TypeScript
- **UI Library**: PrimeNG for rich data components
- **State Management**: NgRx for complex state handling
- **Architecture**: Feature modules by domain

### Database
- **Primary DB**: PostgreSQL with Prisma ORM
- **Multi-tenant**: Club-based separation with club_id
- **Flexible Data**: JSONB for sports metrics and flexible data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Angular CLI
- NestJS CLI

### Installation
```bash
# Clone and install dependencies
npm install

# Setup database
npm run db:setup

# Start microservices
npm run start:dev

# Start frontend
npm run frontend:start
```

## 📁 Project Structure

```
sports-platform/
├── apps/                    # Microservices
│   ├── api-gateway/         # API Gateway (Port 3000)
│   ├── identity-service/    # Auth & Users (Port 3001)
│   ├── sports-service/      # Sports Domain (Port 3002)
│   ├── club-management/     # Club Operations (Port 3003)
│   └── communication/       # Notifications (Port 3004)
├── libs/                    # Shared Libraries
│   ├── shared/auth/         # Authentication utilities
│   ├── database/            # Prisma configuration
│   └── common/              # DTOs, interfaces, utilities
├── frontend/                # Angular Application
├── docs/                    # Documentation
└── scripts/                 # Build and deployment scripts
```

## 🎯 Key Features

### Core Functionality
- **Multi-tenant Architecture**: Support for multiple sports clubs
- **Role-based Access Control**: 6 user roles (Coaches, Admins, Athletes, Medical, Parents, Directors)
- **Training Management**: Comprehensive training planning and tracking
- **Competition Management**: Event organization and results tracking
- **Financial Management**: Payments, memberships, and billing

### Central Component
- **TrainingCalendarPage**: Weekly view calendar as the main dashboard
- **Coach-centric Design**: Optimized for trainer workflows
- **Real-time Updates**: Live notifications and data synchronization

## 🔐 Security

- **Authentication**: Google OAuth as primary provider
- **Authorization**: Granular permissions per role per club
- **Session Management**: PostgreSQL-based sessions with JWT for microservices
- **Audit Trail**: Comprehensive logging for critical operations

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Passport.js + Google OAuth
- **Architecture**: Domain-Driven Design (DDD)
- **Communication**: HTTP REST between services

### Frontend
- **Framework**: Angular with TypeScript
- **UI Components**: PrimeNG
- **State Management**: NgRx
- **Styling**: SCSS with responsive design
- **Future**: Progressive Web App (PWA) capabilities

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Project architecture design
- [x] Technology stack selection
- [x] Security strategy definition

### Phase 2: Backend Development 🚧
- [ ] Microservices setup
- [ ] Database schema implementation
- [ ] Authentication system
- [ ] Core business logic

### Phase 3: Frontend Development 📋
- [ ] Angular application setup
- [ ] Core components implementation
- [ ] TrainingCalendarPage development
- [ ] State management setup

### Phase 4: Integration & Testing
- [ ] Service integration
- [ ] End-to-end testing
- [ ] Performance optimization

### Phase 5: Deployment & Monitoring
- [ ] DevOps pipeline
- [ ] Production deployment
- [ ] Monitoring and analytics

## 👥 Target Users

1. **Coaches/Trainers**: Primary users managing training plans and athlete progress
2. **Club Administrators**: Managing club operations and memberships
3. **Athletes**: Tracking personal progress and training schedules
4. **Medical Staff**: Managing athlete health and injury tracking
5. **Parents**: Monitoring their children's progress and schedules
6. **Club Directors**: Overview of club performance and analytics

## 📊 Initial Scale

- **Clubs**: 2 swimming clubs initially
- **Users**: ~100 total users (50 athletes per club)
- **Growth**: Designed to scale to multiple sports and larger user bases

## 🤝 Contributing

Please read our contributing guidelines and follow the established patterns for microservices and component development.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
