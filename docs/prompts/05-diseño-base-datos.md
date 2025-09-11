# 🗄️ Prompt 5: Diseño de Base de Datos

## Contexto

Con las entidades principales identificadas y sus relaciones definidas, necesitamos convertir el modelo conceptual en un esquema de base de datos PostgreSQL optimizado para performance, escalabilidad y multi-tenancy.

## Objetivo del Prompt

Crear un esquema de base de datos PostgreSQL completo, optimizado y listo para producción que soporte todos los requerimientos de la plataforma deportiva.

## Prompt Completo

```
Convierte mi modelo conceptual en un esquema de base de datos PostgreSQL optimizado para mi plataforma deportiva:

ESPECIFICACIONES TÉCNICAS:
- PostgreSQL 15+ con campos JSONB para métricas flexibles
- Multi-tenant por club (filtrado automático por club_id)
- Separación User/Athlete para flexibilidad multi-club
- Optimizado para servicios gratuitos (Supabase, Railway, PlanetScale)
- Preparado para escalabilidad horizontal futura

ENTIDADES PRINCIPALES DEFINIDAS:
[Basándome en el resultado del Prompt 4]

**Core Entities:**
- Users (personas físicas con acceso)
- Athletes (perfiles deportivos por club)
- Clubs (organizaciones deportivas - tenant)
- UserClubRoles (roles y permisos por club)

**Sports Domain:**
- TrainingSessions (entrenamientos planificados)
- TrainingAssignments (asignaciones atleta-entrenamiento)
- PerformanceRecords (métricas y resultados JSONB)
- Competitions (competencias y eventos)

**Administrative:**
- Payments (gestión financiera)
- Communications (anuncios y notificaciones)
- MedicalRecords (información médica/nutricional)
- Files (gestión de archivos y documentos)

REQUERIMIENTOS DE DISEÑO:

1. **Estructura Multi-Tenant**
   - Aislamiento completo por club_id
   - Índices optimizados para filtrado por club
   - Row Level Security (RLS) para máxima seguridad
   - Estrategia de particionado por club para escalabilidad

2. **Métricas Flexibles con JSONB**
   - Campos JSONB para datos de rendimiento deportivo
   - Validación de esquemas JSON específicos por deporte
   - Índices GIN para consultas eficientes en JSONB
   - Funciones auxiliares para agregaciones

3. **Escalabilidad y Performance**
   - Índices compuestos optimizados para consultas frecuentes
   - Particionado por fecha para tablas de alto volumen
   - Constraint exclusions para mejor performance
   - Preparado para read replicas

4. **Integridad de Datos**
   - Foreign keys con cascadas apropiadas
   - Check constraints para validaciones de negocio
   - Unique constraints compuestos
   - Triggers para auditoría automática

5. **Gestión de Archivos**
   - Referencias a almacenamiento local (paths)
   - Metadatos de archivos (tipo, tamaño, hash)
   - Soft deletes para archivos críticos
   - Cleanup automático de archivos huérfanos

CASOS DE USO CRÍTICOS PARA OPTIMIZACIÓN:

- **Consultas frecuentes**:
  - Atletas por club y estado activo
  - Entrenamientos por club y rango de fechas
  - Rendimiento de atleta por período temporal
  - Pagos pendientes por club
  - Notificaciones no leídas por usuario

- **Consultas complejas**:
  - Reportes de asistencia con agregaciones
  - Análisis de tendencias de rendimiento (JSONB)
  - Rankings por competencia y categoría
  - Reportes financieros con múltiples filtros
  - Análisis comparativo entre atletas

- **Consultas críticas de performance**:
  - Dashboard en tiempo real para entrenadores
  - Calendario de entrenamientos con asignaciones
  - Historial de rendimiento para análisis
  - Sincronización offline para móviles

ENTREGABLES REQUERIDOS:

1. **Scripts SQL DDL Completos**
   - CREATE TABLE statements para todas las entidades
   - ALTER TABLE para foreign keys y constraints
   - CREATE INDEX statements optimizados
   - Funciones y triggers auxiliares

2. **Diagrama ERD (Entidad-Relación)**
   - Representación visual completa del esquema
   - Cardinalidades y tipos de relaciones
   - Índices principales marcados
   - Campos JSONB documentados

3. **Índices Estratégicos**
   - Índices simples para foreign keys
   - Índices compuestos para consultas frecuentes
   - Índices GIN para campos JSONB
   - Índices parciales para soft deletes

4. **Constraints y Validaciones**
   - Check constraints para business rules
   - Unique constraints compuestos
   - Foreign key constraints con cascadas
   - Validaciones de JSONB schemas

5. **Estrategia de Particionado**
   - Particionado por club_id para tablas grandes
   - Particionado por fecha para historical data
   - Partition pruning configuration
   - Maintenance scripts para particiones

6. **Configuración de Seguridad**
   - Row Level Security (RLS) policies
   - Roles de base de datos por servicio
   - Grants granulares por tabla
   - Audit triggers para operaciones críticas

7. **Migración y Backup**
   - Scripts de migración inicial
   - Seed data para testing
   - Backup strategy para diferentes environments
   - Rollback procedures

8. **Performance Tuning**
   - Configuración PostgreSQL recomendada
   - Monitoring queries para identificar bottlenecks
   - EXPLAIN ANALYZE examples para queries críticas
   - Connection pooling recommendations

RESTRICCIONES Y CONSIDERACIONES:

- **Límites de servicios gratuitos**: Optimizar para tier gratuito de Supabase
- **Crecimiento gradual**: Diseño que permita migración a PostgreSQL dedicado
- **Compliance básico**: GDPR-ready para datos de menores
- **Backup automático**: Compatible con estrategias de backup automático
- **Multi-región**: Preparado para replicación geográfica futura

Diseña un esquema robusto, escalable y optimizado que sirva como foundation sólida para la plataforma deportiva.
```

## Resultados Esperados

### Esquema Principal de Tablas

**Core Tables:**

```sql
-- Users (personas físicas)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clubs (organizaciones deportivas - tenant principal)
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    contact_info JSONB,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Athletes (perfiles deportivos por club)
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    athlete_number VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    emergency_contact JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, athlete_number)
);
```

**Sports Domain Tables:**

```sql
-- Training Sessions
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    training_plan JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Records (métricas flexibles)
CREATE TABLE performance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    training_session_id UUID REFERENCES training_sessions(id),
    record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metrics JSONB NOT NULL, -- Flexible sports metrics
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Índices Estratégicos

```sql
-- Multi-tenant optimization
CREATE INDEX idx_athletes_club_active ON athletes(club_id, is_active);
CREATE INDEX idx_training_sessions_club_date ON training_sessions(club_id, scheduled_date);
CREATE INDEX idx_performance_records_athlete_date ON performance_records(athlete_id, record_date);

-- JSONB optimization
CREATE INDEX idx_performance_metrics_gin ON performance_records USING GIN (metrics);
CREATE INDEX idx_club_settings_gin ON clubs USING GIN (settings);
```

### Row Level Security (RLS)

```sql
-- Enable RLS for multi-tenancy
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies (example)
CREATE POLICY athlete_club_isolation ON athletes
    FOR ALL TO authenticated_users
    USING (club_id = current_setting('app.current_club_id')::UUID);
```

## Criterios de Validación

- [ ] Todas las entidades principales representadas como tablas
- [ ] Multi-tenancy implementado con club_id en todas las tablas relevantes
- [ ] Campos JSONB optimizados con índices GIN
- [ ] Foreign keys y constraints de integridad configurados
- [ ] Índices estratégicos para consultas frecuentes
- [ ] Row Level Security configurado para aislamiento por club
- [ ] Particionado considerado para tablas de alto volumen
- [ ] Scripts de migración y seed data incluidos

## Conexión con Siguientes Prompts

Este esquema será implementado en:

- **Prompt 6**: Modelos Prisma y NestJS basados en este esquema
- **Prompts 7-8**: Configuración de seguridad y autorización
- **Prompts 9-11**: Implementación de servicios que usan estas tablas

## Consideraciones de Performance

- Optimizado para consultas multi-tenant frecuentes
- JSONB indexado para métricas deportivas flexibles
- Preparado para particionado horizontal por club
- Compatible con read replicas para escalabilidad
