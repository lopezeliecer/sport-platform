# 🔧 Prompt 6: Modelos de Datos con Prisma + NestJS

## Contexto

Con el esquema de PostgreSQL diseñado y optimizado, necesitamos implementar los modelos de datos usando Prisma ORM y crear la estructura de NestJS que consumirá estos modelos en nuestra arquitectura de microservicios.

## Objetivo del Prompt

Generar la implementación completa de modelos de datos usando Prisma ORM y crear la estructura modular de NestJS que soporte todos los microservicios de la plataforma deportiva.

## Prompt Completo

```
Genera el esquema completo de Prisma y los modelos NestJS para mi plataforma deportiva:

CONTEXTO TÉCNICO:
- Stack: NestJS + TypeScript + Prisma ORM + PostgreSQL
- Arquitectura: Microservicios con base de datos compartida
- Multi-tenant: Filtrado automático por club_id
- Campos JSONB: Métricas flexibles para diferentes deportes
- Almacenamiento: Referencias a archivos locales

ESQUEMA DE BASE DE DATOS DEFINIDO:
[Basándome en el resultado del Prompt 5 - PostgreSQL schema]

**Tablas Principales:**
- users, clubs, athletes, user_club_roles
- training_sessions, training_assignments, performance_records
- competitions, payments, communications, medical_records, files

ARQUITECTURA DE MICROSERVICIOS:
apps/
├── api-gateway/           # Puerto 3000 - Enrutamiento
├── identity-service/      # Puerto 3001 - Users, auth, roles
├── sports-service/        # Puerto 3002 - Athletes, training, performance
├── club-management/       # Puerto 3003 - Clubs, payments, admin
└── communication/         # Puerto 3004 - Notifications, announcements

libs/
├── shared/
│   ├── database/         # Prisma configuration y client
│   ├── common/           # DTOs, interfaces, enums
│   ├── auth/             # Auth utilities compartidos
│   └── types/            # TypeScript types compartidos

REQUERIMIENTOS ESPECÍFICOS:

1. **Prisma Schema Completo**
   - schema.prisma con todas las entidades del Prompt 5
   - Relaciones bien definidas entre modelos
   - Índices optimizados incluidos en schema
   - Campos JSONB con tipos TypeScript apropiados
   - Enums para campos categóricos

2. **NestJS Modules por Dominio**
   - Módulos organizados por servicio de microservicio
   - DTOs específicos para cada operación CRUD
   - Entities/Models que representen business logic
   - Services con inyección de PrismaService
   - Controllers con decoradores Swagger completos

3. **DTOs y Validación Robusta**
   - CreateDTO, UpdateDTO, ResponseDTO para cada entidad
   - Validaciones con class-validator apropiadas
   - DTOs específicos para campos JSONB (métricas deportivas)
   - Pagination DTOs para listados
   - Filter/Search DTOs para consultas complejas

4. **Type Safety Completo**
   - Interfaces TypeScript para campos JSONB
   - Enums compartidos entre frontend y backend
   - Generated types de Prisma utilizados consistentemente
   - Generic types para respuestas paginadas
   - Utility types para operaciones comunes

5. **PrismaService y Database Layer**
   - PrismaService configurado para multi-tenancy
   - Database utilities para filtrado automático por club
   - Transaction helpers para operaciones complejas
   - Soft delete utilities donde sea apropiado
   - Seed scripts para desarrollo y testing

ESTRUCTURA ESPECÍFICA REQUERIDA:

**libs/shared/database/:**
```

libs/shared/database/
├── prisma/
│ ├── schema.prisma # Esquema principal
│ ├── migrations/ # Migraciones automáticas
│ └── seed.ts # Datos iniciales
├── src/
│ ├── prisma.service.ts # PrismaService principal
│ ├── database.module.ts # Módulo compartido
│ ├── types/
│ │ ├── index.ts # Export de tipos
│ │ ├── sports.types.ts # Tipos para métricas deportivas
│ │ └── common.types.ts # Tipos comunes
│ └── utils/
│ ├── multi-tenant.util.ts # Utilities para club filtering
│ ├── jsonb.util.ts # Helpers para JSONB
│ └── pagination.util.ts # Helpers para paginación

```

**sports-service ejemplo:**
```

apps/sports-service/src/
├── athletes/
│ ├── dto/
│ │ ├── create-athlete.dto.ts
│ │ ├── update-athlete.dto.ts
│ │ ├── athlete-response.dto.ts
│ │ └── athlete-query.dto.ts
│ ├── entities/
│ │ └── athlete.entity.ts # Business logic
│ ├── athletes.controller.ts # REST endpoints
│ ├── athletes.service.ts # Business service
│ └── athletes.module.ts
├── training/
│ ├── dto/
│ ├── entities/
│ ├── training.controller.ts
│ ├── training.service.ts
│ └── training.module.ts
├── performance/
│ ├── dto/
│ │ ├── performance-metrics.dto.ts # JSONB validation
│ │ └── create-performance.dto.ts
│ ├── entities/
│ ├── performance.controller.ts
│ ├── performance.service.ts
│ └── performance.module.ts

```

CARACTERÍSTICAS TÉCNICAS ESPECÍFICAS:

6. **JSONB Handling Avanzado**
   - DTOs tipados para diferentes tipos de métricas deportivas
   - Validadores personalizados para esquemas JSON
   - Helpers para consultas eficientes en campos JSONB
   - Type guards para runtime type checking

7. **Multi-Tenancy Automático**
   - Interceptors que inyectan club_id automáticamente
   - Decoradores para extraer club context
   - Guards que verifican acceso por club
   - Utilities para filtrado automático en queries

8. **File Management**
   - DTOs para upload/metadata de archivos
   - Services para gestión de archivos locales
   - Validation de tipos de archivo permitidos
   - Cleanup automático de archivos huérfanos

9. **Documentation y OpenAPI**
   - Decoradores Swagger completos en controllers
   - Ejemplos de DTOs para documentation
   - Response schemas bien definidos
   - Tags y grupos organizados por dominio

CASOS DE USO A VALIDAR:

- **CRUD Operations**: Create/Read/Update/Delete para todas las entidades
- **Complex Queries**: Filtrado, búsqueda, paginación con performance
- **JSONB Operations**: Crear/actualizar métricas deportivas tipadas
- **Multi-tenant**: Aislamiento automático por club en todas las operaciones
- **File Operations**: Upload, metadata, y referencias en entidades
- **Relationships**: Consultas que cruzan múltiples entidades relacionadas

ENTREGABLES:

1. **schema.prisma completo** con todas las entidades, relaciones e índices
2. **PrismaService configurado** para multi-tenancy y utilities
3. **Módulos NestJS** organizados por dominio y servicio
4. **DTOs completos** con validaciones class-validator robustas
5. **Controllers** con endpoints RESTful y documentación Swagger
6. **Services** con business logic y manejo de transacciones
7. **Type definitions** para campos JSONB y responses
8. **Database utilities** para operaciones comunes y multi-tenancy
9. **Seed scripts** para desarrollo y testing
10. **Integration tests** básicos para validar setup

PRIORIDADES DE IMPLEMENTACIÓN:
1. Core entities (User, Club, Athlete) como foundation
2. Sports domain (Training, Performance) como business core
3. Administrative (Payments, Communications) como soporte
4. File management como feature adicional

Implementa una arquitectura robusta, type-safe y lista para producción que sirva como base sólida para todos los microservicios.
```

## Resultados Esperados

### Prisma Schema Completo

```prisma
// libs/shared/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Core Models
model User {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email            String   @unique
  googleId         String?  @unique @map("google_id")
  firstName        String   @map("first_name")
  lastName         String   @map("last_name")
  profileImageUrl  String?  @map("profile_image_url")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  athletes         Athlete[]
  userClubRoles    UserClubRole[]
  createdTrainingSessions TrainingSession[] @relation("CreatedBy")

  @@map("users")
}

model Club {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  slug        String   @unique
  description String?
  logoUrl     String?  @map("logo_url")
  contactInfo Json?    @map("contact_info")
  settings    Json     @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  athletes         Athlete[]
  trainingSessions TrainingSession[]
  performanceRecords PerformanceRecord[]
  userClubRoles    UserClubRole[]
  competitions     Competition[]
  payments         Payment[]
  communications   Communication[]

  @@map("clubs")
}

model Athlete {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clubId           String    @map("club_id") @db.Uuid
  userId           String?   @map("user_id") @db.Uuid
  athleteNumber    String?   @map("athlete_number")
  dateOfBirth      DateTime? @map("date_of_birth") @db.Date
  gender           String?
  emergencyContact Json?     @map("emergency_contact")
  isActive         Boolean   @default(true) @map("is_active")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  // Relations
  club             Club      @relation(fields: [clubId], references: [id], onDelete: Cascade)
  user             User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  performanceRecords PerformanceRecord[]
  trainingAssignments TrainingAssignment[]
  medicalRecords   MedicalRecord[]

  @@unique([clubId, athleteNumber])
  @@index([clubId, isActive])
  @@map("athletes")
}

// Sports Domain Models
model TrainingSession {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clubId         String   @map("club_id") @db.Uuid
  title          String
  description    String?
  sessionType    String   @map("session_type")
  scheduledDate  DateTime? @map("scheduled_date")
  durationMinutes Int?    @map("duration_minutes")
  trainingPlan   Json?    @map("training_plan")
  createdBy      String?  @map("created_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  // Relations
  club           Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)
  creator        User?    @relation("CreatedBy", fields: [createdBy], references: [id])
  assignments    TrainingAssignment[]
  performanceRecords PerformanceRecord[]

  @@index([clubId, scheduledDate])
  @@map("training_sessions")
}

model PerformanceRecord {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clubId            String   @map("club_id") @db.Uuid
  athleteId         String   @map("athlete_id") @db.Uuid
  trainingSessionId String?  @map("training_session_id") @db.Uuid
  recordDate        DateTime @default(now()) @map("record_date")
  metrics           Json     // Flexible sports metrics
  notes             String?
  createdAt         DateTime @default(now()) @map("created_at")

  // Relations
  club            Club            @relation(fields: [clubId], references: [id], onDelete: Cascade)
  athlete         Athlete         @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  trainingSession TrainingSession? @relation(fields: [trainingSessionId], references: [id])

  @@index([athleteId, recordDate])
  @@index([clubId, recordDate])
  @@map("performance_records")
}
```

### NestJS DTOs y Services

```typescript
// libs/shared/common/src/dto/create-athlete.dto.ts
import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export class CreateAthleteDto {
  @ApiProperty({ description: 'Club ID where athlete belongs' })
  @IsUUID()
  clubId: string;

  @ApiPropertyOptional({ description: 'User ID if athlete has system access' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Unique athlete number within club' })
  @IsOptional()
  @IsString()
  athleteNumber?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @IsOptional()
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

```typescript
// apps/sports-service/src/athletes/athletes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/shared/database';
import { CreateAthleteDto, UpdateAthleteDto } from '@libs/shared/common';

@Injectable()
export class AthletesService {
  constructor(private prisma: PrismaService) {}

  async create(createAthleteDto: CreateAthleteDto) {
    return this.prisma.athlete.create({
      data: createAthleteDto,
      include: {
        club: true,
        user: true,
      },
    });
  }

  async findAllByClub(clubId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [athletes, total] = await Promise.all([
      this.prisma.athlete.findMany({
        where: { clubId, isActive: true },
        include: {
          user: true,
          performanceRecords: {
            take: 5,
            orderBy: { recordDate: 'desc' },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.athlete.count({
        where: { clubId, isActive: true },
      }),
    ]);

    return {
      data: athletes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, clubId: string) {
    const athlete = await this.prisma.athlete.findFirst({
      where: { id, clubId },
      include: {
        club: true,
        user: true,
        performanceRecords: {
          orderBy: { recordDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    return athlete;
  }

  async update(id: string, clubId: string, updateAthleteDto: UpdateAthleteDto) {
    await this.findOne(id, clubId); // Verify exists and belongs to club

    return this.prisma.athlete.update({
      where: { id },
      data: updateAthleteDto,
      include: {
        club: true,
        user: true,
      },
    });
  }

  async remove(id: string, clubId: string) {
    await this.findOne(id, clubId); // Verify exists and belongs to club

    return this.prisma.athlete.update({
      where: { id },
      data: { isActive: false }, // Soft delete
    });
  }
}
```

### JSONB Types and Validation

```typescript
// libs/shared/types/src/sports.types.ts
export interface SwimmingMetrics {
  distance: number; // meters
  time: number; // seconds
  stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly';
  pool_length: 25 | 50; // meters
  split_times?: number[]; // array of split times
  heart_rate?: {
    avg: number;
    max: number;
  };
  rating_perceived_exertion?: number; // 1-10 scale
}

export interface GeneralMetrics {
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  calories_burned?: number;
  notes?: string;
}

export type PerformanceMetrics = SwimmingMetrics | GeneralMetrics;
```

```typescript
// libs/shared/common/src/dto/create-performance.dto.ts
import { IsUUID, IsDateString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PerformanceMetrics } from '@libs/shared/types';

export class CreatePerformanceDto {
  @ApiProperty()
  @IsUUID()
  athleteId: string;

  @ApiProperty()
  @IsUUID()
  clubId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  trainingSessionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  recordDate?: string;

  @ApiProperty({
    description: 'Performance metrics in JSONB format',
    example: {
      distance: 1500,
      time: 900,
      stroke: 'freestyle',
      pool_length: 25,
    },
  })
  @IsObject()
  metrics: PerformanceMetrics;

  @ApiProperty({ required: false })
  @IsOptional()
  notes?: string;
}
```

## Criterios de Validación

- [ ] schema.prisma completo con todas las entidades del Prompt 5
- [ ] Relaciones Prisma correctamente definidas con foreign keys
- [ ] Índices incluidos en schema para performance
- [ ] DTOs con validaciones class-validator robustas
- [ ] Services con business logic y error handling
- [ ] Controllers con decoradores Swagger completos
- [ ] Types TypeScript para campos JSONB
- [ ] Multi-tenancy implementado en services
- [ ] Pagination y filtering implementados
- [ ] Soft deletes donde sea apropiado

## Conexión con Siguientes Prompts

Estos modelos serán utilizados en:

- **Prompts 7-8**: Implementación de seguridad con estos modelos
- **Prompts 9-11**: Desarrollo de servicios backend usando estos DTOs
- **Prompts 12-14**: Frontend consumiendo estas APIs
- **Prompt 15**: Integración completa frontend-backend

## Consideraciones de Implementación

- Iniciar con core models (User, Club, Athlete)
- Implementar sports domain como business core
- Validar JSONB schemas en runtime
- Optimizar queries para multi-tenancy
- Configurar Prisma client para microservicios
