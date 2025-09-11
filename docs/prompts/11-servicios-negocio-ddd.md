# 🎯 Prompt 11: Servicios de Negocio con DDD

## Contexto

Con la estructura de microservicios y controladores implementados, necesitamos desarrollar la capa de lógica de negocio usando Domain-Driven Design (DDD) para el Sports Service, que será el corazón funcional de la plataforma deportiva.

## Objetivo del Prompt

Implementar una arquitectura Domain-Driven Design completa para el Sports Domain que incluya análisis de rendimiento, recomendaciones de entrenamiento y seguimiento de progreso con lógica de negocio rica y expresiva.

## Prompt Completo

````
Implementa la arquitectura Domain-Driven Design completa para el Sports Domain de mi plataforma deportiva:

CONTEXTO DEL SPORTS DOMAIN:
- Gestión de atletas, entrenamientos y competencias como core business
- Análisis de rendimiento intermedio con tendencias y comparaciones
- Métricas flexibles en JSONB (tiempo, distancia, frecuencia cardíaca, intensidad)
- Lógica de asignación de entrenamientos (individual/grupal/club completo)
- Cálculos de progreso y recomendaciones básicas para entrenadores
- Detección de récords personales y logros

ARQUITECTURA DDD REQUERIDA:

apps/sports-service/src/
├── domain/
│   ├── entities/
│   │   ├── athlete.entity.ts              # Atleta con business logic
│   │   ├── training-session.entity.ts     # Sesión de entrenamiento
│   │   ├── performance-record.entity.ts   # Registro de rendimiento
│   │   ├── competition.entity.ts          # Competencia
│   │   └── training-assignment.entity.ts  # Asignación atleta-entrenamiento
│   ├── value-objects/
│   │   ├── personal-best.vo.ts            # Récord personal inmutable
│   │   ├── training-metrics.vo.ts         # Métricas de entrenamiento
│   │   ├── performance-trend.vo.ts        # Tendencia de rendimiento
│   │   ├── swimming-time.vo.ts            # Tiempo de natación específico
│   │   └── training-intensity.vo.ts       # Intensidad de entrenamiento
│   ├── repositories/
│   │   ├── athlete.repository.ts          # Interfaz para persistencia
│   │   ├── training.repository.ts         # Interfaz para entrenamientos
│   │   ├── performance.repository.ts      # Interfaz para performance
│   │   └── competition.repository.ts      # Interfaz para competencias
│   ├── services/
│   │   ├── performance-analysis.service.ts    # Análisis de rendimiento
│   │   ├── training-recommendation.service.ts # Recomendaciones de entrenamiento
│   │   ├── progress-tracking.service.ts       # Seguimiento de progreso
│   │   ├── personal-best-detector.service.ts  # Detección de récords
│   │   └── team-analytics.service.ts          # Análisis a nivel de equipo
│   └── events/
│       ├── athlete-registered.event.ts        # Evento: atleta registrado
│       ├── training-completed.event.ts        # Evento: entrenamiento completado
│       ├── personal-best-achieved.event.ts    # Evento: récord personal
│       ├── performance-recorded.event.ts      # Evento: rendimiento registrado
│       └── training-assigned.event.ts         # Evento: entrenamiento asignado
├── infrastructure/
│   ├── repositories/
│   │   ├── prisma-athlete.repository.ts       # Implementación Prisma
│   │   ├── prisma-training.repository.ts      # Implementación Prisma
│   │   ├── prisma-performance.repository.ts   # Implementación Prisma
│   │   └── prisma-competition.repository.ts   # Implementación Prisma
│   ├── external/
│   │   ├── notification.service.ts            # Servicio externo
│   │   ├── calendar.service.ts                # Integración calendario
│   │   └── analytics.service.ts               # Servicio de analytics
│   └── persistence/
│       ├── mappers/                           # Domain ↔ Prisma mappers
│       └── schemas/                           # Validadores JSONB
├── application/
│   ├── commands/
│   │   ├── create-athlete.command.ts          # Comando: crear atleta
│   │   ├── assign-training.command.ts         # Comando: asignar entrenamiento
│   │   ├── record-performance.command.ts      # Comando: registrar rendimiento
│   │   ├── update-training-plan.command.ts    # Comando: actualizar plan
│   │   └── register-competition-result.command.ts # Comando: resultado competencia
│   ├── queries/
│   │   ├── get-athlete-performance.query.ts   # Query: rendimiento atleta
│   │   ├── get-training-history.query.ts      # Query: historial entrenamientos
│   │   ├── get-performance-trends.query.ts    # Query: tendencias rendimiento
│   │   ├── get-team-analytics.query.ts        # Query: analytics del equipo
│   │   └── get-competition-results.query.ts   # Query: resultados competencias
│   ├── handlers/
│   │   ├── commands/
│   │   │   ├── create-athlete.handler.ts      # Handler crear atleta
│   │   │   ├── assign-training.handler.ts     # Handler asignar entrenamiento
│   │   │   └── record-performance.handler.ts  # Handler registrar rendimiento
│   │   ├── queries/
│   │   │   ├── performance-analysis.handler.ts # Handler análisis rendimiento
│   │   │   ├── training-history.handler.ts     # Handler historial
│   │   │   └── team-analytics.handler.ts       # Handler analytics equipo
│   │   └── events/
│   │       ├── performance-recorded.handler.ts # Handler evento rendimiento
│   │       ├── training-completed.handler.ts   # Handler entrenamiento completado
│   │       └── personal-best.handler.ts        # Handler récord personal
│   └── dto/
│       ├── commands/                          # DTOs para comandos
│       ├── queries/                           # DTOs para queries
│       └── responses/                         # DTOs para respuestas

LÓGICA DE NEGOCIO ESPECÍFICA:

1. **Performance Analysis Service**:
   - Cálculo de tendencias de mejora/declive por métrica
   - Comparación con promedios del club y categoría
   - Detección automática de récords personales
   - Análisis de consistency en entrenamientos
   - Identificación de fortalezas y áreas de mejora
   - Cálculo de performance index por atleta

2. **Training Recommendation Service**:
   - Sugerencias de entrenamientos basadas en performance history
   - Ajustes de intensidad según progreso individual
   - Detección de sobreentrenamiento (overtraining)
   - Recomendaciones de descanso y recuperación
   - Planificación de periodización básica
   - Adaptación automática de cargas de trabajo

3. **Progress Tracking Service**:
   - Tracking de objetivos a corto, medio y largo plazo
   - Métricas de mejora por período temporal
   - Comparación entre atletas (anonimizada para motivación)
   - Predicción básica de rendimiento futuro
   - Análisis de adherencia a plan de entrenamiento
   - Generación de reportes de progreso automáticos

4. **Personal Best Detector Service**:
   - Detección automática de nuevos récords personales
   - Validación de condiciones para récords oficiales
   - Tracking de mejoras marginales significativas
   - Notificación automática de logros
   - Historial completo de récords por disciplina

5. **Team Analytics Service**:
   - Análisis agregado de rendimiento del equipo
   - Identificación de atletas destacados por período
   - Métricas de participación y asistencia
   - Comparación de rendimiento entre grupos de entrenamiento
   - Efectividad de diferentes tipos de entrenamiento

CARACTERÍSTICAS TÉCNICAS AVANZADAS:

**Rich Domain Entities**:
```typescript
class Athlete extends AggregateRoot {
  private constructor(
    private readonly id: AthleteId,
    private profile: AthleteProfile,
    private performanceHistory: PerformanceRecord[],
    private currentTrainingPlan: TrainingPlan
  ) {}

  recordPerformance(metrics: TrainingMetrics, sessionId: TrainingSessionId): PerformanceRecord {
    const record = PerformanceRecord.create(this.id, metrics, sessionId);
    this.performanceHistory.push(record);

    // Business logic: check for personal best
    if (this.isPersonalBest(metrics)) {
      this.apply(new PersonalBestAchievedEvent(this.id, metrics));
    }

    return record;
  }

  calculateProgressTrend(period: TimePeriod): PerformanceTrend {
    // Complex business logic for trend calculation
  }

  canBeAssignedToTraining(training: TrainingSession): boolean {
    // Business rules for training assignment
  }
}
````

**Value Objects Inmutables**:

```typescript
class SwimmingTime extends ValueObject {
  constructor(
    private readonly minutes: number,
    private readonly seconds: number,
    private readonly milliseconds: number,
    private readonly distance: Distance,
    private readonly stroke: SwimmingStroke
  ) {
    this.validate();
  }

  toTotalMilliseconds(): number {
    return this.minutes * 60 * 1000 + this.seconds * 1000 + this.milliseconds;
  }

  compareWith(other: SwimmingTime): TimeComparison {
    if (!this.isSameDistance(other)) {
      throw new Error("Cannot compare times for different distances");
    }
    // Comparison logic
  }

  calculatePace(distance: Distance): Pace {
    // Pace calculation logic
  }
}
```

**Domain Services con Lógica Compleja**:

```typescript
@Injectable()
export class PerformanceAnalysisService {
  calculateTrend(
    athlete: Athlete,
    metric: PerformanceMetric,
    period: TimePeriod
  ): PerformanceTrend {
    const records = athlete.getPerformanceRecords(period);

    // Advanced analytics: linear regression, moving averages, etc.
    const trendData = this.applyLinearRegression(records, metric);
    const consistency = this.calculateConsistency(records, metric);
    const improvement = this.calculateImprovementRate(records, metric);

    return PerformanceTrend.create(trendData, consistency, improvement);
  }

  detectAnomalies(athlete: Athlete): PerformanceAnomalies {
    // Statistical analysis to detect unusual performance patterns
  }

  generateRecommendations(athlete: Athlete): TrainingRecommendations {
    const weakAreas = this.identifyWeakAreas(athlete);
    const strengths = this.identifyStrengths(athlete);
    const trainingLoad = this.assessCurrentTrainingLoad(athlete);

    return TrainingRecommendations.create(weakAreas, strengths, trainingLoad);
  }
}
```

**CQRS Pattern Implementation**:

```typescript
// Command Handler
@CommandHandler(RecordPerformanceCommand)
export class RecordPerformanceHandler
  implements ICommandHandler<RecordPerformanceCommand>
{
  constructor(
    private athleteRepository: AthleteRepository,
    private performanceAnalysisService: PerformanceAnalysisService,
    private eventBus: EventBus
  ) {}

  async execute(command: RecordPerformanceCommand): Promise<void> {
    const athlete = await this.athleteRepository.findById(command.athleteId);

    const performanceRecord = athlete.recordPerformance(
      command.metrics,
      command.trainingSessionId
    );

    await this.athleteRepository.save(athlete);

    // Publish events for side effects
    athlete.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });
  }
}

// Query Handler
@QueryHandler(GetPerformanceTrendsQuery)
export class GetPerformanceTrendsHandler
  implements IQueryHandler<GetPerformanceTrendsQuery>
{
  constructor(
    private performanceAnalysisService: PerformanceAnalysisService,
    private athleteRepository: AthleteRepository
  ) {}

  async execute(
    query: GetPerformanceTrendsQuery
  ): Promise<PerformanceTrendsDto> {
    const athlete = await this.athleteRepository.findById(query.athleteId);
    const trends = await this.performanceAnalysisService.calculateTrends(
      athlete,
      query.metrics,
      query.period
    );

    return PerformanceTrendsDto.fromDomain(trends);
  }
}
```

CASOS DE USO CRÍTICOS A IMPLEMENTAR:

**Scenario 1: Registro de Rendimiento Post-Entrenamiento**

- Atleta completa entrenamiento → Sistema registra métricas automáticamente
- Detección de récord personal → Notificación inmediata al atleta y entrenador
- Actualización de tendencias → Recálculo de recomendaciones de entrenamiento

**Scenario 2: Planificación de Entrenamiento Personalizado**

- Entrenador solicita recomendaciones → Sistema analiza historial del atleta
- Generación de plan adaptativo → Consideración de fortalezas y debilidades
- Asignación automática → Notificación al atleta con detalles del entrenamiento

**Scenario 3: Análisis de Progreso del Equipo**

- Entrenador solicita reporte mensual → Sistema agrega datos de todos los atletas
- Identificación de tendencias grupales → Comparación con objetivos del club
- Generación de insights → Recomendaciones de ajustes en metodología de entrenamiento

**Scenario 4: Detección de Sobreentrenamiento**

- Sistema monitorea cargas de trabajo → Análisis de patrones de rendimiento
- Detección de declive consistente → Alerta automática al entrenador
- Recomendación de ajuste → Sugerencia de período de recuperación

ENTREGABLES REQUERIDOS:

1. **Domain Entities** con business logic encapsulada y rica
2. **Value Objects** inmutables para conceptos deportivos específicos
3. **Repository interfaces** y sus implementaciones con Prisma
4. **Domain Services** con lógica de análisis y recomendaciones
5. **Application Handlers** implementando CQRS pattern
6. **Domain Events** y sus handlers para efectos secundarios
7. **Mappers** entre domain models y persistence models
8. **Unit tests** comprehensivos para toda la lógica de dominio
9. **Integration tests** para repositories y handlers
10. **Performance benchmarks** para queries complejas de análisis

RESTRICCIONES Y CONSIDERACIONES:

- **Performance**: Optimizar queries de análisis para manejar grandes volúmenes de datos históricos
- **Escalabilidad**: Diseñar para soportar múltiples deportes sin refactoring mayor
- **Extensibilidad**: Facilitar adición de nuevas métricas y tipos de análisis
- **Testabilidad**: Lógica de dominio completamente testeable sin dependencias externas
- **Maintainability**: Código expresivo que refleje el lenguaje ubícuo del dominio deportivo

MÉTRICAS DE ÉXITO:

- Cobertura de tests > 90% en domain layer
- Tiempo de respuesta < 200ms para análisis básicos
- Facilidad de adición de nuevos tipos de entrenamiento
- Claridad del código para stakeholders no técnicos
- Capacidad de manejar 1000+ registros de rendimiento por atleta

Implementa un modelo de dominio rico, expresivo y mantenible que capture toda la complejidad del negocio deportivo usando las mejores prácticas de DDD.

````

## Resultados Esperados

### Domain Entities Ricas
```typescript
// domain/entities/athlete.entity.ts
export class Athlete extends AggregateRoot {
  private constructor(
    private readonly id: AthleteId,
    private profile: AthleteProfile,
    private performanceHistory: PerformanceRecord[],
    private currentGoals: TrainingGoal[],
    private clubId: ClubId
  ) {
    super();
  }

  static create(
    profile: AthleteProfile,
    clubId: ClubId
  ): Athlete {
    const athlete = new Athlete(
      AthleteId.generate(),
      profile,
      [],
      [],
      clubId
    );

    athlete.apply(new AthleteRegisteredEvent(athlete.id, athlete.clubId));
    return athlete;
  }

  recordPerformance(
    metrics: TrainingMetrics,
    sessionId: TrainingSessionId,
    recordedAt: Date = new Date()
  ): PerformanceRecord {
    const record = PerformanceRecord.create(
      this.id,
      metrics,
      sessionId,
      recordedAt
    );

    this.performanceHistory.push(record);

    // Business rule: Check for personal best
    if (this.isPersonalBest(metrics)) {
      const personalBest = PersonalBest.create(this.id, metrics, recordedAt);
      this.apply(new PersonalBestAchievedEvent(this.id, personalBest));
    }

    // Business rule: Check for goal achievement
    const achievedGoals = this.checkGoalAchievements(metrics);
    achievedGoals.forEach(goal => {
      this.apply(new TrainingGoalAchievedEvent(this.id, goal));
    });

    return record;
  }

  assignToTraining(training: TrainingSession): TrainingAssignment {
    // Business rules validation
    if (!this.canBeAssignedToTraining(training)) {
      throw new CannotAssignTrainingError(this.id, training.id);
    }

    const assignment = TrainingAssignment.create(this.id, training.id);
    this.apply(new TrainingAssignedEvent(this.id, training.id));

    return assignment;
  }

  calculateProgressTrend(
    metric: PerformanceMetric,
    period: TimePeriod
  ): PerformanceTrend {
    const relevantRecords = this.getPerformanceRecordsForPeriod(period)
      .filter(record => record.hasMetric(metric));

    if (relevantRecords.length < 3) {
      return PerformanceTrend.insufficient();
    }

    return PerformanceTrend.calculate(relevantRecords, metric);
  }

  private isPersonalBest(metrics: TrainingMetrics): boolean {
    // Complex business logic for personal best detection
    return this.performanceHistory
      .filter(record => record.isSameExerciseType(metrics))
      .every(record => metrics.isBetterThan(record.metrics));
  }

  private canBeAssignedToTraining(training: TrainingSession): boolean {
    // Business rules: age group, skill level, medical restrictions, etc.
    return training.isAppropriateForAthlete(this.profile) &&
           !this.hasConflictingTraining(training.scheduledDate) &&
           !this.hasMedicalRestrictions(training.type);
  }
}
````

### Value Objects para Conceptos Deportivos

```typescript
// domain/value-objects/swimming-time.vo.ts
export class SwimmingTime extends ValueObject {
  constructor(
    private readonly totalMilliseconds: number,
    private readonly distance: Distance,
    private readonly stroke: SwimmingStroke,
    private readonly poolLength: PoolLength
  ) {
    super();
    this.validate();
  }

  static fromTimeComponents(
    minutes: number,
    seconds: number,
    milliseconds: number,
    distance: Distance,
    stroke: SwimmingStroke,
    poolLength: PoolLength = PoolLength.LONG_COURSE
  ): SwimmingTime {
    const totalMs = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
    return new SwimmingTime(totalMs, distance, stroke, poolLength);
  }

  isFasterThan(other: SwimmingTime): boolean {
    this.ensureComparable(other);
    return this.totalMilliseconds < other.totalMilliseconds;
  }

  calculatePace(): Pace {
    const pacePerLap =
      this.totalMilliseconds / this.distance.laps(this.poolLength);
    return new Pace(pacePerLap, this.poolLength);
  }

  calculateSplit(splitDistance: Distance): SwimmingTime {
    if (splitDistance.isGreaterThan(this.distance)) {
      throw new InvalidSplitError(splitDistance, this.distance);
    }

    const splitMs =
      (this.totalMilliseconds * splitDistance.meters) / this.distance.meters;
    return new SwimmingTime(
      splitMs,
      splitDistance,
      this.stroke,
      this.poolLength
    );
  }

  toDisplayString(): string {
    const minutes = Math.floor(this.totalMilliseconds / 60000);
    const seconds = Math.floor((this.totalMilliseconds % 60000) / 1000);
    const ms = this.totalMilliseconds % 1000;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms
        .toString()
        .padStart(3, "0")}`;
    }
    return `${seconds}.${ms.toString().padStart(3, "0")}`;
  }

  private ensureComparable(other: SwimmingTime): void {
    if (
      !this.distance.equals(other.distance) ||
      !this.stroke.equals(other.stroke) ||
      !this.poolLength.equals(other.poolLength)
    ) {
      throw new IncomparableTimesError(this, other);
    }
  }
}
```

### Domain Services con Análisis Complejo

```typescript
// domain/services/performance-analysis.service.ts
@Injectable()
export class PerformanceAnalysisService {
  calculateComprehensiveTrend(
    athlete: Athlete,
    metric: PerformanceMetric,
    period: TimePeriod
  ): PerformanceTrend {
    const records = athlete.getPerformanceRecordsForPeriod(period);

    if (records.length < 5) {
      return PerformanceTrend.insufficient();
    }

    // Linear regression for trend detection
    const trendSlope = this.calculateLinearRegression(records, metric);

    // Consistency analysis
    const consistency = this.calculateConsistencyIndex(records, metric);

    // Improvement rate calculation
    const improvementRate = this.calculateImprovementRate(records, metric);

    // Recent form analysis (last 20% of records)
    const recentFormIndex = this.calculateRecentForm(records, metric);

    return PerformanceTrend.create({
      slope: trendSlope,
      consistency: consistency,
      improvementRate: improvementRate,
      recentForm: recentFormIndex,
      confidence: this.calculateConfidence(records.length, consistency),
    });
  }

  generateTrainingRecommendations(athlete: Athlete): TrainingRecommendations {
    const currentForm = this.assessCurrentForm(athlete);
    const strengthsAndWeaknesses = this.analyzeStrengthsAndWeaknesses(athlete);
    const trainingLoad = this.assessTrainingLoad(athlete);
    const recoveryNeeds = this.assessRecoveryNeeds(athlete);

    return TrainingRecommendations.create({
      priorityAreas: strengthsAndWeaknesses.weaknesses,
      maintenanceAreas: strengthsAndWeaknesses.strengths,
      recommendedIntensity: this.calculateOptimalIntensity(
        currentForm,
        trainingLoad
      ),
      recoveryDays: recoveryNeeds.recommendedDays,
      specificExercises: this.suggestSpecificExercises(strengthsAndWeaknesses),
      periodizationPhase: this.determinePeriodizationPhase(athlete),
    });
  }

  detectPerformanceAnomalies(athlete: Athlete): PerformanceAnomalies {
    const recentRecords = athlete.getRecentPerformanceRecords(30); // Last 30 days
    const baseline = this.calculateBaselinePerformance(athlete);

    const anomalies: PerformanceAnomaly[] = [];

    recentRecords.forEach((record) => {
      const deviationScore = this.calculateDeviationScore(record, baseline);

      if (deviationScore > ANOMALY_THRESHOLD) {
        const anomaly = PerformanceAnomaly.create({
          record,
          deviationScore,
          type: this.classifyAnomalyType(record, baseline),
          severity: this.assessAnomalySeverity(deviationScore),
          possibleCauses: this.suggestPossibleCauses(record, baseline),
        });

        anomalies.push(anomaly);
      }
    });

    return PerformanceAnomalies.create(anomalies);
  }

  compareWithPeers(
    athlete: Athlete,
    comparisonGroup: ComparisonGroup
  ): PeerComparison {
    const athleteStats = this.calculateAthleteStatistics(athlete);
    const groupStats = this.calculateGroupStatistics(comparisonGroup);

    return PeerComparison.create({
      percentileRanking: this.calculatePercentile(athleteStats, groupStats),
      strengthsRelativeToPeers: this.identifyRelativeStrengths(
        athleteStats,
        groupStats
      ),
      improvementAreas: this.identifyImprovementAreasVsPeers(
        athleteStats,
        groupStats
      ),
      motivationalInsights: this.generateMotivationalInsights(
        athleteStats,
        groupStats
      ),
    });
  }

  private calculateLinearRegression(
    records: PerformanceRecord[],
    metric: PerformanceMetric
  ): number {
    // Implementation of linear regression algorithm
    const points = records.map((record, index) => ({
      x: index,
      y: record.getMetricValue(metric),
    }));

    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
}
```

### CQRS Handlers

```typescript
// application/handlers/commands/record-performance.handler.ts
@CommandHandler(RecordPerformanceCommand)
export class RecordPerformanceHandler
  implements ICommandHandler<RecordPerformanceCommand>
{
  constructor(
    private readonly athleteRepository: AthleteRepository,
    private readonly trainingSessionRepository: TrainingSessionRepository,
    private readonly performanceAnalysisService: PerformanceAnalysisService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  async execute(
    command: RecordPerformanceCommand
  ): Promise<PerformanceRecordId> {
    this.logger.log(`Recording performance for athlete ${command.athleteId}`);

    // Load aggregates
    const athlete = await this.athleteRepository.findById(command.athleteId);
    if (!athlete) {
      throw new AthleteNotFoundError(command.athleteId);
    }

    const trainingSession = await this.trainingSessionRepository.findById(
      command.trainingSessionId
    );
    if (!trainingSession) {
      throw new TrainingSessionNotFoundError(command.trainingSessionId);
    }

    // Validate business rules
    if (!trainingSession.isActiveForPerformanceRecording()) {
      throw new TrainingSessionNotActiveError(command.trainingSessionId);
    }

    // Execute domain logic
    const performanceRecord = athlete.recordPerformance(
      TrainingMetrics.fromDto(command.metrics),
      command.trainingSessionId
    );

    // Persist changes
    await this.athleteRepository.save(athlete);

    // Publish domain events
    const events = athlete.getUncommittedEvents();
    events.forEach((event) => this.eventBus.publish(event));
    athlete.markEventsAsCommitted();

    // Trigger analysis (async)
    this.performanceAnalysisService.analyzePerformanceAsync(
      athlete.id,
      performanceRecord.id
    );

    this.logger.log(
      `Performance recorded successfully: ${performanceRecord.id}`
    );
    return performanceRecord.id;
  }
}

// application/handlers/queries/get-performance-trends.handler.ts
@QueryHandler(GetPerformanceTrendsQuery)
export class GetPerformanceTrendsHandler
  implements IQueryHandler<GetPerformanceTrendsQuery>
{
  constructor(
    private readonly athleteRepository: AthleteRepository,
    private readonly performanceAnalysisService: PerformanceAnalysisService
  ) {}

  async execute(
    query: GetPerformanceTrendsQuery
  ): Promise<PerformanceTrendsResponseDto> {
    const athlete = await this.athleteRepository.findById(query.athleteId);
    if (!athlete) {
      throw new AthleteNotFoundError(query.athleteId);
    }

    const trends = await Promise.all(
      query.metrics.map(async (metric) => {
        const trend =
          await this.performanceAnalysisService.calculateComprehensiveTrend(
            athlete,
            metric,
            TimePeriod.fromDto(query.period)
          );

        return {
          metric: metric.toString(),
          trend: PerformanceTrendDto.fromDomain(trend),
          recommendations: await this.generateMetricSpecificRecommendations(
            athlete,
            metric,
            trend
          ),
        };
      })
    );

    return PerformanceTrendsResponseDto.create({
      athleteId: query.athleteId,
      period: query.period,
      trends,
      overallAssessment: this.generateOverallAssessment(trends),
      generatedAt: new Date(),
    });
  }

  private async generateMetricSpecificRecommendations(
    athlete: Athlete,
    metric: PerformanceMetric,
    trend: PerformanceTrend
  ): Promise<MetricRecommendationDto[]> {
    // Generate specific recommendations based on metric and trend
    return this.performanceAnalysisService.generateMetricRecommendations(
      athlete,
      metric,
      trend
    );
  }
}
```

## Criterios de Validación

- [ ] Domain entities con business logic rica e encapsulada
- [ ] Value objects inmutables para conceptos deportivos específicos
- [ ] Repository pattern implementado con interfaces claras
- [ ] Domain services con lógica de análisis y recomendaciones
- [ ] CQRS pattern implementado con commands y queries separados
- [ ] Domain events para comunicación entre bounded contexts
- [ ] Mappers entre domain models y persistence models
- [ ] Unit tests con >90% cobertura en domain layer
- [ ] Integration tests para repositories y handlers
- [ ] Performance optimizado para análisis de grandes datasets

## Conexión con Siguientes Prompts

Esta implementación DDD será utilizada en:

- **Prompts 12-14**: Frontend consumiendo estas APIs complejas
- **Prompt 15**: Integración completa con análisis en tiempo real
- **Prompt 16**: Testing E2E de flujos de análisis de rendimiento
- **Prompt 17**: Optimización de performance para cálculos complejos

## Consideraciones de Implementación

- Implementar entities básicas primero (Athlete, TrainingSession)
- Agregar value objects específicos del dominio deportivo
- Construir domain services gradualmente con lógica simple
- Expandir análisis y recomendaciones incrementalmente
- Optimizar queries de performance con índices apropriados
- Documentar lenguaje ubícuo del dominio deportivo
- Preparar para extensión a múltiples deportes
