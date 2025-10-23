# 🏗️ Prompt 9: Estructura del Servidor

## Contexto

Con los modelos de datos y sistema de seguridad implementados, necesitamos crear la estructura completa de microservicios NestJS que sirva como foundation para toda la lógica de negocio de la plataforma deportiva.

## Objetivo del Prompt

Crear la estructura base completa de 4 microservicios con NestJS, configuración de monorepo, Docker Compose para desarrollo local y scripts de automatización para el equipo de desarrollo.

## Prompt Completo

```
Crea la estructura completa de microservicios con NestJS para mi plataforma deportiva con estas especificaciones:

CONTEXTO DEL PROYECTO:
- Plataforma de gestión deportiva multi-club con 4 microservicios desde el inicio
- NestJS + TypeScript + Prisma + PostgreSQL
- Separación por dominio de negocio para escalabilidad
- MVP: 100 usuarios concurrentes, preparado para miles
- Servicios gratuitos para desarrollo, escalable a GCP

ARQUITECTURA DE MICROSERVICIOS REQUERIDA:

```

sports-platform/
├── apps/
│ ├── api-gateway/ # Puerto 3000 - Enrutamiento centralizado
│ │ ├── src/
│ │ │ ├── main.ts
│ │ │ ├── app.module.ts
│ │ │ ├── proxy/
│ │ │ │ ├── proxy.controller.ts
│ │ │ │ ├── proxy.service.ts
│ │ │ │ └── proxy.module.ts
│ │ │ ├── auth/
│ │ │ │ └── auth-gateway.guard.ts
│ │ │ └── health/
│ │ │ └── health.controller.ts
│ │ ├── Dockerfile
│ │ └── package.json
│ ├── identity-service/ # Puerto 3001 - Auth, users, roles, sessions
│ │ ├── src/
│ │ │ ├── main.ts
│ │ │ ├── app.module.ts
│ │ │ ├── auth/
│ │ │ ├── users/
│ │ │ ├── sessions/
│ │ │ └── roles/
│ │ ├── Dockerfile
│ │ └── package.json
│ ├── sports-service/ # Puerto 3002 - Athletes, training, competitions, performance
│ │ ├── src/
│ │ │ ├── main.ts
│ │ │ ├── app.module.ts
│ │ │ ├── athletes/
│ │ │ ├── training/
│ │ │ ├── performance/
│ │ │ └── competitions/
│ │ ├── Dockerfile
│ │ └── package.json
│ ├── club-management/ # Puerto 3003 - Clubs, payments, memberships, admin
│ │ ├── src/
│ │ │ ├── main.ts
│ │ │ ├── app.module.ts
│ │ │ ├── clubs/
│ │ │ ├── payments/
│ │ │ ├── memberships/
│ │ │ └── reports/
│ │ ├── Dockerfile
│ │ └── package.json
│ └── communication/ # Puerto 3004 - Notifications, announcements
│ ├── src/
│ │ ├── main.ts
│ │ ├── app.module.ts
│ │ ├── notifications/
│ │ ├── announcements/
│ │ └── emails/
│ ├── Dockerfile
│ └── package.json
├── libs/
│ ├── shared/
│ │ ├── auth/ # Guards, decorators, strategies compartidos
│ │ ├── database/ # Prisma configuration
│ │ ├── common/ # DTOs, interfaces, utilities compartidos
│ │ └── audit/ # Logging y auditoría
├── docker-compose.yml # Desarrollo local completo
├── docker-compose.prod.yml # Producción
├── package.json # Root con workspaces
├── nx.json # NX configuration para monorepo
├── tsconfig.json # TypeScript config base
├── .env.example # Variables de ambiente template
└── scripts/
├── dev-start.sh # Iniciar todos los servicios
├── build-all.sh # Build de todos los servicios
├── test-all.sh # Tests de todos los servicios
└── migrate-db.sh # Migraciones de base de datos

```

ESPECIFICACIONES TÉCNICAS POR SERVICIO:

1. **API Gateway (Puerto 3000)**:
   - Proxy inteligente con enrutamiento dinámico
   - Autenticación centralizada con JWT validation
   - Rate limiting por usuario y endpoint
   - CORS configuration para frontend
   - Request/Response logging centralizado
   - Health checks de todos los servicios
   - Swagger aggregation de todos los servicios

2. **Identity Service (Puerto 3001)**:
   - Google OAuth integration completa
   - Session management con PostgreSQL
   - User profile management
   - Role and permission management por club
   - JWT token generation y validation
   - Password reset (futuro, no MVP)
   - Audit logging para operaciones de auth

3. **Sports Service (Puerto 3002)**:
   - Gestión completa de atletas
   - Training session management con templates
   - Performance recording con JSONB metrics
   - Competition management y results
   - Analytics básico de rendimiento
   - File uploads para documentos deportivos
   - Real-time updates vía WebSockets (futuro)

4. **Club Management (Puerto 3003)**:
   - Club profile y configuration
   - Membership management
   - Payment tracking (manual, sin gateway)
   - Financial reporting básico
   - Administrative functions
   - Club-level settings y preferences
   - Data export capabilities

5. **Communication Service (Puerto 3004)**:
   - Push notifications (futuro PWA)
   - Email notifications con templates
   - In-app announcements
   - Message threading básico
   - Notification preferences por usuario
   - Communication history y analytics

CONFIGURACIÓN DE DESARROLLO:

**Docker Compose Setup:**
- PostgreSQL container con datos persistentes
- Redis container para caching (futuro)
- All microservices con hot reload
- Environment variables unificadas
- Network configuration para comunicación entre servicios
- Volume mounts para desarrollo local

**Scripts de Automatización:**
- `npm run dev`: Iniciar todos los servicios en modo desarrollo
- `npm run build`: Build optimizado de todos los servicios
- `npm run test`: Tests unitarios e integración
- `npm run migrate`: Ejecutar migraciones de Prisma
- `npm run seed`: Popular base de datos con datos de prueba
- `npm run clean`: Limpiar builds y node_modules

**Environment Configuration:**
- Variables por servicio con defaults seguros
- Configuration module para cada servicio
- Validation de variables requeridas al startup
- Support para múltiples environments (dev, staging, prod)

CARACTERÍSTICAS ESPECÍFICAS:

**Hot Reload y DX (Developer Experience):**
- Hot reload automático en todos los servicios
- TypeScript compilation optimizada
- Source maps para debugging
- Auto-restart en cambios de libs compartidas
- Logging colorizado y estructurado

**Health Checks y Monitoring:**
- Health endpoints en cada servicio
- Database connection checking
- Service dependency verification
- Prometheus metrics básicos (futuro)
- Graceful shutdown handling

**Error Handling Consistente:**
- Exception filters globales
- Error responses estandarizadas
- Logging estructurado de errores
- Correlation IDs para tracing
- User-friendly error messages

**Security Configuration:**
- CORS configurado apropiadamente
- Helmet para security headers
- Rate limiting en Gateway
- Input sanitization
- Request size limits

CASOS DE USO DE DEPLOYMENT:

**Desarrollo Local:**
- Un comando para levantar todo el stack
- Base de datos local con datos de prueba
- Hot reload en todos los servicios
- Logs centralizados en terminal

**Servicios Gratuitos (MVP):**
- Railway para cada microservicio
- Supabase para PostgreSQL
- Vercel para frontend (futuro)
- Environment variables configuration

**Escalabilidad a GCP:**
- Cloud Run para containers
- Cloud SQL para PostgreSQL
- Load balancers y auto-scaling
- Cloud Monitoring integration

ENTREGABLES REQUERIDOS:

1. **Estructura completa de carpetas** con todos los servicios
2. **package.json con workspaces** para monorepo management
3. **Docker Compose** para desarrollo local completo
4. **Scripts de automatización** para todas las tareas comunes
5. **Configuración de NestJS** optimizada para cada servicio
6. **Health check endpoints** en todos los servicios
7. **Environment configuration** flexible y segura
8. **README detallado** con instrucciones de setup
9. **TypeScript configuration** compartida y optimizada
10. **Error handling** y logging consistente

PRIORIDADES DE IMPLEMENTACIÓN:
1. API Gateway + Identity Service (foundation)
2. Sports Service (core business logic)
3. Club Management (administrative features)
4. Communication Service (nice-to-have para MVP)

RESTRICCIONES Y CONSIDERACIONES:
- Optimizado para servicios gratuitos en MVP
- Memory efficient para tier gratuito
- Database connections optimizadas (pooling)
- Preparado para horizontal scaling futuro
- Compatible con CI/CD pipelines

Crea una foundation sólida, escalable y developer-friendly que sirva como base para toda la implementación de la plataforma deportiva.
```

## Resultados Esperados

### Estructura de Monorepo

```
sports-platform/
├── apps/
│   ├── api-gateway/              # Puerto 3000
│   ├── identity-service/         # Puerto 3001
│   ├── sports-service/           # Puerto 3002
│   ├── club-management/          # Puerto 3003
│   └── communication/            # Puerto 3004
├── libs/shared/
│   ├── auth/
│   ├── database/
│   ├── common/
│   └── audit/
├── docker-compose.yml
├── package.json (workspaces)
└── scripts/
```

### API Gateway Configuration

```typescript
// apps/api-gateway/src/proxy/proxy.service.ts
@Injectable()
export class ProxyService {
  private readonly httpService = new HttpService();

  private readonly serviceMap = {
    identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    sports: process.env.SPORTS_SERVICE_URL || 'http://localhost:3002',
    clubs: process.env.CLUB_SERVICE_URL || 'http://localhost:3003',
    communication: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3004',
  };

  async proxyRequest(serviceName: string, path: string, method: string, data?: any, headers?: any) {
    const serviceUrl = this.serviceMap[serviceName];
    if (!serviceUrl) {
      throw new BadRequestException(`Service ${serviceName} not found`);
    }

    try {
      const response = await this.httpService.axiosRef({
        method,
        url: `${serviceUrl}${path}`,
        data,
        headers: {
          ...headers,
          'X-Forwarded-For': 'api-gateway',
        },
      });

      return response.data;
    } catch (error) {
      throw new BadGatewayException(`Service ${serviceName} unavailable`);
    }
  }
}
```

### Docker Compose para Desarrollo

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sports_platform
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api-gateway:
    build: ./apps/api-gateway
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_password@postgres:5432/sports_platform
    depends_on:
      - postgres
    volumes:
      - ./apps/api-gateway:/app
      - /app/node_modules

  identity-service:
    build: ./apps/identity-service
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_password@postgres:5432/sports_platform
    depends_on:
      - postgres
    volumes:
      - ./apps/identity-service:/app
      - /app/node_modules

  sports-service:
    build: ./apps/sports-service
    ports:
      - '3002:3002'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dev_user:dev_password@postgres:5432/sports_platform
    depends_on:
      - postgres
    volumes:
      - ./apps/sports-service:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Scripts de Automatización

```json
// package.json
{
  "name": "sports-platform",
  "workspaces": ["apps/*", "libs/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:gateway\" \"npm run dev:identity\" \"npm run dev:sports\" \"npm run dev:clubs\" \"npm run dev:communication\"",
    "dev:gateway": "cd apps/api-gateway && npm run start:dev",
    "dev:identity": "cd apps/identity-service && npm run start:dev",
    "dev:sports": "cd apps/sports-service && npm run start:dev",
    "dev:clubs": "cd apps/club-management && npm run start:dev",
    "dev:communication": "cd apps/communication && npm run start:dev",
    "build": "npm run build:libs && npm run build:apps",
    "build:libs": "cd libs/shared && npm run build",
    "build:apps": "concurrently \"npm run build:gateway\" \"npm run build:identity\" \"npm run build:sports\" \"npm run build:clubs\" \"npm run build:communication\"",
    "test": "npm run test:libs && npm run test:apps",
    "migrate": "cd libs/shared/database && npx prisma migrate dev",
    "seed": "cd libs/shared/database && npx prisma db seed",
    "docker:dev": "docker-compose up --build",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up --build"
  }
}
```

## Criterios de Validación

- [ ] 4 microservicios configurados con puertos específicos
- [ ] API Gateway con proxy inteligente funcionando
- [ ] Docker Compose para desarrollo local completo
- [ ] Scripts de automatización para tareas comunes
- [ ] Health checks implementados en todos los servicios
- [ ] Environment configuration flexible y segura
- [ ] Hot reload funcionando en modo desarrollo
- [ ] Logging consistente en todos los servicios
- [ ] TypeScript configuration optimizada
- [ ] README con instrucciones claras de setup

## Conexión con Siguientes Prompts

Esta estructura será utilizada en:

- **Prompt 10**: Implementación de controladores y rutas en cada servicio
- **Prompt 11**: Implementación de servicios de negocio con DDD
- **Prompts 12-14**: Integración con frontend Angular
- **Prompt 18**: Containerización para deployment

## Consideraciones de Implementación

- Iniciar con API Gateway + Identity Service como foundation
- Configurar hot reload para developer experience óptima
- Usar variables de ambiente para configuración flexible
- Preparar para deployment en servicios gratuitos
- Mantener memoria y recursos optimizados
- Documentar setup completo para nuevos desarrolladores
