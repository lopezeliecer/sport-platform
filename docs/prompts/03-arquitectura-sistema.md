# 🏗️ Prompt 3: Arquitectura del Sistema

## Contexto

Con el stack tecnológico definido (Angular + NestJS + PostgreSQL + servicios gratuitos), necesitamos diseñar la arquitectura completa del sistema, incluyendo microservicios, comunicación entre servicios y estructura del proyecto.

## Objetivo del Prompt

Diseñar una arquitectura de microservicios educativa pero práctica que soporte todos los módulos de la plataforma deportiva, con separación clara de responsabilidades y comunicación eficiente.

## Prompt Completo

```
Diseña una arquitectura de microservicios para mi plataforma de gestión deportiva considerando:

CONTEXTO DEL PROYECTO:
- Plataforma integral de clubes deportivos (natación + escalable a otros deportes)
- Módulos: entrenamientos, atletas, competencias, finanzas, comunicación, análisis
- 6 tipos de usuarios con diferentes permisos y vistas
- MVP: 100 usuarios, escalable a miles
- Lógica de negocio moderada (cálculos deportivos, reportes, validaciones)

STACK TECNOLÓGICO DEFINIDO:
- Frontend: Angular 18/19 + TypeScript + PrimeNG + NgRx
- Backend: NestJS + TypeScript (microservicios)
- Base de datos: PostgreSQL + Prisma ORM
- Auth: Google OAuth + JWT híbrido
- Hosting: Servicios gratuitos (Vercel + Railway + Supabase) → GCP futuro

REQUERIMIENTOS ARQUITECTÓNICOS:
- Microservicios con separación clara de responsabilidades
- Comunicación HTTP REST entre servicios (sin message queues por simplicidad)
- Multi-tenancy por club con aislamiento seguro de datos
- Escalabilidad horizontal futura sin complejidad prematura
- Desarrollo educativo pero funcional para MVP real
- Monorepo para facilitar desarrollo inicial

ENTREGABLES REQUERIDOS:

1. **Diagrama de Arquitectura de Microservicios**
   - 4-5 servicios máximo para MVP (evitar over-engineering)
   - Flujo de comunicación entre servicios
   - Puntos de integración externa (Google OAuth, notificaciones)
   - Puertos específicos para cada servicio

2. **Definición Detallada de Cada Servicio**
   - API Gateway (enrutamiento, auth centralizada, rate limiting)
   - Identity Service (usuarios, roles, sesiones, Google OAuth)
   - Sports Service (atletas, entrenamientos, competencias, métricas)
   - Club Management (clubs, finanzas, administración)
   - Communication Service (notificaciones, anuncios, emails)

3. **Estrategia de Comunicación**
   - HTTP REST síncrono entre servicios
   - Manejo de transacciones distribuidas (patrón Saga simple)
   - Circuit breakers y timeouts
   - Retry policies y graceful degradation

4. **Estructura de Monorepo**
   - Organización clara de apps/ y libs/
   - Código compartido: auth, database, common DTOs, utilities
   - Scripts de desarrollo para levantar todos los servicios
   - Configuración de ambiente unificada

5. **Plan de Deployment**
   - Estrategia para servicios gratuitos (Railway para backend)
   - Variables de ambiente por servicio
   - Health checks y readiness probes
   - Logging centralizado simple
   - Plan de migración gradual a GCP

6. **Consideraciones de Seguridad**
   - Autenticación centralizada en API Gateway
   - JWT tokens para comunicación inter-servicios
   - Multi-tenancy: filtrado automático por club_id
   - Audit trail básico para operaciones críticas
   - Rate limiting por usuario y por club

7. **Base de Datos Strategy**
   - ¿Una BD compartida o BDs separadas por servicio?
   - Esquema de multi-tenancy (club_id en todas las tablas)
   - Migración de esquemas coordinada
   - Backup y recovery strategy

CASOS DE USO CRÍTICOS A VALIDAR:
- Entrenador crea entrenamiento → notifica a atletas asignados
- Atleta registra resultados → actualiza métricas → trigger análisis
- Padre consulta progreso de hijo → cross-service data aggregation
- Admin genera reporte financiero → combina datos de múltiples servicios
- Personal médico actualiza información → notifica a entrenador relevante

RESTRICCIONES:
- Máximo 5 microservicios para MVP (simplicidad)
- Sin message queues (complejidad innecesaria para MVP)
- Deployments independientes pero coordinated releases
- Logging simple sin ELK stack por ahora
- Monitoring básico con health checks

Enfócate en una arquitectura que sea educativa para aprender microservicios, but practical y deployment-ready para un MVP real con budget limitado.
```

## Resultados Esperados

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌──────────────────┐
│   Frontend      │    │   API Gateway    │
│   Angular       │◄──►│   Port 3000      │
│   Port 4200     │    │  - Auth Central  │
│                 │    │  - Rate Limiting │
└─────────────────┘    │  - Routing       │
                       └──────────┬───────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼──────┐    ┌─────────────▼────────┐    ┌──────────▼────────┐
│ Identity      │    │ Sports               │    │ Club Management   │
│ Service       │    │ Service              │    │ Service           │
│ Port 3001     │    │ Port 3002            │    │ Port 3003         │
│ - Google OAuth│    │ - Athletes           │    │ - Club Info       │
│ - Users/Roles │    │ - Training Sessions  │    │ - Memberships     │
│ - Sessions    │    │ - Competitions       │    │ - Payments        │
│ - JWT Tokens  │    │ - Performance Data   │    │ - Financial Reports│
└───────────────┘    └──────────────────────┘    └───────────────────┘
                                  │
                    ┌─────────────▼────────┐
                    │ Communication        │
                    │ Service              │
                    │ Port 3004            │
                    │ - Notifications      │
                    │ - Email Sending      │
                    │ - Push Messages      │
                    │ - Announcements      │
                    └──────────────────────┘
```

### Estructura del Monorepo

```
sports-platform/
├── apps/
│   ├── api-gateway/              # Puerto 3000 - Enrutamiento y auth
│   ├── identity-service/         # Puerto 3001 - Users, auth, roles
│   ├── sports-service/           # Puerto 3002 - Athletes, training, competitions
│   ├── club-management/          # Puerto 3003 - Clubs, payments, admin
│   └── communication/            # Puerto 3004 - Notifications, emails
├── libs/
│   ├── shared/auth/             # Guards, strategies, JWT utilities
│   ├── shared/database/         # Prisma config, migrations, seeds
│   ├── shared/common/           # DTOs, interfaces, enums, utilities
│   └── shared/audit/            # Logging, audit trail, monitoring
├── frontend/                    # Angular application
├── docs/
│   ├── api/                     # OpenAPI/Swagger documentation
│   └── architecture/            # Architecture decisions and diagrams
├── scripts/
│   ├── dev-start.sh            # Start all services for development
│   ├── build-all.sh            # Build all services
│   └── migrate-all.sh          # Run all database migrations
├── docker-compose.yml          # Local development environment
├── package.json                # Root package.json with workspaces
└── README.md
```

### Responsabilidades por Servicio

**API Gateway (Puerto 3000):**

- Enrutamiento a servicios backend
- Autenticación centralizada
- Rate limiting por usuario/club
- Request/Response logging
- CORS y security headers

**Identity Service (Puerto 3001):**

- Google OAuth integration
- User management y profiles
- Role-based access control (RBAC)
- Session management
- JWT token generation/validation

**Sports Service (Puerto 3002):**

- Athlete profiles y management
- Training session creation/management
- Competition management
- Performance data tracking
- Sports analytics y reports

**Club Management Service (Puerto 3003):**

- Club information y settings
- Membership management
- Payment processing
- Financial reporting
- Administrative functions

**Communication Service (Puerto 3004):**

- Push notifications
- Email notifications
- In-app announcements
- Communication preferences
- Notification history

## Criterios de Validación

- [ ] Máximo 5 microservicios claramente definidos
- [ ] Separación clara de responsabilidades sin overlap
- [ ] Comunicación HTTP REST entre servicios documentada
- [ ] Estructura de monorepo práctica y organizada
- [ ] Plan de deployment para servicios gratuitos
- [ ] Estrategia de multi-tenancy con club_id
- [ ] Autenticación centralizada en API Gateway
- [ ] Health checks y monitoring básico
- [ ] Scripts de desarrollo y deployment

## Conexión con Siguientes Prompts

Esta arquitectura será implementada en:

- **Prompts 4-6**: Modelado de datos distribuido entre servicios
- **Prompts 7-8**: Implementación de seguridad centralizada
- **Prompts 9-11**: Desarrollo de servicios backend
- **Prompt 18**: Containerización con Docker

## Consideraciones de Implementación

- Iniciar con API Gateway + Identity Service
- Agregar Sports Service como core del negocio
- Club Management y Communication como servicios de soporte
- Base de datos compartida inicialmente, separar gradualmente
- Deployment independiente pero releases coordinados
