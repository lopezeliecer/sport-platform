# 🛣️ Prompt 10: Controladores y Rutas

## Contexto

Con la estructura de microservicios establecida, necesitamos implementar todos los controladores y rutas RESTful que expondrán la funcionalidad de la plataforma deportiva, incluyendo el API Gateway y la documentación Swagger completa.

## Objetivo del Prompt

Implementar la capa de controladores completa con rutas RESTful, documentación Swagger automática, validaciones robustas y el API Gateway que orquestará todo el tráfico HTTP.

## Prompt Completo

```
Implementa el API Gateway y todos los controladores para mi plataforma deportiva con estas especificaciones:

CONTEXTO TÉCNICO:
- 4 microservicios NestJS con separación por dominio
- API Gateway como punto de entrada único (puerto 3000)
- Rutas RESTful con multi-tenancy explícito por club
- Documentación Swagger automática para cada servicio
- Validaciones robustas con class-validator

ESTRUCTURA DE API GATEWAY:

**Enrutamiento Centralizado (Puerto 3000):**
```

API Gateway
├── /api/v1/identity/_ → identity-service:3001
├── /api/v1/sports/_ → sports-service:3002  
├── /api/v1/clubs/_ → club-management:3003
└── /api/v1/communication/_ → communication:3004

````

**Funcionalidades del Gateway:**
- Proxy inteligente con load balancing básico
- Autenticación centralizada con JWT validation
- Rate limiting por usuario/IP
- Request/Response logging y correlation IDs
- CORS configuration para frontend
- Swagger aggregation de todos los servicios
- Health checks de servicios downstream

CONVENCIONES RESTful OBLIGATORIAS:

**URLs con Multi-tenancy explícito:**
- `/api/v1/clubs/:clubId/athletes` (recursos por club)
- `/api/v1/identity/profile` (recursos globales del usuario)
- `/api/v1/sports/clubs/:clubId/trainings` (recursos específicos por club)

**Métodos HTTP estándar:**
- GET: Lectura de recursos (lista/detalle)
- POST: Creación de nuevos recursos
- PUT: Actualización completa de recursos
- PATCH: Actualización parcial de recursos
- DELETE: Eliminación (soft delete preferiblemente)

**Response Standards:**
- Status codes apropiados (200, 201, 204, 400, 401, 403, 404, 409, 500)
- Response format consistente con metadata
- Paginación estándar para listas
- Error responses con detalles útiles

ENDPOINTS ESPECÍFICOS POR SERVICIO:

## **1. IDENTITY SERVICE (Puerto 3001)**

**Authentication Endpoints:**
```typescript
POST   /api/v1/identity/auth/google           # Google OAuth login
POST   /api/v1/identity/auth/refresh          # Refresh JWT tokens
POST   /api/v1/identity/auth/logout           # Logout (invalidate session)
DELETE /api/v1/identity/auth/sessions         # Logout from all devices
GET    /api/v1/identity/auth/sessions         # List active sessions

**User Management:**
GET    /api/v1/identity/profile               # Current user profile
PUT    /api/v1/identity/profile               # Update user profile
GET    /api/v1/identity/clubs                 # User's clubs and roles
POST   /api/v1/identity/clubs/:clubId/switch  # Switch active club context

**Admin - User/Role Management:**
GET    /api/v1/identity/clubs/:clubId/users             # List club users
POST   /api/v1/identity/clubs/:clubId/users             # Invite new user to club
PUT    /api/v1/identity/clubs/:clubId/users/:userId     # Update user roles
DELETE /api/v1/identity/clubs/:clubId/users/:userId     # Remove user from club
GET    /api/v1/identity/clubs/:clubId/roles             # Available roles for club
POST   /api/v1/identity/clubs/:clubId/users/:userId/roles # Assign roles to user
````

## **2. SPORTS SERVICE (Puerto 3002)**

**Athletes Management:**

```typescript
GET    /api/v1/sports/clubs/:clubId/athletes                    # List athletes with filters
POST   /api/v1/sports/clubs/:clubId/athletes                    # Create new athlete
GET    /api/v1/sports/clubs/:clubId/athletes/:athleteId         # Get athlete details
PUT    /api/v1/sports/clubs/:clubId/athletes/:athleteId         # Update athlete
DELETE /api/v1/sports/clubs/:clubId/athletes/:athleteId         # Soft delete athlete

**Training Management:**
GET    /api/v1/sports/clubs/:clubId/trainings                   # List training sessions
POST   /api/v1/sports/clubs/:clubId/trainings                   # Create training session
GET    /api/v1/sports/clubs/:clubId/trainings/:trainingId       # Get training details
PUT    /api/v1/sports/clubs/:clubId/trainings/:trainingId       # Update training
DELETE /api/v1/sports/clubs/:clubId/trainings/:trainingId       # Delete training
POST   /api/v1/sports/clubs/:clubId/trainings/:trainingId/assign # Assign athletes to training
DELETE /api/v1/sports/clubs/:clubId/trainings/:trainingId/assign # Remove athlete assignments

**Performance Tracking:**
GET    /api/v1/sports/clubs/:clubId/athletes/:athleteId/performance        # Athlete performance history
POST   /api/v1/sports/clubs/:clubId/athletes/:athleteId/performance        # Record new performance
PUT    /api/v1/sports/clubs/:clubId/performance/:performanceId             # Update performance record
DELETE /api/v1/sports/clubs/:clubId/performance/:performanceId             # Delete performance record
GET    /api/v1/sports/clubs/:clubId/performance/analytics                  # Performance analytics by club
GET    /api/v1/sports/clubs/:clubId/athletes/:athleteId/trends             # Performance trends for athlete

**Competitions:**
GET    /api/v1/sports/clubs/:clubId/competitions                 # List competitions
POST   /api/v1/sports/clubs/:clubId/competitions                 # Create competition
GET    /api/v1/sports/clubs/:clubId/competitions/:competitionId  # Competition details
PUT    /api/v1/sports/clubs/:clubId/competitions/:competitionId  # Update competition
POST   /api/v1/sports/clubs/:clubId/competitions/:competitionId/register # Register athletes
GET    /api/v1/sports/clubs/:clubId/competitions/:competitionId/results  # Competition results
POST   /api/v1/sports/clubs/:clubId/competitions/:competitionId/results  # Submit results
```

## **3. CLUB MANAGEMENT SERVICE (Puerto 3003)**

**Club Administration:**

```typescript
GET    /api/v1/clubs                          # List user's clubs
POST   /api/v1/clubs                          # Create new club (admin only)
GET    /api/v1/clubs/:clubId                  # Club details and settings
PUT    /api/v1/clubs/:clubId                  # Update club information
DELETE /api/v1/clubs/:clubId                  # Delete club (super admin)

**Membership Management:**
GET    /api/v1/clubs/:clubId/memberships               # List club memberships
POST   /api/v1/clubs/:clubId/memberships               # Create membership
GET    /api/v1/clubs/:clubId/memberships/:membershipId # Membership details
PUT    /api/v1/clubs/:clubId/memberships/:membershipId # Update membership
DELETE /api/v1/clubs/:clubId/memberships/:membershipId # Cancel membership

**Financial Management:**
GET    /api/v1/clubs/:clubId/payments                  # List payments with filters
POST   /api/v1/clubs/:clubId/payments                  # Record manual payment
GET    /api/v1/clubs/:clubId/payments/:paymentId       # Payment details
PUT    /api/v1/clubs/:clubId/payments/:paymentId       # Update payment status
GET    /api/v1/clubs/:clubId/payments/pending          # List pending payments
GET    /api/v1/clubs/:clubId/financial-reports         # Financial reports by period

**Administrative Reports:**
GET    /api/v1/clubs/:clubId/reports/attendance        # Attendance reports
GET    /api/v1/clubs/:clubId/reports/performance       # Performance summary reports
GET    /api/v1/clubs/:clubId/reports/financial         # Financial summary reports
POST   /api/v1/clubs/:clubId/reports/export            # Export data (CSV/Excel)
```

## **4. COMMUNICATION SERVICE (Puerto 3004)**

**Notifications:**

```typescript
GET    /api/v1/communication/notifications             # User's notifications
PUT    /api/v1/communication/notifications/:id/read    # Mark notification as read
DELETE /api/v1/communication/notifications/:id         # Delete notification
POST   /api/v1/communication/notifications/mark-all-read # Mark all as read

**Announcements:**
GET    /api/v1/communication/clubs/:clubId/announcements              # Club announcements
POST   /api/v1/communication/clubs/:clubId/announcements              # Create announcement
GET    /api/v1/communication/clubs/:clubId/announcements/:id          # Announcement details
PUT    /api/v1/communication/clubs/:clubId/announcements/:id          # Update announcement
DELETE /api/v1/communication/clubs/:clubId/announcements/:id          # Delete announcement

**Email Management:**
POST   /api/v1/communication/emails/send               # Send email (admin/coach)
GET    /api/v1/communication/emails/templates          # Email templates
POST   /api/v1/communication/emails/templates          # Create email template
GET    /api/v1/communication/emails/history            # Email sending history
```

CARACTERÍSTICAS TÉCNICAS REQUERIDAS:

**DTOs con Validación Robusta:**

```typescript
// Ejemplo para CreateAthleteDto
export class CreateAthleteDto {
  @ApiProperty({
    description: "Athlete first name",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: "Date of birth", example: "2005-06-15" })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ description: "Performance metrics in JSONB format" })
  @IsObject()
  @ValidateNested()
  @Type(() => PerformanceMetricsDto)
  @IsOptional()
  metrics?: PerformanceMetricsDto;
}
```

**Swagger Documentation Completa:**

- @ApiTags para agrupación por módulo
- @ApiOperation con descriptions detalladas
- @ApiResponse para todos los status codes posibles
- @ApiParam para parámetros de ruta
- @ApiQuery para query parameters
- Ejemplos de request/response bodies

**Guards y Middleware:**

- JWTAuthGuard en todos los endpoints protegidos
- ClubAccessGuard para verificar pertenencia al club
- PermissionGuard para verificar permisos específicos
- RateLimitGuard en endpoints sensibles
- ValidationPipe global con transform

**Paginación y Filtrado:**

```typescript
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}

export class AthleteFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Search by name" })
  @IsString()
  @IsOptional()
  search?: string;
}
```

**Error Handling Consistente:**

- Exception filters globales por tipo de error
- Error responses con códigos internos y mensajes user-friendly
- Validation error details con campo específico
- Logging estructurado de errores con correlation IDs

CASOS DE USO CRÍTICOS A IMPLEMENTAR:

**Flujo de Entrenador:**

1. Login → Lista de clubes → Selección de club
2. Vista de atletas del club con filtros
3. Creación de entrenamiento con asignación de atletas
4. Revisión de performance de atletas
5. Envío de comunicaciones al club

**Flujo de Atleta:**

1. Login → Vista de entrenamientos asignados
2. Registro de performance post-entrenamiento
3. Consulta de historial personal
4. Vista de competencias y resultados

**Flujo de Administrador:**

1. Gestión de usuarios y roles del club
2. Configuración del club
3. Reportes financieros y de asistencia
4. Gestión de pagos y membresías

ENTREGABLES REQUERIDOS:

1. **API Gateway completo** con proxy service y rate limiting
2. **Controllers de todos los servicios** con endpoints RESTful
3. **DTOs con validaciones** class-validator completas
4. **Swagger configuration** y decorators en todos los endpoints
5. **Guards y middleware** de seguridad aplicados consistentemente
6. **Exception filters** globales para manejo de errores
7. **Interceptors** para logging y transformación de responses
8. **Pagination utilities** reutilizables
9. **Integration tests** para endpoints críticos
10. **Postman collection** o similar para testing manual

PRIORIDADES DE IMPLEMENTACIÓN:

1. API Gateway + Identity endpoints (foundation)
2. Sports Service - Athletes y Training (core business)
3. Sports Service - Performance y Competitions (analytics)
4. Club Management (administrative)
5. Communication (nice-to-have para MVP)

RESTRICCIONES TÉCNICAS:

- Respuestas optimizadas para frontend (evitar over-fetching)
- Rate limiting apropiado para tier gratuito
- Validaciones que prevengan ataques de input
- CORS configurado apropiadamente para frontend Angular
- Health checks que no consuman recursos excesivos

Implementa APIs RESTful robustas, bien documentadas y listas para integración con frontend Angular.

````

## Resultados Esperados

### API Gateway Implementation
```typescript
// apps/api-gateway/src/proxy/proxy.controller.ts
@Controller()
@ApiTags('API Gateway')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('api/v1/identity/*')
  @UseGuards(JWTAuthGuard)
  async proxyToIdentity(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace('/api/v1/identity', '');
    const result = await this.proxyService.proxyRequest(
      'identity',
      path,
      req.method,
      req.body,
      req.headers
    );
    return res.status(200).json(result);
  }

  @All('api/v1/sports/*')
  @UseGuards(JWTAuthGuard, ClubAccessGuard)
  async proxyToSports(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace('/api/v1/sports', '');
    const result = await this.proxyService.proxyRequest(
      'sports',
      path,
      req.method,
      req.body,
      req.headers
    );
    return res.status(200).json(result);
  }
}
````

### Sports Service Controllers

```typescript
// apps/sports-service/src/athletes/athletes.controller.ts
@Controller("clubs/:clubId/athletes")
@ApiTags("Athletes")
@UseGuards(JWTAuthGuard, ClubAccessGuard)
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Get()
  @ApiOperation({ summary: "List club athletes with filters and pagination" })
  @ApiParam({ name: "clubId", description: "Club ID" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Athletes retrieved successfully" })
  @RequirePermission("athletes", "read")
  async findAll(
    @Param("clubId") clubId: string,
    @Query() filterDto: AthleteFilterDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.athletesService.findAllByClub(clubId, filterDto);
  }

  @Post()
  @ApiOperation({ summary: "Create new athlete in club" })
  @ApiResponse({ status: 201, description: "Athlete created successfully" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @RequirePermission("athletes", "create")
  @AuditLog("athlete_created")
  async create(
    @Param("clubId") clubId: string,
    @Body() createAthleteDto: CreateAthleteDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.athletesService.create(clubId, createAthleteDto, user.id);
  }

  @Get(":athleteId")
  @ApiOperation({ summary: "Get athlete details by ID" })
  @ApiParam({ name: "athleteId", description: "Athlete ID" })
  @ApiResponse({ status: 200, description: "Athlete found" })
  @ApiResponse({ status: 404, description: "Athlete not found" })
  @RequirePermission("athletes", "read")
  async findOne(
    @Param("clubId") clubId: string,
    @Param("athleteId") athleteId: string
  ) {
    return this.athletesService.findOne(athleteId, clubId);
  }

  @Put(":athleteId")
  @ApiOperation({ summary: "Update athlete information" })
  @RequirePermission("athletes", "update")
  @AuditLog("athlete_updated")
  async update(
    @Param("clubId") clubId: string,
    @Param("athleteId") athleteId: string,
    @Body() updateAthleteDto: UpdateAthleteDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.athletesService.update(
      athleteId,
      clubId,
      updateAthleteDto,
      user.id
    );
  }

  @Delete(":athleteId")
  @ApiOperation({ summary: "Soft delete athlete" })
  @ApiResponse({ status: 204, description: "Athlete deleted successfully" })
  @RequirePermission("athletes", "delete")
  @AuditLog("athlete_deleted")
  async remove(
    @Param("clubId") clubId: string,
    @Param("athleteId") athleteId: string,
    @CurrentUser() user: AuthUser
  ) {
    await this.athletesService.remove(athleteId, clubId, user.id);
    return { message: "Athlete deleted successfully" };
  }
}
```

### DTOs with Validation

```typescript
// libs/shared/common/src/dto/create-athlete.dto.ts
export class CreateAthleteDto {
  @ApiProperty({
    description: "Athlete first name",
    minLength: 2,
    maxLength: 50,
    example: "Juan",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: "Athlete last name",
    minLength: 2,
    maxLength: 50,
    example: "Pérez",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiPropertyOptional({
    description: "Date of birth",
    example: "2005-06-15",
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: "Gender",
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({
    description: "Emergency contact information",
    type: EmergencyContactDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  @IsOptional()
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({
    description: "Unique athlete number within club",
    example: "ATH001",
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9]{3,10}$/, {
    message: "Athlete number must be 3-10 alphanumeric characters",
  })
  athleteNumber?: string;
}
```

### Swagger Configuration

```typescript
// apps/sports-service/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle("Sports Service API")
    .setDescription(
      "API for managing athletes, training sessions, and competitions"
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .addTag("Athletes", "Athlete management endpoints")
    .addTag("Training", "Training session management")
    .addTag("Performance", "Performance tracking and analytics")
    .addTag("Competitions", "Competition management")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3002);
}
```

### Exception Filter

```typescript
// libs/shared/common/src/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      error: exception.name,
      correlationId: request.headers["x-correlation-id"] || uuidv4(),
    };

    // Add validation details for bad request errors
    if (status === 400 && exception.getResponse() instanceof Object) {
      const response = exception.getResponse() as any;
      if (response.message && Array.isArray(response.message)) {
        errorResponse["validationErrors"] = response.message;
      }
    }

    this.logger.error(`HTTP ${status} Error: ${exception.message}`, {
      ...errorResponse,
      stack: exception.stack,
    });

    response.status(status).json(errorResponse);
  }
}
```

## Criterios de Validación

- [ ] API Gateway con proxy funcionando para todos los servicios
- [ ] Todos los endpoints RESTful implementados según especificación
- [ ] DTOs con validaciones class-validator completas
- [ ] Swagger documentation completa y funcional
- [ ] Guards de autenticación y autorización aplicados
- [ ] Exception handling consistente en todos los servicios
- [ ] Paginación implementada en endpoints de listado
- [ ] Rate limiting configurado en Gateway
- [ ] CORS apropiadamente configurado
- [ ] Health checks funcionando en todos los servicios

## Conexión con Siguientes Prompts

Esta implementación será utilizada en:

- **Prompt 11**: Servicios de negocio que implementan la lógica detrás de estos endpoints
- **Prompts 12-14**: Frontend Angular que consumirá estas APIs
- **Prompt 15**: Integración completa frontend-backend
- **Prompt 16**: Testing E2E de estos endpoints

## Consideraciones de Implementación

- Implementar endpoints críticos primero (auth, athletes, training)
- Usar validation pipes globales para consistency
- Configurar Swagger en cada servicio individualmente
- Implementar correlation IDs para tracking de requests
- Optimizar responses para evitar over-fetching
- Preparar para rate limiting basado en usage patterns
