# 🛡️ Security Guidelines for Developers

## Overview

This document provides comprehensive security guidelines for developers working on the Sports Platform. It covers secure coding practices, common vulnerabilities, usage patterns, and best practices for maintaining the security posture of the system.

---

## Table of Contents

1. [Core Security Principles](#core-security-principles)
2. [Secure Coding Practices](#secure-coding-practices)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation & Output Encoding](#input-validation--output-encoding)
5. [Cryptography & Secrets](#cryptography--secrets)
6. [Database Security](#database-security)
7. [API Security](#api-security)
8. [Error Handling & Logging](#error-handling--logging)
9. [Common Vulnerabilities & Prevention](#common-vulnerabilities--prevention)
10. [Security Patterns & Code Examples](#security-patterns--code-examples)
11. [Testing for Security](#testing-for-security)
12. [Security Review Checklist](#security-review-checklist)

---

## Core Security Principles

### 1. Principle of Least Privilege

**Definition:** Grant only the minimum permissions necessary to perform a function.

#### Application to Developers:

```typescript
// ❌ DON'T: Grant admin access to everyone
@UseGuards(JwtAuthGuard)
async manageUsers(@Request() req) {
  return this.userService.getAllUsers(); // No permission check
}

// ✅ DO: Check permissions for sensitive operations
@Permissions('manage:users')
@UseGuards(JwtAuthGuard, RBACGuard)
async manageUsers(@Request() req) {
  return this.userService.getAllUsers();
}

// ✅ BETTER: Check specific permission and resource ownership
@Permissions('manage:club-users')
@UseGuards(JwtAuthGuard, RBACGuard, ClubContextGuard)
async manageClubUsers(@Request() req, @Param('clubId') clubId: string) {
  // Guard ensures req.user.clubId === clubId
  return this.userService.getUsersByClub(clubId);
}
```

### 2. Defense in Depth

**Definition:** Implement multiple overlapping security layers.

#### Application to API Endpoints:

```typescript
async createAthlete(
  @Body() createAthleteDto: CreateAthleteDto, // Layer 1: Input validation
  @Request() req, // Layer 2: Authentication
) {
  // Layer 3: Authorization
  @UseGuards(JwtAuthGuard, RBACGuard)

  // Layer 4: Resource ownership
  if (req.user.clubId !== createAthleteDto.clubId) {
    throw new ForbiddenException('Club mismatch');
  }

  // Layer 5: Input sanitization
  const sanitized = this.sanitizeInput(createAthleteDto);

  // Layer 6: Business logic validation
  await this.validateAthleteData(sanitized);

  // Layer 7: Database access control (Prisma filters by club)
  return this.prisma.athlete.create({
    data: {
      ...sanitized,
      clubId: req.user.clubId, // Enforce club context
    },
  });
}
```

### 3. Fail Securely

**Definition:** If security mechanisms fail, deny access by default.

#### Application:

```typescript
// ❌ DON'T: Allow access if permission check fails
try {
  const hasPermission = await this.checkPermission(req.user, 'view:data');
} catch (error) {
  // If check fails, grant access anyway
  return this.getSensitiveData();
}

// ✅ DO: Deny by default on check failure
try {
  const hasPermission = await this.checkPermission(req.user, 'view:data');
  if (!hasPermission) {
    throw new ForbiddenException('Access denied');
  }
} catch (error) {
  // Any error means access denied
  throw new ForbiddenException('Permission check failed');
}

// ✅ BETTER: Use guards to fail securely
@UseGuards(JwtAuthGuard, RBACGuard) // Fails if any guard fails
async getSensitiveData(@Request() req) {
  // Only reached if both guards pass
  return this.data;
}
```

### 4. Don't Trust User Input

**Definition:** Validate and sanitize all data from users.

#### Application:

```typescript
// ❌ DON'T: Use user input directly in queries
async searchAthletes(@Query('name') name: string) {
  return this.prisma.athlete.findMany({
    where: {
      name: name, // Direct user input - vulnerable to injection
    },
  });
}

// ✅ DO: Validate and sanitize input
@Query()
async searchAthletes(@Query('name') name: string) {
  // Validation via DTO
  if (!name || name.length > 100) {
    throw new BadRequestException('Invalid name');
  }

  // Type safety from TypeScript
  const athletes = await this.prisma.athlete.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
  });

  return athletes;
}

// ✅ BETTER: Use DTO validation
@Post()
async createAthlete(@Body() createAthleteDto: CreateAthleteDto) {
  // Validation happens automatically via class-validator
  // InvalidException thrown if validation fails
  return this.athleteService.create(createAthleteDto);
}
```

---

## Secure Coding Practices

### Type Safety with TypeScript

```typescript
// ❌ DON'T: Use 'any' type
function processUser(user: any) {
  return user.email; // Could fail at runtime
}

// ✅ DO: Use explicit types
interface User {
  id: string;
  email: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
}

function processUser(user: User): string {
  return user.email; // Type-safe
}

// ✅ BETTER: Use stricter compiler options
// tsconfig.json:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Error Handling

```typescript
// ❌ DON'T: Reveal stack traces in production
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  try {
    return await this.athleteService.getById(id);
  } catch (error) {
    // Returns full stack trace to user
    throw error;
  }
}

// ✅ DO: Return safe error messages
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  try {
    return await this.athleteService.getById(id);
  } catch (error) {
    this.logger.error(`Failed to get athlete ${id}`, error); // Log full error
    throw new NotFoundException('Athlete not found'); // Safe message to user
  }
}

// ✅ BETTER: Use centralized error handling
@UseFilters(SecurityExceptionFilter)
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  // Exceptions automatically caught and sanitized
  return await this.athleteService.getById(id);
}
```

### Resource Cleanup

```typescript
// ❌ DON'T: Leak resources
async processFile(filePath: string) {
  const file = fs.readFileSync(filePath);
  const data = file.toString();
  return data; // File handle may not be closed
}

// ✅ DO: Properly clean up resources
async processFile(filePath: string) {
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return data; // Properly closed
}

// ✅ BETTER: Use context managers (if available)
async processFile(filePath: string) {
  using fileHandle = await fs.promises.open(filePath, 'r');
  const data = await fileHandle.readFile('utf-8');
  return data; // Auto-closed on scope exit
}
```

---

## Authentication & Authorization

### JWT Usage

```typescript
// ✅ DO: Validate JWT on every request
import { JwtAuthGuard } from '@shared/auth';

@Controller('api/v1/athletes')
@UseGuards(JwtAuthGuard) // Validates JWT on every request
export class AthletesController {
  @Get()
  async getAthletes(@Request() req) {
    // req.user is only set if JWT is valid
    console.log('Authenticated user:', req.user.id);
  }
}

// JWT Token Structure:
{
  "sub": "user_123",          // Subject (user ID)
  "email": "user@example.com",
  "role": "COACH",             // Role
  "clubId": "club_456",        // Multi-tenancy context
  "iat": 1697000000,           // Issued at
  "exp": 1697003600,           // Expiration (15 minutes)
  "iss": "sports-platform",    // Issuer
  "aud": "sports-platform-api" // Audience
}
```

### Permission Checking

```typescript
// ❌ DON'T: Check permissions manually every time
@Get('admin-panel')
async adminPanel(@Request() req) {
  if (req.user.role !== 'ADMIN') {
    throw new ForbiddenException();
  }
  // ...
}

// ✅ DO: Use permission decorators
@Permissions('manage:system')
@UseGuards(JwtAuthGuard, RBACGuard)
@Get('admin-panel')
async adminPanel(@Request() req) {
  // Permission checked automatically
}

// ✅ BETTER: Use fine-grained permissions
@Permissions('manage:users', 'view:audit-logs')
@UseGuards(JwtAuthGuard, RBACGuard)
@Get('admin-panel')
async adminPanel(@Request() req) {
  // Both permissions required
}
```

### Multi-Tenancy Context

```typescript
// ✅ DO: Always enforce club context
@Post('athletes')
@UseGuards(JwtAuthGuard, ClubContextGuard)
async createAthlete(
  @Body() createAthleteDto: CreateAthleteDto,
  @Request() req
) {
  // ClubContextGuard validates req.headers['x-club-id'] matches req.user.clubId
  const clubId = req.user.clubId;

  // Always include club context in queries
  return this.prisma.athlete.create({
    data: {
      ...createAthleteDto,
      clubId, // Enforced
    },
  });
}

// ✅ DO: Filter queries by club
async getAthletesByClub(clubId: string) {
  // ALWAYS filter by club - even if not visible in URL
  return this.prisma.athlete.findMany({
    where: {
      clubId, // Mandatory filter
    },
  });
}
```

---

## Input Validation & Output Encoding

### DTO Validation

```typescript
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsEnum,
  ValidateNested,
  IsArray,
} from 'class-validator';

// ✅ DO: Use comprehensive DTOs
export class CreateAthleteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @IsEnum(AthleteLevel)
  level: AthleteLevel;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sports: string[];
}

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @MaxLength(5)
  zipCode: string;
}

// ✅ DO: Validate in controller
@Post('athletes')
@UseGuards(JwtAuthGuard)
async createAthlete(@Body() createAthleteDto: CreateAthleteDto) {
  // Validation happens automatically
  // BadRequestException thrown if invalid
  return this.athleteService.create(createAthleteDto);
}
```

### Output Encoding

```typescript
// ❌ DON'T: Return raw user input in responses
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  const athlete = await this.prisma.athlete.findUnique({ where: { id } });
  // If athlete.notes contain malicious HTML, it's returned as-is
  return athlete;
}

// ✅ DO: Sanitize output
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  const athlete = await this.prisma.athlete.findUnique({ where: { id } });
  // Sanitize sensitive fields
  return {
    ...athlete,
    notes: this.sanitizeHtml(athlete.notes),
    ssn: '***-**-' + athlete.ssn.slice(-4),
  };
}

// ✅ BETTER: Use serialization decorators
export class AthleteResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Transform(({ value }) => this.sanitizeHtml(value))
  @Expose()
  notes: string;

  @Transform(({ value }) => '***-**-' + value.slice(-4))
  @Expose()
  ssn: string;
}

// In controller:
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  const athlete = await this.prisma.athlete.findUnique({ where: { id } });
  return this.serializer.transform(athlete, AthleteResponse);
}
```

---

## Cryptography & Secrets

### Secure Secret Management

```typescript
// ❌ DON'T: Store secrets in code or .env
const DATABASE_PASSWORD = 'super-secret-password';

// ❌ DON'T: Commit .env file
// .env
DATABASE_URL=postgresql://user:password@localhost/db

// ✅ DO: Use environment variables
const dbUrl = process.env.DATABASE_URL;

// ✅ BETTER: Use secrets management
import { SecretsManagementService } from '@identity/environment-security';

export class DatabaseService {
  constructor(private secretsService: SecretsManagementService) {}

  async connect() {
    const dbUrl = await this.secretsService.getSecret('DATABASE_URL');
    // Secret retrieved from secure vault
    return createConnection(dbUrl);
  }
}

// ✅ BEST: Use Key Rotation
// Keys rotated automatically every 90 days
// Old keys kept for decryption of existing data
// New keys used for encryption of new data
```

### Password Hashing

```typescript
// ❌ DON'T: Store passwords in plaintext
async createUser(email: string, password: string) {
  return this.prisma.user.create({
    data: {
      email,
      password, // ❌ NEVER store plaintext
    },
  });
}

// ❌ DON'T: Use weak hashing
import crypto from 'crypto';

const hashedPassword = crypto
  .createHash('sha256')
  .update(password)
  .digest('hex');

// ✅ DO: Use bcrypt with salt
import * as bcrypt from 'bcryptjs';

async createUser(email: string, password: string) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return this.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
}

// ✅ BETTER: Use dedicated AuthService
export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async createUser(email: string, password: string) {
    const hashedPassword = await this.hashPassword(password);
    return this.prisma.user.create({
      data: { email, password: hashedPassword },
    });
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isValid = await this.verifyPassword(password, user.password);
    return isValid ? user : null;
  }
}
```

---

## Database Security

### Query Construction

```typescript
// ❌ DON'T: Construct queries with string concatenation
async searchAthletes(name: string) {
  // Vulnerable to SQL injection
  return this.prisma.$queryRaw`
    SELECT * FROM athletes WHERE name LIKE '%${name}%'
  `;
}

// ✅ DO: Use Prisma parameterized queries
async searchAthletes(name: string) {
  return this.prisma.athlete.findMany({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
  });
}

// ✅ DO: Use Prisma.$queryRawUnsafe with parameterization
async searchAthletes(name: string) {
  return this.prisma.$queryRaw`
    SELECT * FROM athletes WHERE name ILIKE ${'%' + name + '%'}
  `;
}
```

### Access Control

```typescript
// ❌ DON'T: Return all columns
async getAthlete(id: string) {
  return this.prisma.athlete.findUnique({
    where: { id },
    // Returns all columns including sensitive ones
  });
}

// ✅ DO: Select specific columns
async getAthlete(id: string) {
  return this.prisma.athlete.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      level: true,
      // Excludes sensitive fields like ssn, medical_data
    },
  });
}

// ✅ BETTER: Use DTOs for response shaping
async getAthlete(id: string): Promise<AthleteResponseDto> {
  const athlete = await this.prisma.athlete.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      level: true,
    },
  });

  return new AthleteResponseDto(athlete);
}
```

### Soft Deletes for Audit

```typescript
// ✅ DO: Use soft deletes for audit trail
async deleteAthlete(id: string) {
  return this.prisma.athlete.update({
    where: { id },
    data: {
      deletedAt: new Date(), // Soft delete
      deletedBy: this.currentUser.id,
    },
  });
}

// ✅ DO: Exclude soft-deleted records by default
async getAthletes() {
  return this.prisma.athlete.findMany({
    where: {
      deletedAt: null, // Exclude deleted records
    },
  });
}

// ✅ DO: Allow admin to view deleted records
async getDeletedAthletes() {
  return this.prisma.athlete.findMany({
    where: {
      deletedAt: { not: null }, // Only deleted records
    },
  });
}
```

---

## API Security

### Rate Limiting

```typescript
// ✅ DO: Apply rate limiting globally
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// ✅ DO: Apply stricter limits to sensitive endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
@Post('auth/login')
async login(@Body() credentials: LoginDto) {
  return this.authService.login(credentials);
}

// ✅ DO: Provide rate limit info in headers
// Response includes:
// X-RateLimit-Limit: 100
// X-RateLimit-Remaining: 95
// X-RateLimit-Reset: 1234567890
```

### CORS Configuration

```typescript
// ✅ DO: Restrict CORS to trusted origins
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const trustedOrigins = ['https://sports-platform.io', 'https://app.sports-platform.io'];

      if (!origin || trustedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
}

bootstrap();
```

### Security Headers

```typescript
// ✅ DO: Add comprehensive security headers
import { HelmetModule } from '@nestjs/helmet';

@Module({
  imports: [
    HelmetModule.forRoot({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      xssFilter: true,
      noSniff: true,
    }),
  ],
})
export class AppModule {}

// ✅ Result: Response headers include
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Strict-Transport-Security: max-age=31536000
// Content-Security-Policy: ...
```

---

## Error Handling & Logging

### Structured Logging

```typescript
// ❌ DON'T: Use console.log for security events
console.log('User ' + userId + ' accessed ' + resourceId);

// ✅ DO: Use structured logging
import { Logger } from '@nestjs/common';

export class AthletesService {
  private readonly logger = new Logger(AthletesService.name);

  async getAthlete(id: string) {
    this.logger.log(`Fetching athlete: ${id}`);
    try {
      return await this.prisma.athlete.findUnique({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to fetch athlete ${id}: ${error.message}`);
      throw new InternalServerErrorException('Database error');
    }
  }
}

// ✅ BETTER: Use audit logging for security events
import { AuditLogger } from '@identity/security-monitoring';

export class AthletesService {
  constructor(private auditLogger: AuditLogger) {}

  async getAthlete(id: string, userId: string, clubId: string) {
    await this.auditLogger.logEvent({
      eventType: 'data_accessed',
      userId,
      resource: 'athlete',
      resourceId: id,
      clubId,
      action: 'GET',
    });

    return await this.prisma.athlete.findUnique({ where: { id } });
  }
}
```

### Exception Handling

```typescript
// ❌ DON'T: Expose internal error details
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  try {
    return await this.athleteService.getAthlete(id);
  } catch (error) {
    // Exposes internal error details to user
    throw error;
  }
}

// ✅ DO: Provide safe error messages
@Get('athletes/:id')
async getAthlete(@Param('id') id: string) {
  try {
    return await this.athleteService.getAthlete(id);
  } catch (error) {
    // Log full error internally
    this.logger.error(`Database error fetching athlete: ${error.message}`);
    // Return safe message to user
    throw new NotFoundException('Athlete not found');
  }
}

// ✅ BETTER: Use exception filters
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Log full error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception)
    );

    // Return safe response
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      path: request.url,
    });
  }
}
```

---

## Common Vulnerabilities & Prevention

### SQL Injection

| Vulnerability                   | Prevention                                |
| ------------------------------- | ----------------------------------------- |
| String concatenation in queries | Use Prisma ORM with parameterized queries |
| Dynamic query construction      | Whitelist allowed fields/values           |
| User input in WHERE clauses     | Validate input types and ranges           |
| Direct database access          | Use application layer for all queries     |

### Cross-Site Scripting (XSS)

| Vulnerability            | Prevention                                                |
| ------------------------ | --------------------------------------------------------- |
| Echoing user input       | Always encode output                                      |
| Storing unvalidated HTML | Sanitize on input and output                              |
| DOM-based XSS            | Use framework's sanitization (Angular DomSanitizer)       |
| Eval-like functions      | Never use eval(), Function(), or innerHTML with user data |

### Cross-Site Request Forgery (CSRF)

| Vulnerability                              | Prevention                                      |
| ------------------------------------------ | ----------------------------------------------- |
| State-changing requests without validation | Use CSRF tokens for state-changing operations   |
| Cookies sent with requests                 | Use SameSite=Strict cookie attribute            |
| Form-based attacks                         | Validate Origin/Referer headers                 |
| API requests                               | Require valid JWT tokens (inherently CSRF-safe) |

### Authentication Bypass

| Vulnerability                   | Prevention                                      |
| ------------------------------- | ----------------------------------------------- |
| Weak session management         | Use secure session tokens (JWT with expiration) |
| Hardcoded credentials           | Never hardcode credentials                      |
| Default credentials not changed | Enforce unique credentials for all accounts     |
| Predictable tokens              | Use cryptographically secure random generation  |

### Broken Access Control

| Vulnerability                           | Prevention                                           |
| --------------------------------------- | ---------------------------------------------------- |
| Directly accessing resources by ID      | Verify resource ownership before access              |
| Missing permission checks               | Use guards and decorators on all protected endpoints |
| Privilege escalation                    | Enforce role hierarchy in guards                     |
| Direct references without authorization | Always check clubId and userId context               |

---

## Security Patterns & Code Examples

### Secure API Endpoint Pattern

```typescript
// ✅ RECOMMENDED PATTERN for all endpoints
@Controller('api/v1/athletes')
export class AthletesController {
  constructor(
    private athleteService: AthleteService,
    private auditLogger: AuditLogger,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RBACGuard, ClubContextGuard)
  @Permissions('create:athletes')
  async createAthlete(
    @Body() createAthleteDto: CreateAthleteDto, // Layer 1: Input validation
    @Request() req, // Layer 2: Authentication
  ) {
    // Layer 3: Authorization (guards)
    // Layer 4: Club context (guards)

    const clubId = req.user.clubId;

    // Layer 5: Audit logging
    await this.auditLogger.logEvent({
      eventType: 'data_created',
      userId: req.user.id,
      clubId,
      resource: 'athlete',
      action: 'POST',
    });

    // Layer 6: Business logic with tenant enforcement
    const athlete = await this.athleteService.create(createAthleteDto, clubId);

    // Layer 7: Safe response (DTO)
    return new AthleteResponseDto(athlete);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, ClubContextGuard)
  async getAthlete(@Param('id') id: string, @Request() req) {
    const clubId = req.user.clubId;

    const athlete = await this.athleteService.getById(id, clubId);

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    await this.auditLogger.logEvent({
      eventType: 'data_accessed',
      userId: req.user.id,
      clubId,
      resource: 'athlete',
      resourceId: id,
    });

    return new AthleteResponseDto(athlete);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RBACGuard, ClubContextGuard)
  @Permissions('update:athletes')
  async updateAthlete(
    @Param('id') id: string,
    @Body() updateAthleteDto: UpdateAthleteDto,
    @Request() req,
  ) {
    const clubId = req.user.clubId;

    const athlete = await this.athleteService.updateById(id, updateAthleteDto, clubId);

    await this.auditLogger.logEvent({
      eventType: 'data_modified',
      userId: req.user.id,
      clubId,
      resource: 'athlete',
      resourceId: id,
      changes: updateAthleteDto,
    });

    return new AthleteResponseDto(athlete);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RBACGuard, ClubContextGuard)
  @Permissions('delete:athletes')
  async deleteAthlete(@Param('id') id: string, @Request() req) {
    const clubId = req.user.clubId;

    await this.athleteService.deleteById(id, clubId);

    await this.auditLogger.logEvent({
      eventType: 'data_deleted',
      userId: req.user.id,
      clubId,
      resource: 'athlete',
      resourceId: id,
    });

    return { message: 'Athlete deleted' };
  }
}
```

---

## Testing for Security

### Unit Test Security Example

```typescript
import { Test } from '@nestjs/testing';
import { AthletesController } from './athletes.controller';
import { AthleteService } from './athletes.service';
import { AuditLogger } from '@identity/security-monitoring';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AthletesController Security', () => {
  let controller: AthletesController;
  let service: AthleteService;
  let auditLogger: AuditLogger;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AthletesController],
      providers: [
        {
          provide: AthleteService,
          useValue: {
            create: jest.fn(),
            getById: jest.fn(),
          },
        },
        {
          provide: AuditLogger,
          useValue: {
            logEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AthletesController);
    service = module.get(AthleteService);
    auditLogger = module.get(AuditLogger);
  });

  describe('createAthlete - Security', () => {
    it('should enforce club context when creating athlete', async () => {
      const req = { user: { id: 'user1', clubId: 'club1' } };
      const dto = {
        name: 'John',
        email: 'john@example.com',
        clubId: 'club2', // Different club!
      };

      jest.spyOn(service, 'create').mockResolvedValue({
        id: 'athlete1',
        ...dto,
      });

      await controller.createAthlete(dto, req);

      // Verify service was called with enforced clubId
      expect(service.create).toHaveBeenCalledWith(dto, 'club1');
      // Not clubId from DTO (club2)
    });

    it('should log audit event when creating athlete', async () => {
      const req = { user: { id: 'user1', clubId: 'club1' } };
      const dto = { name: 'John', email: 'john@example.com' };

      jest.spyOn(service, 'create').mockResolvedValue({
        id: 'athlete1',
        ...dto,
      });

      await controller.createAthlete(dto, req);

      expect(auditLogger.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'data_created',
          userId: 'user1',
          clubId: 'club1',
          resource: 'athlete',
        }),
      );
    });

    it('should sanitize input before processing', async () => {
      const req = { user: { id: 'user1', clubId: 'club1' } };
      const dto = {
        name: '<script>alert("xss")</script>',
        email: 'john@example.com',
      };

      // Input should be validated by DTO validators
      // expect(() => controller.createAthlete(dto, req)).rejects...
    });
  });

  describe('getAthlete - Security', () => {
    it('should enforce club context when retrieving athlete', async () => {
      const req = { user: { id: 'user1', clubId: 'club1' } };

      jest.spyOn(service, 'getById').mockResolvedValue({
        id: 'athlete1',
        name: 'John',
      });

      await controller.getAthlete('athlete1', req);

      // Verify service enforces club context
      expect(service.getById).toHaveBeenCalledWith('athlete1', 'club1');
    });

    it('should throw when athlete not found in club', async () => {
      const req = { user: { id: 'user1', clubId: 'club1' } };

      jest.spyOn(service, 'getById').mockResolvedValue(null);

      await expect(controller.getAthlete('athlete1', req)).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Security Review Checklist

Use this checklist when reviewing code for security issues:

### Authentication & Authorization

- [ ] All endpoints use JwtAuthGuard
- [ ] Sensitive endpoints use RBACGuard
- [ ] Multi-tenant endpoints use ClubContextGuard
- [ ] Permissions are checked via decorators
- [ ] No hardcoded credentials anywhere
- [ ] Sessions expire after reasonable time
- [ ] Concurrent session limits enforced

### Input & Output

- [ ] All endpoints have request DTOs
- [ ] DTOs use appropriate validators
- [ ] Sensitive data is not logged
- [ ] Output is sanitized (no XSS vulnerability)
- [ ] File uploads are validated
- [ ] No string concatenation in queries

### Data Protection

- [ ] Sensitive data encrypted at rest
- [ ] TLS enforced for all communications
- [ ] Passwords hashed with bcrypt
- [ ] API keys rotated regularly
- [ ] Soft deletes used for audit trail
- [ ] PII properly masked in responses

### Error Handling

- [ ] No stack traces in production responses
- [ ] Exceptions don't leak information
- [ ] All errors logged internally
- [ ] Safe error messages to users
- [ ] Exception filter catches all errors

### Logging & Monitoring

- [ ] Security events logged (auth, authz, data access)
- [ ] Audit trail complete and tamper-proof
- [ ] Logs retained per compliance requirements
- [ ] Monitoring alerts configured
- [ ] Unusual activity detected

### API Security

- [ ] Rate limiting enforced
- [ ] CORS properly configured
- [ ] Security headers present
- [ ] No deprecated TLS versions
- [ ] Strong cipher suites only
- [ ] HTTPS enforced

### Database Security

- [ ] All queries use parameterized queries
- [ ] Prisma ORM used consistently
- [ ] Access control enforced at DB level
- [ ] Sensitive columns encrypted
- [ ] Foreign keys properly set up
- [ ] Indexes on frequently filtered columns

---

## References & Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Security Team  
**Review Schedule:** Quarterly
