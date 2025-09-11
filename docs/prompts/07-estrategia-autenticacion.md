# 🔐 Prompt 7: Estrategia de Autenticación

## Contexto

Con la arquitectura de microservicios y modelos de datos definidos, necesitamos diseñar una estrategia completa de autenticación y autorización que soporte multi-tenancy por club, múltiples roles y dispositivos.

## Objetivo del Prompt

Diseñar una estrategia integral de autenticación y autorización que sea segura, escalable y fácil de implementar para la plataforma deportiva multi-club.

## Prompt Completo

```
Diseña la estrategia completa de autenticación y autorización para mi plataforma deportiva con estas especificaciones:

CONTEXTO DEL PROYECTO:
- Plataforma de gestión deportiva multi-club
- NestJS + Prisma + PostgreSQL
- Arquitectura de microservicios (enfoque simple)
- 6 tipos de roles con permisos granulares por club
- MVP: 100 usuarios, escalable a miles

REQUERIMIENTOS DE AUTENTICACIÓN:

1. **Google OAuth** como proveedor principal de autenticación
   - Integración con Google OAuth 2.0
   - Registro automático de usuarios en primer login
   - Vinculación de cuentas existentes
   - Manejo de emails verificados por Google

2. **Sessions + JWT híbrido**:
   - Sesiones persistentes en PostgreSQL para control administrativo
   - JWT tokens para comunicación entre microservicios
   - Refresh tokens para renovación segura
   - Revocación inmediata de sesiones comprometidas

3. **Multi-dispositivo**:
   - Un usuario puede estar logueado en varios dispositivos
   - Gestión independiente de sesiones por dispositivo
   - Opción de "cerrar sesión en todos los dispositivos"
   - Tracking de último acceso por dispositivo

4. **Multi-club**:
   - Un User puede tener diferentes roles en diferentes clubes
   - Cambio de contexto de club sin re-autenticación
   - Permisos específicos por club almacenados en sesión
   - Filtrado automático de datos por club activo

SISTEMA DE ROLES Y PERMISOS:

**Roles por Club:**
- **Club Administrator**: Gestión completa del club, usuarios, configuración
- **Coach**: Gestión de atletas, entrenamientos, performance, comunicación básica
- **Athlete**: Ver información personal, entrenamientos asignados, registrar performance
- **Medical Staff**: Acceso completo a datos médicos, restricciones, recomendaciones
- **Parent**: Ver información de hijos atletas, comunicación básica
- **Club Director**: Reportes ejecutivos, estadísticas, análisis financiero

**Permisos Granulares por Módulo:**
- **Athletes**: create, read, update, delete, view_medical, assign_training
- **Training**: create, read, update, delete, assign, view_results, manage_templates
- **Performance**: create, read, update, delete, view_analytics, export_data
- **Competitions**: create, read, update, delete, register_athletes, manage_results
- **Payments**: create, read, update, delete, view_reports, manage_debts
- **Communications**: create, read, update, delete, send_notifications, manage_announcements
- **Medical**: create, read, update, delete, view_full_history, manage_restrictions

REQUERIMIENTOS TÉCNICOS:

1. **Seguridad Robusta**:
   - Tokens JWT de corta duración (15 minutos)
   - Refresh tokens con rotación automática
   - Rate limiting en endpoints de autenticación
   - Protección contra ataques CSRF y XSS
   - Validación de integridad de tokens

2. **Performance y Escalabilidad**:
   - Cache de permisos de usuario en memoria
   - Verificación eficiente de permisos en guards
   - Minimizar consultas a BD para autorización
   - Preparado para horizontal scaling

3. **Auditoría y Compliance**:
   - Logging de todos los intentos de autenticación
   - Tracking de accesos a datos de menores
   - Registro de cambios de permisos y roles
   - Compliance básico con GDPR

4. **User Experience**:
   - Login fluido con Google OAuth
   - Cambio de club sin friction
   - Renovación transparente de tokens
   - Mensajes de error claros y informativos

CASOS DE USO CRÍTICOS:

- **Multi-club coach**: Entrenador trabaja en 2 clubes con roles diferentes
- **Parent with multiple children**: Padre con hijos en diferentes categorías/clubes
- **Medical staff access**: Personal médico accede a información sensible de menores
- **Administrator role changes**: Admin modifica permisos de usuarios en tiempo real
- **Session compromise**: Usuario reporta actividad sospechosa, revocación inmediata
- **Device management**: Usuario gestiona sesiones activas desde múltiples dispositivos

INTEGRACIÓN CON MICROSERVICIOS:

- **Identity Service**: Gestión centralizada de autenticación y usuarios
- **API Gateway**: Verificación de tokens y enrutamiento seguro
- **Sports Service**: Autorización granular para datos deportivos
- **Club Management**: Control de acceso a información financiera y administrativa
- **Communication**: Permisos para envío de notificaciones y anuncios

ENTREGABLES REQUERIDOS:

1. **Modelo de datos completo** para Users, Clubs, Roles, Permissions, Sessions
2. **Estrategia detallada de Google OAuth integration** con flujos de error
3. **Sistema de permisos granulares (RBAC)** con matriz de permisos por rol
4. **Flujo de autenticación completo** desde login hasta autorización
5. **Gestión de sesiones y tokens JWT** con renovación y revocación
6. **Middleware de autorización por club** para multi-tenancy automático
7. **Casos de uso de seguridad críticos** con flujos detallados
8. **Estrategia de migración** para usuarios existentes (si aplica)

RESTRICCIONES Y CONSIDERACIONES:

- Usar servicios gratuitos para MVP (no Auth0 premium)
- Minimizar complejidad de implementación inicial
- Preparado para escalabilidad futura
- Compatible con PWA para móviles futuro
- Soporte para offline básico (tokens cached)

Diseña un sistema seguro, escalable y fácil de implementar que sirva como foundation sólida para toda la plataforma.
```

## Resultados Esperados

### Modelo de Datos de Autenticación

**Core Authentication Tables:**

```sql
-- Users (personas físicas con acceso al sistema)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles por club (RBAC)
CREATE TABLE user_club_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- club_admin, coach, athlete, medical, parent, director
    permissions JSONB DEFAULT '{}', -- Permisos específicos override
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, club_id, role)
);

-- Sesiones de usuario (multi-dispositivo)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB, -- User agent, IP, device type
    current_club_id UUID REFERENCES clubs(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Flujo de Autenticación

```
1. Usuario → Google OAuth → Authorization Code
2. Backend → Google API → User Info + Verification
3. Backend → Create/Update User → Generate Session
4. Backend → Generate JWT + Refresh Token → Return to Client
5. Client → Store tokens → Access protected resources
6. JWT expires → Client uses Refresh Token → New JWT
7. Logout → Revoke session → Cleanup tokens
```

### Sistema de Permisos RBAC

```typescript
interface Permission {
  module:
    | "athletes"
    | "training"
    | "performance"
    | "competitions"
    | "payments"
    | "communications"
    | "medical";
  action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "assign"
    | "export"
    | "manage";
  scope?: "own" | "club" | "all"; // Alcance del permiso
}

const ROLE_PERMISSIONS = {
  club_admin: [{ module: "*", action: "*", scope: "club" }],
  coach: [
    { module: "athletes", action: ["read", "update", "assign"], scope: "club" },
    { module: "training", action: "*", scope: "club" },
    { module: "performance", action: "*", scope: "club" },
    { module: "communications", action: ["create", "read"], scope: "club" },
  ],
  athlete: [
    { module: "training", action: "read", scope: "own" },
    { module: "performance", action: ["read", "create"], scope: "own" },
    { module: "competitions", action: "read", scope: "own" },
  ],
  // ... otros roles
};
```

## Criterios de Validación

- [ ] Integración completa con Google OAuth 2.0
- [ ] Sistema de sesiones multi-dispositivo implementado
- [ ] RBAC granular con permisos por módulo y acción
- [ ] Multi-tenancy por club con cambio de contexto
- [ ] JWT + Refresh token con rotación segura
- [ ] Auditoría de accesos y cambios de permisos
- [ ] Rate limiting en endpoints críticos
- [ ] Manejo de casos edge (sesiones expiradas, permisos revocados)

## Conexión con Siguientes Prompts

Esta estrategia será implementada en:

- **Prompt 8**: Implementación técnica con NestJS Guards y Strategies
- **Prompts 9-11**: Integración en servicios backend
- **Prompts 12-14**: Integración con frontend Angular
- **Prompt 15**: Testing de seguridad end-to-end

## Consideraciones de Implementación

- Iniciar con roles básicos (admin, coach, athlete)
- Implementar permisos granulares gradualmente
- Usar Google OAuth library oficial para NestJS
- Cache de permisos en memoria para performance
- Preparar para migración a servicios premium en el futuro
