# Phase 2.1 - Technical Reference Guide

## Quick Reference

### Running the Sports Service

```bash
# Navigate to service directory
cd apps/sports-service

# Install dependencies
npm install

# Build the service
npm run build

# Start development server (with hot reload)
npm run start:dev

# Run production build
npm run start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Service Ports & URLs

| Service        | Port | Swagger Docs                   |
| -------------- | ---- | ------------------------------ |
| Sports Service | 3002 | http://localhost:3002/api/docs |
| API Prefix     | -    | http://localhost:3002/api      |

---

## API Endpoint Reference

### Training Sessions

#### Create Session

```
POST /api/sessions
Body: CreateTrainingSessionDto
Response: TrainingSession
```

#### List Sessions

```
GET /api/sessions?coachId=&athleteId=&startDate=&endDate=&type=&status=&limit=&offset=
Query Parameters: All optional
Response: { data: TrainingSession[], pagination: { total, limit, offset, pages } }
```

#### Get Session Details

```
GET /api/sessions/{id}
Response: TrainingSession with coach & athlete assignments
```

#### Update Session

```
PATCH /api/sessions/{id}
Body: Partial<CreateTrainingSessionDto>
Response: Updated TrainingSession
```

#### Delete Session

```
DELETE /api/sessions/{id}
Response: { message: "Training session deleted successfully" }
```

#### Update Session Status

```
PATCH /api/sessions/{id}/status
Body: { status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "POSTPONED" }
Response: TrainingSession
```

#### Record Attendance

```
POST /api/sessions/{id}/attendance
Body: RecordAttendanceDto
Response: TrainingAssignment with athlete
```

#### Get Attendance Summary

```
GET /api/sessions/{id}/attendance
Response: SessionAttendanceSummary
```

#### Get Detailed Attendance List

```
GET /api/sessions/{id}/attendance-list
Response: TrainingAssignment[]
```

#### Assign Athlete to Session

```
POST /api/sessions/{id}/athletes/{athleteId}
Response: TrainingAssignment
```

#### Get Calendar View

```
GET /api/calendar?coachId=&startDate=&endDate=
Response: TrainingSession[] (ordered by date)
```

---

## DTO Schemas

### CreateTrainingSessionDto

```typescript
{
  title: string (required)
  description?: string
  type: SessionType (TRAINING|COMPETITION|FRIENDLY|TECHNIQUE|RECOVERY)
  intensity: SessionIntensity (LOW|MODERATE|HIGH|VERY_HIGH)
  startTime: ISO8601 datetime (required)
  endTime: ISO8601 datetime (required)
  location?: string
  athleteIds?: string[]
  plannedDuration?: number (minutes)
  notes?: string
}
```

### RecordAttendanceDto

```typescript
{
  athleteId: string (required)
  sessionId: string (required)
  status: AttendanceStatus (PRESENT|ABSENT|LATE|EXCUSED|INJURED) (required)
  checkInTime?: ISO8601 datetime
  checkOutTime?: ISO8601 datetime
  notes?: string
}
```

### SessionAttendanceSummary

```typescript
{
  sessionId: string;
  date: Date;
  total: number;
  present: number;
  absent: number;
  late: number;
  earlyDeparture: number;
  attendanceRate: number(percentage);
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": []
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Training session {id} not found",
  "error": "Not Found"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

---

## Type Definitions

### PrismaAttendanceStatus

```typescript
type PrismaAttendanceStatus = 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE';
```

### AttendanceStatus (DTO)

```typescript
enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED', // Maps to ABSENT
  INJURED = 'INJURED', // Maps to ABSENT
}
```

### SessionType

```typescript
enum SessionType {
  TRAINING = 'TRAINING',
  COMPETITION = 'COMPETITION',
  FRIENDLY = 'FRIENDLY',
  TECHNIQUE = 'TECHNIQUE',
  RECOVERY = 'RECOVERY',
}
```

### SessionIntensity

```typescript
enum SessionIntensity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}
```

---

## Testing Guide

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- training.service.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Structure

Each test follows the AAA pattern:

```typescript
it('should create training session successfully', async () => {
  // Arrange - Setup test data and mocks
  const createDto = {
    /* ... */
  };
  mockPrismaService.trainingSession.create.mockResolvedValue(createdSession);

  // Act - Execute the function
  const result = await service.createSession(createDto, mockClubId, mockCoachId);

  // Assert - Verify results
  expect(result).toEqual(
    expect.objectContaining({
      /* expected properties */
    }),
  );
});
```

### Mock Setup Pattern

```typescript
const mockPrismaService = {
  trainingSession: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  trainingAssignment: {
    create: jest.fn(),
    upsert: jest.fn(),
    groupBy: jest.fn(),
  },
};
```

---

## Security Headers

### Headers Set by Application

| Header                    | Value              | Purpose                |
| ------------------------- | ------------------ | ---------------------- |
| X-Frame-Options           | DENY               | Prevent clickjacking   |
| X-Content-Type-Options    | nosniff            | Prevent MIME sniffing  |
| X-Request-ID              | UUID (per-request) | Request tracking       |
| X-API-Version             | v1                 | API version tracking   |
| X-Sports-Service          | Sports-Service-v1  | Service identification |
| Strict-Transport-Security | max-age=31536000   | HTTPS enforcement      |
| Content-Security-Policy   | strict             | Script/content control |

---

## Database Schema Reference

### TrainingSession Model

```prisma
model TrainingSession {
  id              String        @id @default(dbgenerated("uuid_generate_v4()"))
  clubId          String        @map("club_id")
  title           String
  description     String?
  sport           Sport
  category        String        // Session type
  level           AthleteLevel?
  scheduledAt     DateTime      @map("scheduled_at")
  duration        Int           // Minutes
  location        String?
  status          SessionStatus // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, POSTPONED
  actualStartTime DateTime?     @map("actual_start_time")
  actualEndTime   DateTime?     @map("actual_end_time")
  coachId         String        @map("coach_id")
  assistantCoaches String[]     @default([])
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  coach               User
  trainingAssignments TrainingAssignment[]
  performanceData     PerformanceData[]
}
```

### TrainingAssignment Model

```prisma
model TrainingAssignment {
  id               String           @id @default(dbgenerated("uuid_generate_v4()"))
  clubId           String           @map("club_id")
  sessionId        String           @map("session_id")
  athleteId        String           @map("athlete_id")
  assignedBy       String           @map("assigned_by")
  assignedAt       DateTime         @default(now())
  status           AssignmentStatus // ASSIGNED, CONFIRMED, DECLINED, CANCELLED
  attendanceStatus AttendanceStatus // SCHEDULED, PRESENT, ABSENT, LATE, EARLY_DEPARTURE
  checkedInAt      DateTime?        @map("checked_in_at")
  checkedOutAt     DateTime?        @map("checked_out_at")
  coachNotes       String?          @map("coach_notes")
  athleteNotes     String?          @map("athlete_notes")
  rating           Int?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  // Relations
  session  TrainingSession
  athlete  Athlete
  assigner User
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sports_platform

# Node Environment
NODE_ENV=development|production

# Port
PORT=3002

# JWT Configuration (used by Identity Service)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRATION=3600

# Service Configuration
SERVICE_NAME=sports-service
LOG_LEVEL=debug|info|warn|error
```

---

## File Organization

### Source Code Structure

```
apps/sports-service/src/
├── main.ts                    # Application bootstrap
├── app.module.ts              # Main module with DI
├── athletes/                  # Pre-existing athlete module
├── training/                  # NEW Training module
│   ├── training.service.ts    # Business logic
│   ├── training.controller.ts # HTTP handlers
│   ├── training.module.ts     # Module definition
│   ├── training.service.spec.ts # Unit tests
│   └── dto/                   # Data transfer objects
├── performance/               # NEW Performance module
│   ├── performance.service.ts
│   ├── performance.controller.ts
│   ├── performance.module.ts
│   ├── performance.service.spec.ts
│   └── dto/
├── competitions/              # NEW Competitions module
│   ├── competitions.service.ts
│   ├── competitions.controller.ts
│   ├── competitions.module.ts
│   ├── competitions.service.spec.ts
│   └── dto/
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
// In main.ts or service
import { Logger } from '@nestjs/common';

const logger = new Logger('TrainingService');
logger.debug('Message', 'context');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Check Request Headers

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Club-ID: YOUR_CLUB_ID" \
  http://localhost:3002/api/sessions
```

### View Swagger Documentation

Visit: http://localhost:3002/api/docs

### Test Single Endpoint

```bash
# Create a session
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Session",
    "type": "TRAINING",
    "intensity": "HIGH",
    "startTime": "2025-10-24T10:00:00Z",
    "endTime": "2025-10-24T11:30:00Z",
    "location": "Pool A"
  }'
```

---

## Performance Considerations

### Pagination

- Default limit: 20 records
- Recommended max limit: 100
- Use offset/limit for large datasets

### Filtering

- Indexes created on:
  - (clubId, scheduledAt)
  - (clubId, status)
  - (coachId, scheduledAt)
  - (clubId, attendanceStatus)

### Query Optimization

- Always filter by `clubId` (multi-tenant safety)
- Use specific date ranges when available
- Avoid N+1 queries (use include/select)

---

## Deployment Checklist

- [ ] Verify environment variables set
- [ ] Database migrations applied
- [ ] Build successful (`npm run build`)
- [ ] Tests passing (`npm test`)
- [ ] Security headers configured
- [ ] JWT secret configured
- [ ] CORS settings appropriate for environment
- [ ] Database backups configured
- [ ] Monitoring/logging configured
- [ ] Health checks working
- [ ] Swagger docs accessible

---

## Useful Commands

```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Build for production
npm run build

# Start development server
npm run start:dev

# Start production server
npm run start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint

# Format code
npm run format

# Generate Prisma client
npx prisma generate

# Migrate database
npx prisma migrate dev --name migration_name

# Prisma Studio (visual DB browser)
npx prisma studio
```

---

## Common Issues & Solutions

### Issue: JWT Token Invalid

**Solution:** Verify token is not expired and secret matches between services

### Issue: Database Connection Fails

**Solution:** Check DATABASE_URL format and PostgreSQL is running

### Issue: Tests Fail with Timeout

**Solution:** Increase Jest timeout in jest.config.js

### Issue: Type Errors in Build

**Solution:** Ensure all exported types are properly declared and imported

### Issue: CORS Errors

**Solution:** Check CORS configuration in main.ts matches frontend origin

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Jest Testing Guide](https://jestjs.io/docs/getting-started)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** October 24, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
