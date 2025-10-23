# 🛡️ Prompt 8: Implementación de Seguridad NestJS

## Contexto

Con la estrategia de autenticación definida, necesitamos implementar todos los componentes técnicos de seguridad usando NestJS, incluyendo guards, strategies, services y middleware para soportar Google OAuth, JWT, y autorización granular.

## Objetivo del Prompt

Implementar la infraestructura completa de seguridad en NestJS que materialice la estrategia de autenticación diseñada, incluyendo una librería compartida reutilizable entre microservicios.

## Prompt Completo

````
Implementa el sistema de autenticación y autorización completo para mi plataforma deportiva usando NestJS con estas especificaciones:

CONTEXTO TÉCNICO:
- NestJS + Prisma + PostgreSQL
- Google OAuth + Sessions + JWT híbrido
- Arquitectura de microservicios con librería compartida
- Multi-tenancy por club con roles granulares
- Auditoría intermedia de operaciones críticas

ARQUITECTURA DE SEGURIDAD REQUERIDA:

libs/shared/auth/
├── src/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Verificación JWT entre servicios
│   │   ├── google-oauth.guard.ts       # Google OAuth flow
│   │   ├── club-access.guard.ts        # Verificación acceso por club
│   │   ├── permission.guard.ts         # Verificación permisos granulares
│   │   └── session.guard.ts            # Verificación sesión activa
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # Extrae usuario del request
│   │   ├── current-club.decorator.ts   # Extrae club del contexto
│   │   ├── require-permission.decorator.ts # Decorador de permisos
│   │   ├── require-role.decorator.ts   # Decorador de roles
│   │   └── public.decorator.ts         # Endpoint público
│   ├── strategies/
│   │   ├── jwt.strategy.ts             # Passport JWT strategy
│   │   ├── google.strategy.ts          # Passport Google strategy
│   │   └── refresh-token.strategy.ts   # Strategy para refresh tokens
│   ├── services/
│   │   ├── auth.service.ts             # Lógica principal de autenticación
│   │   ├── session.service.ts          # Gestión de sesiones y dispositivos
│   │   ├── permission.service.ts       # Verificación de permisos RBAC
│   │   ├── token.service.ts            # Generación y validación JWT
│   │   └── audit.service.ts            # Logging de seguridad
│   ├── interfaces/
│   │   ├── auth-user.interface.ts      # Usuario autenticado
│   │   ├── permission.interface.ts     # Definición de permisos
│   │   ├── session.interface.ts        # Sesión de usuario
│   │   └── jwt-payload.interface.ts    # Payload de JWT
│   ├── dto/
│   │   ├── login.dto.ts                # DTOs de autenticación
│   │   ├── refresh-token.dto.ts        # DTO para refresh
│   │   └── change-club.dto.ts          # DTO para cambio de club
│   ├── constants/
│   │   ├── permissions.constants.ts    # Definición de todos los permisos
│   │   ├── roles.constants.ts          # Definición de roles
│   │   └── auth.constants.ts           # Constantes de configuración
│   └── auth.module.ts                  # Módulo principal exportable

libs/shared/audit/
├── src/
│   ├── audit.service.ts                # Servicio de auditoría
│   ├── audit.interceptor.ts            # Interceptor automático
│   ├── audit.decorator.ts              # Decorador para operaciones críticas
│   └── audit.module.ts

COMPONENTES ESPECÍFICOS A IMPLEMENTAR:

1. **Google OAuth Implementation**:
   - GoogleStrategy con Passport
   - Callback handling con error management
   - User creation/update automático
   - Email verification flow
   - Account linking para usuarios existentes

2. **JWT Token Management**:
   - JWTStrategy para validación entre servicios
   - Token generation con payload customizado
   - Refresh token rotation automática
   - Token blacklisting para revocación
   - Short-lived access tokens (15 min)

3. **Session Management Service**:
   - Multi-device session tracking
   - Session cleanup automático
   - Device fingerprinting básico
   - Geographic location tracking opcional
   - "Logout from all devices" functionality

4. **Permission System Implementation**:
   - RBAC engine con cache en memoria
   - Permission checking optimizado
   - Dynamic permission loading por club
   - Permission inheritance y overrides
   - Bulk permission verification

5. **Club Context Management**:
   - Automatic club filtering en queries
   - Club switching sin re-autenticación
   - Club-scoped permission caching
   - Multi-tenant data isolation enforcement

6. **Security Middleware y Guards**:
   - Rate limiting por usuario y endpoint
   - CSRF protection para forms
   - Helmet configuration para headers
   - Request sanitization
   - Suspicious activity detection básica

CARACTERÍSTICAS TÉCNICAS ESPECÍFICAS:

**AuthService Methods:**
```typescript
class AuthService {
  async googleLogin(profile: GoogleProfile): Promise<AuthResult>
  async validateJWT(payload: JWTPayload): Promise<User | null>
  async refreshTokens(refreshToken: string): Promise<TokenPair>
  async logout(sessionId: string): Promise<void>
  async logoutAllDevices(userId: string): Promise<void>
  async switchClub(userId: string, clubId: string): Promise<AuthResult>
}
````

**PermissionService Methods:**

```typescript
class PermissionService {
  async hasPermission(userId: string, clubId: string, permission: Permission): Promise<boolean>;
  async getUserPermissions(userId: string, clubId: string): Promise<Permission[]>;
  async checkBulkPermissions(
    userId: string,
    clubId: string,
    permissions: Permission[],
  ): Promise<boolean[]>;
  async getUserRoles(userId: string, clubId: string): Promise<Role[]>;
  async invalidateUserCache(userId: string): Promise<void>;
}
```

**Guards Implementation:**

- **JWTAuthGuard**: Verificación de tokens válidos
- **ClubAccessGuard**: Verificación de acceso por club
- **PermissionGuard**: Verificación de permisos específicos con @RequirePermission()
- **SessionGuard**: Verificación de sesión activa y válida

**Decorators Usage:**

```typescript
@Controller('athletes')
@UseGuards(JWTAuthGuard, ClubAccessGuard)
export class AthletesController {
  @Get()
  @RequirePermission('athletes', 'read')
  async findAll(@CurrentUser() user: AuthUser, @CurrentClub() clubId: string) {}

  @Post()
  @RequirePermission('athletes', 'create')
  @AuditLog('athlete_created')
  async create(@Body() dto: CreateAthleteDto) {}
}
```

AUDITORÍA Y COMPLIANCE:

7. **Audit System**:
   - Automatic logging de authentication events
   - Permission changes tracking
   - Access to sensitive data (menores, finanzas)
   - Failed login attempts monitoring
   - Data export/download tracking

8. **Security Monitoring**:
   - Suspicious login detection
   - Multiple failed attempts alerting
   - Concurrent session limits
   - Geographic location anomalies
   - API rate limiting per user/club

INTEGRATION EXAMPLES:

9. **Identity Service Integration**:
   - Auth endpoints con Google OAuth
   - Session management endpoints
   - User profile management
   - Role assignment por administradores

10. **API Gateway Integration**:
    - Centralized authentication checking
    - Request routing con user context
    - Rate limiting enforcement
    - Audit logging coordination

CASOS DE USO CRÍTICOS A IMPLEMENTAR:

- **Login Flow**: Google OAuth → Session creation → JWT generation → Club selection
- **Permission Check**: Guard verifica JWT → Extrae user → Verifica permisos en club → Allow/Deny
- **Club Switch**: Usuario cambia club → Verifica acceso → Actualiza contexto → Nuevos permisos
- **Session Revocation**: Admin revoca usuario → Invalida todas las sesiones → Bloquea nuevos logins
- **Audit Trail**: Operación crítica → Interceptor captura → Log con context → Notificación si requerida

ENTREGABLES REQUERIDOS:

1. **Configuración completa de Google OAuth** con error handling robusto
2. **Guards y strategies de NestJS** listos para uso en producción
3. **Services para gestión de sesiones** con multi-device support
4. **Decoradores para controllers** que simplifiquen la autorización
5. **Interceptors de auditoría** para tracking automático
6. **Middleware de multi-tenancy** con filtrado automático
7. **Tests unitarios y de integración** para componentes críticos
8. **Documentación de uso** con ejemplos prácticos
9. **Configuration management** para diferentes environments
10. **Error handling consistente** con mensajes user-friendly

PRIORIDADES DE IMPLEMENTACIÓN:

1. Google OAuth + Basic JWT (foundation)
2. Session management + Permission basics
3. Club context + Multi-tenancy enforcement
4. Advanced permissions + Audit logging
5. Security monitoring + Compliance features

RESTRICCIONES TÉCNICAS:

- Compatible con servicios gratuitos (no premium OAuth providers)
- Performance optimizado para 100+ usuarios concurrentes
- Memory usage controlado para tier gratuito de hosting
- Database connections eficientes (connection pooling)
- Horizontal scaling ready (stateless donde sea posible)

Implementa un sistema robusto, type-safe y listo para producción que sirva como foundation de seguridad para toda la plataforma.

````

## Resultados Esperados

### Configuración de Google OAuth
```typescript
// libs/shared/auth/src/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const user = await this.authService.validateGoogleUser({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileImageUrl: profile.photos[0]?.value,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
````

### Guard de Permisos

```typescript
// libs/shared/auth/src/guards/permission.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../services/permission.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const clubId = request.clubId || request.params.clubId;

    if (!user || !clubId) {
      throw new ForbiddenException('User or club context missing');
    }

    const hasPermission = await this.permissionService.hasPermission(
      user.id,
      clubId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Service de Autenticación

```typescript
// libs/shared/auth/src/services/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@libs/shared/database';
import { TokenService } from './token.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tokenService: TokenService,
    private sessionService: SessionService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<AuthResult> {
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
      include: { userClubRoles: { include: { club: true } } },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profileImageUrl: profile.profileImageUrl,
          emailVerified: true,
        },
        include: { userClubRoles: { include: { club: true } } },
      });
    }

    // Create session and tokens
    const session = await this.sessionService.createSession(user.id, {
      userAgent: 'web', // Get from request
      ipAddress: '0.0.0.0', // Get from request
    });

    const tokens = await this.tokenService.generateTokens(user.id, session.id);

    return {
      user: this.sanitizeUser(user),
      session: session.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      availableClubs: user.userClubRoles.map((ucr) => ucr.club),
    };
  }

  async validateJWT(payload: JWTPayload): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userClubRoles: {
          where: { isActive: true },
          include: { club: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Verify session is still active
    const session = await this.sessionService.validateSession(payload.sessionId);
    if (!session) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      sessionId: payload.sessionId,
      clubRoles: user.userClubRoles,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const session = await this.sessionService.validateRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = await this.tokenService.generateTokens(session.userId, session.id);

    // Update session with new refresh token
    await this.sessionService.updateRefreshToken(session.id, tokens.refreshToken);

    return tokens;
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
  }
}
```

### Decoradores de Autorización

```typescript
// libs/shared/auth/src/decorators/require-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export interface Permission {
  module: string;
  action: string;
  scope?: 'own' | 'club' | 'all';
}

export const RequirePermission = (
  module: string,
  action: string,
  scope: 'own' | 'club' | 'all' = 'club',
) => SetMetadata(PERMISSION_KEY, { module, action, scope });

// Usage example:
// @RequirePermission('athletes', 'create')
// @RequirePermission('training', 'read', 'own')
```

```typescript
// libs/shared/auth/src/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const CurrentClub = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.clubId || request.params.clubId;
});
```

### Interceptor de Auditoría

```typescript
// libs/shared/audit/src/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body, params } = request;

    const auditData = {
      userId: user?.id,
      action: `${method} ${url}`,
      resource: this.extractResource(url),
      resourceId: params?.id,
      clubId: request.clubId || params?.clubId,
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
      timestamp: new Date(),
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.auditService.logSuccess(auditData, response);
        },
        error: (error) => {
          this.auditService.logError(auditData, error);
        },
      }),
    );
  }

  private extractResource(url: string): string {
    // Extract resource from URL pattern
    const matches = url.match(/\/api\/v1\/clubs\/[^\/]+\/([^\/\?]+)/);
    return matches ? matches[1] : 'unknown';
  }
}
```

## Criterios de Validación

- [ ] Google OAuth completamente funcional con error handling
- [ ] JWT strategy con verificación de sesiones activas
- [ ] Guards de autorización que validen permisos granulares
- [ ] Decoradores que simplifiquen el uso en controllers
- [ ] Service de permisos con cache optimizado
- [ ] Sistema de auditoría para operaciones críticas
- [ ] Multi-tenancy enforcement automático
- [ ] Session management con multi-device support
- [ ] Rate limiting y security headers configurados
- [ ] Tests unitarios para componentes críticos

## Conexión con Siguientes Prompts

Esta implementación será utilizada en:

- **Prompts 9-11**: Integración en todos los servicios backend
- **Prompts 12-14**: Configuración en frontend Angular
- **Prompt 15**: Testing de integración completa
- **Prompt 18**: Configuración en Docker containers

## Consideraciones de Implementación

- Implementar Google OAuth primero como foundation
- Agregar session management básico
- Construir sistema de permisos gradualmente
- Optimizar performance con caching estratégico
- Preparar para horizontal scaling (stateless)
- Documentar patrones de uso para el equipo
