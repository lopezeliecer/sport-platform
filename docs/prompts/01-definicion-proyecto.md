# 🎯 Prompt 1: Definición del Proyecto

## Contexto

Inicio del proyecto de plataforma deportiva integral. Necesitamos establecer las bases conceptuales y funcionales del sistema enfocado en la gestión de clubes deportivos con énfasis en natación.

## Objetivo del Prompt

Definir claramente el alcance, funcionalidades principales, tipos de usuarios y roadmap del MVP de la plataforma de gestión deportiva.

## Prompt Completo

```
Ayúdame a definir una plataforma integral de gestión deportiva enfocada inicialmente en natación pero escalable a otros deportes. La aplicación debe manejar:

- Seguimiento de entrenamientos y rendimiento de atletas
- Gestión de competencias y resultados
- Comunicación entre entrenadores, atletas y padres
- Análisis de datos deportivos
- Gestión financiera de mensualidades de clubes
- Registro médico y nutricional

Los usuarios principales son: entrenadores, administradores de club, deportistas, personal médico, padres de familia y directivos.

Defíneme las funcionalidades principales por módulo y crea user stories específicas para cada tipo de usuario. El MVP será para 2 clubes con aproximadamente 50 atletas cada uno.

ENTREGABLES ESPERADOS:
1. Definición clara del problema que resuelve la plataforma
2. Módulos principales con sus funcionalidades core
3. Tipos de usuarios y sus roles específicos
4. User stories detalladas por tipo de usuario
5. Alcance del MVP con métricas específicas
6. Criterios de éxito para el MVP
7. Roadmap de crecimiento post-MVP

ENFOQUE ESPECIAL:
- Priorizar la experiencia del entrenador como usuario central
- El calendario de entrenamientos debe ser la funcionalidad principal
- Diseñar para escalabilidad multi-club desde el inicio
- Considerar la gestión de múltiples deportes en el futuro
```

## Resultados Esperados

### Módulos Principales Definidos

- **Gestión de Entrenamientos**: Calendario, asignación, seguimiento, planificación
- **Gestión de Atletas**: Perfiles completos, rendimiento, historial deportivo
- **Competencias**: Calendario, inscripciones, resultados, rankings
- **Comunicación**: Anuncios, notificaciones push, mensajería interna
- **Análisis y Reportes**: Tendencias, comparativas, progreso individual/grupal
- **Finanzas**: Mensualidades, pagos, reportes financieros, control de deudas
- **Médico/Nutricional**: Historiales médicos, recomendaciones, seguimiento

### Tipos de Usuarios y Roles

1. **Entrenadores** (usuarios principales) - Gestión completa de entrenamientos y atletas
2. **Administradores de Club** - Gestión administrativa y financiera
3. **Atletas/Deportistas** - Acceso a su información personal y entrenamientos
4. **Personal Médico** - Gestión de información médica y nutricional
5. **Padres de Familia** - Seguimiento de hijos menores de edad
6. **Directivos** - Reportes ejecutivos y análisis estratégicos

### MVP Definido

- **Alcance**: 2 clubes, ~100 usuarios totales (50 atletas por club)
- **Funcionalidad core**: Calendario de entrenamientos + gestión básica de atletas
- **Duración**: 3-4 meses de desarrollo
- **Métricas de éxito**: 80% adopción por entrenadores, reducción 50% tiempo administrativo

## Criterios de Validación

- [ ] Problema de negocio claramente articulado
- [ ] 7 módulos principales identificados con funcionalidades específicas
- [ ] 6 tipos de usuarios con roles y permisos diferenciados
- [ ] User stories específicas para cada tipo de usuario
- [ ] MVP cuantificado (usuarios, clubes, funcionalidades)
- [ ] Criterios de éxito medibles y alcanzables
- [ ] Roadmap post-MVP con al menos 3 fases de crecimiento

## Conexión con Siguientes Prompts

Los resultados de este prompt serán utilizados en:

- **Prompt 2**: Selección de stack tecnológico basado en requerimientos
- **Prompt 3**: Diseño de arquitectura que soporte los módulos definidos
- **Prompts 4-6**: Modelado de datos basado en entidades identificadas

## Notas de Implementación

- Mantener foco en entrenadores como usuarios centrales
- Calendario de entrenamientos como feature principal
- Preparar para multi-tenancy desde el diseño inicial
- Considerar escalabilidad a otros deportes en la arquitectura
