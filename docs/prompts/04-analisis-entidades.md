# 🔍 Prompt 4: Análisis de Entidades

## Contexto

Con la arquitectura del sistema definida, necesitamos identificar y modelar todas las entidades principales que conformarán el dominio de la plataforma deportiva, estableciendo las bases para el diseño de la base de datos.

## Objetivo del Prompt

Realizar un análisis completo de entidades y sus relaciones para la plataforma deportiva, con enfoque en flexibilidad multi-club y escalabilidad a múltiples deportes.

## Prompt Completo

```
Ayúdame a identificar y definir todas las entidades principales para mi plataforma de gestión deportiva con estas características:

CONTEXTO DEL PROYECTO:
- Plataforma integral para clubes de natación (escalable a otros deportes)
- Arquitectura multi-tenant por club con microservicios NestJS
- Usuarios: entrenadores, administradores, atletas, personal médico, padres, directivos
- MVP: 2 clubes con ~50 atletas cada uno, escalable a miles de usuarios

ENTIDADES PRINCIPALES A DEFINIR:

1. **Users vs Athletes** (separación para multi-club)
   - Un User puede tener múltiples perfiles de Athlete en diferentes clubes
   - Flexibilidad para padres que gestionan múltiples hijos
   - Entrenadores que trabajan en varios clubes

2. **Clubs** (organización principal y tenant)
   - Información del club y configuración
   - Deportes que practican y categorías
   - Configuración de roles y permisos

3. **Training Sessions** (individual/grupal, recurrente, librería)
   - Templates reutilizables de entrenamientos
   - Sesiones específicas con fecha y asignaciones
   - Soporte para entrenamientos recurrentes

4. **Performance Data** (métricas flexibles con JSONB)
   - Registros de tiempo, distancia, frecuencia cardíaca
   - Métricas específicas por deporte (brazada, técnica, etc.)
   - Progreso temporal y comparativas

5. **Competitions** (calendario, resultados, categorías)
   - Competencias internas y externas
   - Inscripciones y resultados por atleta
   - Rankings y categorías por edad/nivel

6. **Payments** (registro manual, sin integración)
   - Mensualidades y pagos adicionales
   - Estados de pago y historial
   - Reportes financieros básicos

7. **Communications** (anuncios, notificaciones)
   - Anuncios generales del club
   - Notificaciones personalizadas
   - Comunicación entre roles

8. **Medical Records** (datos médicos y nutricionales)
   - Historiales médicos básicos
   - Información nutricional
   - Restricciones y recomendaciones

REQUERIMIENTOS ESPECÍFICOS:

- **Multi-tenancy**: Filtrado automático por club_id en todas las consultas
- **Flexibilidad de métricas**: JSONB para datos específicos por deporte
- **Escalabilidad**: Preparado para múltiples deportes y tipos de entrenamiento
- **Separación User/Athlete**: Un usuario puede ser atleta en múltiples clubes
- **Roles dinámicos**: Permisos configurables por club y tipo de usuario
- **Archivos locales**: Referencias a fotos, documentos médicos, certificados

CASOS DE USO CRÍTICOS:
- Entrenador asigna entrenamiento a grupo específico de atletas
- Atleta registra sus métricas post-entrenamiento
- Padre consulta progreso de múltiples hijos en el mismo club
- Personal médico actualiza restricciones de un atleta
- Administrador genera reporte de pagos pendientes
- Directivo consulta estadísticas de rendimiento del club

ENTREGABLES:

1. **Diagrama conceptual** de entidades y relaciones principales
2. **Definición detallada** de atributos por entidad con tipos de datos
3. **Matriz de relaciones** (1:1, 1:N, N:M) entre todas las entidades
4. **Estrategia de multi-tenancy** con club_id en entidades relevantes
5. **Modelo de permisos** y roles por club
6. **Consideraciones de escalabilidad** para otros deportes
7. **Campos JSONB** específicos para métricas deportivas flexibles
8. **Casos de uso** validados contra el modelo conceptual

ENFOQUE ESPECIAL:
- Priorizar la flexibilidad para diferentes deportes
- Mantener separación clara entre User (persona) y Athlete (perfil deportivo)
- Diseñar para consultas eficientes en arquitectura multi-tenant
- Considerar future features como gamificación y análisis avanzado
```

## Resultados Esperados

### Entidades Principales Identificadas

**Core Entities:**

- **Users** - Personas físicas con acceso al sistema
- **Athletes** - Perfiles deportivos asociados a clubes
- **Clubs** - Organizaciones deportivas (tenant principal)
- **UserClubRoles** - Roles y permisos por club

**Sports Domain:**

- **TrainingSessions** - Entrenamientos planificados
- **TrainingAssignments** - Asignaciones atleta-entrenamiento
- **PerformanceRecords** - Métricas y resultados
- **Competitions** - Competencias y eventos

**Administrative:**

- **Payments** - Gestión financiera
- **Communications** - Anuncios y notificaciones
- **MedicalRecords** - Información médica/nutricional
- **Files** - Gestión de archivos y documentos

### Relaciones Principales

- User (1) ↔ (N) Athletes (multi-club)
- Club (1) ↔ (N) Athletes (tenant)
- Athlete (1) ↔ (N) PerformanceRecords
- TrainingSession (1) ↔ (N) TrainingAssignments
- Athlete (N) ↔ (M) TrainingSessions (through assignments)

### Consideraciones Multi-Tenant

- Todas las entidades del dominio incluyen `club_id`
- Filtrado automático por club en queries
- Roles y permisos específicos por club
- Aislamiento completo de datos entre clubes

## Criterios de Validación

- [ ] Separación clara entre User (persona) y Athlete (perfil deportivo)
- [ ] Estrategia de multi-tenancy con club_id bien definida
- [ ] Modelo de roles y permisos granulares por club
- [ ] Flexibilidad para métricas deportivas con JSONB
- [ ] Escalabilidad a múltiples deportes considerada
- [ ] Relaciones entre entidades claramente definidas
- [ ] Casos de uso críticos validados contra el modelo
- [ ] Consideraciones de performance para queries multi-tenant

## Conexión con Siguientes Prompts

Los resultados alimentarán:

- **Prompt 5**: Conversión a esquema PostgreSQL con índices optimizados
- **Prompt 6**: Implementación con Prisma ORM y NestJS
- **Prompts 7-8**: Modelo de seguridad y autorización
- **Prompts 9-11**: Implementación de servicios backend

## Notas de Implementación

- Mantener flexibilidad para agregar nuevos deportes
- Considerar performance en queries con filtrado por club
- Preparar para futuras funcionalidades como gamificación
- Diseñar con Domain-Driven Design en mente
