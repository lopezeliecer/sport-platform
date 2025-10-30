# DDD Implementation - Quick Reference Guide

## 🚀 Inicio Rápido

### Estado Actual

```
✅ Phase 0: Planning Complete
⏳ Next: Phase 1.1 - Core Domain Entities
```

### Comandos Útiles

```bash
# Ejecutar tests del sports-service
cd apps/sports-service && npm test

# Ejecutar tests con cobertura
cd apps/sports-service && npm run test:cov

# Ejecutar tests en watch mode
cd apps/sports-service && npm run test:watch

# Verificar lint
cd apps/sports-service && npm run lint

# Generar Prisma client
cd libs/shared/database && npx prisma generate

# Correr migraciones
cd libs/shared/database && npx prisma migrate dev
```

---

## 📋 Checklist Rápido por Fase

### Phase 1.1: Domain Entities (2-3h)

- [ ] Base classes: Entity, AggregateRoot
- [ ] Athlete entity + business logic
- [ ] TrainingSession entity
- [ ] PerformanceRecord entity
- [ ] Competition entity
- [ ] TrainingAssignment entity
- [ ] ~50 unit tests

### Phase 1.2: Value Objects (2-3h)

- [ ] Base ValueObject class
- [ ] SwimmingTime VO
- [ ] PersonalBest VO
- [ ] TrainingMetrics VO
- [ ] PerformanceTrend VO
- [ ] Typed IDs (AthleteId, etc.)
- [ ] ~80 unit tests

### Phase 1.3: Domain Services (2-3h)

- [ ] PerformanceAnalysisService
- [ ] TrainingRecommendationService
- [ ] ProgressTrackingService
- [ ] PersonalBestDetectorService
- [ ] TeamAnalyticsService
- [ ] ~100 unit tests

### Phase 2: Repositories (4-5h)

- [ ] Repository interfaces
- [ ] Prisma implementations
- [ ] Domain mappers
- [ ] ~50 integration tests

### Phase 3: CQRS (6-8h)

- [ ] Install @nestjs/cqrs
- [ ] Commands + handlers (10+)
- [ ] Queries + handlers (8+)
- [ ] Domain events + handlers (5+)
- [ ] ~100 tests

### Phase 4: Integration (4-5h)

- [ ] Refactor controllers
- [ ] Resolve TODOs (9 total)
- [ ] E2E tests
- [ ] ~20 tests

### Phase 5: Documentation (2-3h)

- [ ] Architecture docs
- [ ] Domain model diagrams
- [ ] API examples
- [ ] Performance optimization

---

## 🎯 Métricas Objetivo

### Test Coverage

| Layer          | Target   | Current |
| -------------- | -------- | ------- |
| Domain         | >90%     | 0%      |
| Application    | >85%     | 0%      |
| Infrastructure | >80%     | 0%      |
| **Overall**    | **>85%** | **0%**  |

### Test Counts

| Type        | Target   | Current |
| ----------- | -------- | ------- |
| Unit        | 300-350  | 45      |
| Integration | 50-60    | 0       |
| E2E         | 15-20    | 0       |
| **Total**   | **400+** | **45**  |

### Performance Targets

- Simple queries: < 100ms
- Complex analysis: < 500ms
- Bulk operations: < 1000ms

---

## 📁 Estructura de Archivos

### Archivos Clave a Crear

```
apps/sports-service/src/
├── domain/
│   ├── entities/
│   │   ├── base/
│   │   │   ├── entity.ts                    ⬅️ Phase 1.1
│   │   │   └── aggregate-root.ts            ⬅️ Phase 1.1
│   │   ├── athlete.entity.ts                ⬅️ Phase 1.1
│   │   ├── training-session.entity.ts       ⬅️ Phase 1.1
│   │   ├── performance-record.entity.ts     ⬅️ Phase 1.1
│   │   ├── competition.entity.ts            ⬅️ Phase 1.1
│   │   └── training-assignment.entity.ts    ⬅️ Phase 1.1
│   ├── value-objects/
│   │   ├── base/
│   │   │   └── value-object.ts              ⬅️ Phase 1.2
│   │   ├── swimming-time.vo.ts              ⬅️ Phase 1.2
│   │   ├── personal-best.vo.ts              ⬅️ Phase 1.2
│   │   ├── training-metrics.vo.ts           ⬅️ Phase 1.2
│   │   ├── performance-trend.vo.ts          ⬅️ Phase 1.2
│   │   └── [8+ more VOs]                    ⬅️ Phase 1.2
│   ├── repositories/
│   │   ├── base/
│   │   │   └── repository.interface.ts      ⬅️ Phase 2.1
│   │   ├── athlete.repository.ts            ⬅️ Phase 2.1
│   │   └── [3+ more repos]                  ⬅️ Phase 2.1
│   ├── services/
│   │   ├── performance-analysis.service.ts  ⬅️ Phase 1.3
│   │   ├── training-recommendation.service.ts ⬅️ Phase 1.3
│   │   └── [3+ more services]               ⬅️ Phase 1.3
│   └── events/
│       ├── athlete-registered.event.ts      ⬅️ Phase 3.3
│       └── [4+ more events]                 ⬅️ Phase 3.3
├── application/
│   ├── commands/
│   │   ├── create-athlete.command.ts        ⬅️ Phase 3.1
│   │   └── [9+ more commands]               ⬅️ Phase 3.1
│   ├── queries/
│   │   ├── get-athlete-performance.query.ts ⬅️ Phase 3.2
│   │   └── [7+ more queries]                ⬅️ Phase 3.2
│   ├── handlers/
│   │   ├── commands/
│   │   │   ├── create-athlete.handler.ts    ⬅️ Phase 3.1
│   │   │   └── [9+ more handlers]           ⬅️ Phase 3.1
│   │   ├── queries/
│   │   │   ├── get-performance-trends.handler.ts ⬅️ Phase 3.2
│   │   │   └── [7+ more handlers]           ⬅️ Phase 3.2
│   │   └── events/
│   │       └── [5+ event handlers]          ⬅️ Phase 3.3
│   └── dto/
│       ├── commands/                        ⬅️ Phase 3.1
│       ├── queries/                         ⬅️ Phase 3.2
│       └── responses/                       ⬅️ Phase 3.2
└── infrastructure/
    ├── repositories/
    │   ├── prisma-athlete.repository.ts     ⬅️ Phase 2.2
    │   └── [3+ more implementations]        ⬅️ Phase 2.2
    └── persistence/
        └── mappers/
            ├── athlete.mapper.ts            ⬅️ Phase 2.3
            └── [3+ more mappers]            ⬅️ Phase 2.3
```

---

## 🔑 Conceptos Clave DDD

### Entity vs Value Object

- **Entity:** Tiene identidad única (ID), mutable
- **Value Object:** Sin identidad, inmutable, equality por valor

### Aggregate Root

- Garantiza invariantes de negocio
- Punto de entrada para modificaciones
- Emite domain events

### Repository Pattern

- Abstracción de persistencia
- Interfaz en domain layer
- Implementación en infrastructure layer

### CQRS

- **Commands:** Modifican estado (write)
- **Queries:** Solo leen (read)
- Separación de responsabilidades

### Domain Events

- Representan hechos del dominio
- Comunicación entre aggregates
- Triggers para efectos secundarios

---

## 💡 Patrones y Best Practices

### Domain Entity Pattern

```typescript
class Athlete extends AggregateRoot {
  private constructor(/* ... */) {}

  static create(/* ... */): Athlete {
    // Factory method
    const athlete = new Athlete(/* ... */);
    athlete.apply(new AthleteRegisteredEvent(/* ... */));
    return athlete;
  }

  recordPerformance(metrics: TrainingMetrics): PerformanceRecord {
    // Business logic aquí
    if (this.isPersonalBest(metrics)) {
      this.apply(new PersonalBestAchievedEvent(/* ... */));
    }
    return record;
  }
}
```

### Value Object Pattern

```typescript
class SwimmingTime extends ValueObject {
  constructor(
    private readonly totalMs: number,
    private readonly distance: Distance,
  ) {
    super();
    this.validate();
  }

  static fromComponents(min: number, sec: number, ms: number): SwimmingTime {
    return new SwimmingTime(/* ... */);
  }

  isFasterThan(other: SwimmingTime): boolean {
    // Comparison logic
  }
}
```

### Command Handler Pattern

```typescript
@CommandHandler(RecordPerformanceCommand)
class RecordPerformanceHandler implements ICommandHandler<RecordPerformanceCommand> {
  constructor(
    private athleteRepo: IAthleteRepository,
    private eventBus: EventBus,
  ) {}

  async execute(command: RecordPerformanceCommand): Promise<void> {
    const athlete = await this.athleteRepo.findById(command.athleteId);
    athlete.recordPerformance(/* ... */);
    await this.athleteRepo.save(athlete);

    athlete.getUncommittedEvents().forEach((event) => {
      this.eventBus.publish(event);
    });
  }
}
```

---

## ⚠️ Errores Comunes a Evitar

1. **❌ Lógica de negocio en controllers**
   - Controllers solo orquestan
   - Business logic va en entities/domain services

2. **❌ Entities anémicas**
   - Entities deben tener comportamiento
   - No solo getters/setters

3. **❌ Dependencias de infrastructure en domain**
   - Domain debe ser puro
   - Sin referencias a Prisma en domain layer

4. **❌ Value Objects mutables**
   - Deben ser completamente inmutables
   - Sin setters

5. **❌ Repository leaking implementation details**
   - Interfaces deben expresar intención del dominio
   - Sin tipos de Prisma en interfaces

---

## 📊 Progress Tracking

### Overall Progress: 0% Complete

```
Phase 0: ████████████████████ 100% ✅
Phase 1: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 2: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0%
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0%
```

### Test Progress: 45/400+ tests (11%)

```
Unit Tests:        45/350 ░░░░░░░░░░░░░░░░░░░░  13%
Integration Tests:  0/60  ░░░░░░░░░░░░░░░░░░░░   0%
E2E Tests:          0/20  ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 🎓 Learning Resources

### Domain-Driven Design

- [DDD Reference](https://www.domainlanguage.com/ddd/reference/) - Eric Evans
- [Implementing DDD](https://vaughnvernon.com/) - Vaughn Vernon
- [DDD Quickly](https://www.infoq.com/minibooks/domain-driven-design-quickly/) - InfoQ

### CQRS & Event Sourcing

- [CQRS Journey](<https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10)>)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)

### Testing

- [Testing Strategies](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Unit Testing Principles](https://enterprisecraftsmanship.com/posts/unit-testing-principles-practices-patterns/)

---

## 📞 Quick Links

- **Main Roadmap:** [DDD_IMPLEMENTATION_ROADMAP.md](./DDD_IMPLEMENTATION_ROADMAP.md)
- **Current Status:** [CURRENT_STATUS.md](../CURRENT_STATUS.md)
- **Prompt 11 Original:** [11-servicios-negocio-ddd.md](../prompts/11-servicios-negocio-ddd.md)
- **API Gateway Docs:** [../prompt-10/](../prompt-10/)

---

**Última Actualización:** 30 de Octubre, 2025  
**Próxima Fase:** Phase 1.1 - Core Domain Entities  
**Estimated Start:** Inmediato
