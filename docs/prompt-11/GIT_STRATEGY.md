# Git Strategy for Prompt 11 - DDD Implementation

## 🌿 Branching Strategy

### Branch Structure

```
main (production)
  └── development (stable development)
      └── feature/prompt-11-ddd-implementation (current work)
          ├── feature/prompt-11-phase-1.1-entities
          ├── feature/prompt-11-phase-1.2-value-objects
          ├── feature/prompt-11-phase-1.3-domain-services
          ├── feature/prompt-11-phase-2-repositories
          ├── feature/prompt-11-phase-3-cqrs
          ├── feature/prompt-11-phase-4-integration
          └── feature/prompt-11-phase-5-documentation
```

### Current Branch Status

```bash
Current: development
Next: feature/prompt-11-ddd-implementation
```

---

## 📝 Commit Strategy

### Commit Convention

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `docs`: Documentación
- `chore`: Tareas de mantenimiento
- `perf`: Mejoras de performance

**Scopes para Prompt 11:**

- `domain`: Domain layer (entities, VOs, services)
- `application`: Application layer (CQRS)
- `infrastructure`: Infrastructure layer (repos, mappers)
- `presentation`: Controllers
- `tests`: Tests

---

## 🎯 Commit Plan por Fase

### Phase 0: Planning & Setup ✅

```bash
# COMPLETADO
git checkout -b feature/prompt-11-ddd-implementation
git commit -m "docs(prompt-11): create DDD implementation roadmap and planning docs

- Create comprehensive implementation roadmap
- Add quick reference guide
- Define phases and milestones
- Set success criteria and metrics
- Document git and commit strategy

Refs: #PROMPT-11"
```

### Phase 1.1: Core Domain Entities (6-8 commits)

```bash
# Commit 1: Base classes
feat(domain): add base Entity and AggregateRoot classes

- Implement Entity base class with identity management
- Implement AggregateRoot with domain events support
- Add event tracking and uncommitted events logic
- Add unit tests for base classes

Refs: #PROMPT-11-PHASE-1.1

# Commit 2: Athlete entity foundation
feat(domain): implement Athlete entity with core business logic

- Create Athlete aggregate root
- Implement recordPerformance() method
- Implement assignToTraining() method
- Add business rules validation
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-1.1

# Commit 3: Athlete entity - advanced features
feat(domain): add advanced features to Athlete entity

- Implement calculateProgressTrend() method
- Implement isPersonalBest() detection
- Implement canBeAssignedToTraining() validation
- Add domain events emission
- Add 10 unit tests

Refs: #PROMPT-11-PHASE-1.1

# Commit 4: TrainingSession entity
feat(domain): implement TrainingSession entity

- Create TrainingSession aggregate root
- Implement scheduling and lifecycle methods
- Add state management (SCHEDULED, IN_PROGRESS, COMPLETED)
- Add business rules validation
- Add 12 unit tests

Refs: #PROMPT-11-PHASE-1.1

# Commit 5: PerformanceRecord entity
feat(domain): implement PerformanceRecord entity

- Create PerformanceRecord entity
- Implement metric tracking
- Add comparison methods
- Add 10 unit tests

Refs: #PROMPT-11-PHASE-1.1

# Commit 6: Competition & TrainingAssignment entities
feat(domain): implement Competition and TrainingAssignment entities

- Create Competition entity
- Create TrainingAssignment entity
- Add business rules for both
- Add 10 unit tests

Refs: #PROMPT-11-PHASE-1.1

# Commit 7: Phase 1.1 completion
test(domain): complete test coverage for domain entities

- Add missing edge case tests
- Achieve >90% coverage on entities
- Add integration scenarios
- Update roadmap with completion status

Refs: #PROMPT-11-PHASE-1.1
```

### Phase 1.2: Value Objects (5-7 commits)

```bash
# Commit 1: Base ValueObject
feat(domain): add base ValueObject class with equality

- Implement ValueObject abstract class
- Add equals() and hashCode() methods
- Add immutability guarantees
- Add unit tests

Refs: #PROMPT-11-PHASE-1.2

# Commit 2: SwimmingTime value object
feat(domain): implement SwimmingTime value object

- Create SwimmingTime with validation
- Add time components factory method
- Implement comparison methods (isFasterThan)
- Add pace and split calculations
- Add 20 unit tests

Refs: #PROMPT-11-PHASE-1.2

# Commit 3: PersonalBest and TrainingMetrics
feat(domain): implement PersonalBest and TrainingMetrics VOs

- Create PersonalBest value object
- Create TrainingMetrics value object
- Add JSONB validation for metrics
- Add comparison logic
- Add 18 unit tests

Refs: #PROMPT-11-PHASE-1.2

# Commit 4: PerformanceTrend and TrainingIntensity
feat(domain): implement PerformanceTrend and TrainingIntensity VOs

- Create PerformanceTrend value object
- Create TrainingIntensity value object
- Add trend calculation helpers
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-1.2

# Commit 5: Typed IDs
feat(domain): implement typed ID value objects

- Create AthleteId, TrainingSessionId, etc.
- Add UUID generation and validation
- Ensure type safety across domain
- Add 10 unit tests

Refs: #PROMPT-11-PHASE-1.2

# Commit 6: Additional VOs
feat(domain): implement remaining value objects

- Create Distance, Pace, TimePeriod VOs
- Add validation and business rules
- Add 12 unit tests

Refs: #PROMPT-11-PHASE-1.2

# Commit 7: Phase 1.2 completion
test(domain): complete test coverage for value objects

- Add edge case tests
- Achieve >95% coverage
- Update roadmap

Refs: #PROMPT-11-PHASE-1.2
```

### Phase 1.3: Domain Services (5-6 commits)

```bash
# Commit 1: PerformanceAnalysisService foundation
feat(domain): implement PerformanceAnalysisService foundation

- Create service with core analysis methods
- Implement calculateComprehensiveTrend()
- Add linear regression algorithm
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-1.3

# Commit 2: PerformanceAnalysisService advanced
feat(domain): add advanced analysis to PerformanceAnalysisService

- Implement detectAnomalies()
- Implement generateRecommendations()
- Implement compareWithPeers()
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-1.3

# Commit 3: TrainingRecommendationService
feat(domain): implement TrainingRecommendationService

- Create service with recommendation logic
- Implement generatePersonalizedPlan()
- Implement detectOvertraining()
- Add 20 unit tests

Refs: #PROMPT-11-PHASE-1.3

# Commit 4: ProgressTracking and PersonalBestDetector
feat(domain): implement ProgressTracking and PersonalBestDetector services

- Create ProgressTrackingService
- Create PersonalBestDetectorService
- Implement goal tracking and detection logic
- Add 20 unit tests

Refs: #PROMPT-11-PHASE-1.3

# Commit 5: TeamAnalyticsService
feat(domain): implement TeamAnalyticsService

- Create service with team-level analytics
- Implement aggregated performance analysis
- Add participation tracking
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-1.3

# Commit 6: Phase 1.3 completion
test(domain): complete test coverage for domain services

- Add integration tests between services
- Achieve >85% coverage
- Update roadmap with Phase 1 completion

Refs: #PROMPT-11-PHASE-1.3
```

### Phase 2: Repository Pattern (4-5 commits)

```bash
# Commit 1: Repository interfaces
feat(domain): add repository interfaces

- Create IRepository base interface
- Create IAthleteRepository interface
- Create other repository interfaces
- Document contract expectations

Refs: #PROMPT-11-PHASE-2

# Commit 2: Prisma repository implementations
feat(infrastructure): implement Prisma repositories

- Create PrismaAthleteRepository
- Create other Prisma repositories
- Add error handling
- Add 15 integration tests

Refs: #PROMPT-11-PHASE-2

# Commit 3: Domain mappers
feat(infrastructure): implement domain-persistence mappers

- Create bidirectional mappers
- Handle value objects mapping
- Handle relationships mapping
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-2

# Commit 4: Repository integration
test(infrastructure): add integration tests for repositories

- Test with real database
- Test complex queries
- Test transaction handling
- Add 20 integration tests

Refs: #PROMPT-11-PHASE-2

# Commit 5: Phase 2 completion
docs(prompt-11): complete Phase 2 documentation

- Update roadmap
- Document repository patterns used
- Add usage examples

Refs: #PROMPT-11-PHASE-2
```

### Phase 3: CQRS (8-10 commits)

```bash
# Commit 1: CQRS setup
chore(application): install and configure @nestjs/cqrs

- Install @nestjs/cqrs package
- Configure CommandBus, QueryBus, EventBus
- Update modules configuration

Refs: #PROMPT-11-PHASE-3

# Commit 2: Commands
feat(application): implement write commands

- Create command classes
- Add validation with class-validator
- Document command contracts

Refs: #PROMPT-11-PHASE-3.1

# Commit 3: Command handlers (part 1)
feat(application): implement core command handlers

- CreateAthleteHandler
- AssignTrainingHandler
- RecordPerformanceHandler
- Add 20 unit tests

Refs: #PROMPT-11-PHASE-3.1

# Commit 4: Command handlers (part 2)
feat(application): implement remaining command handlers

- UpdateTrainingPlanHandler
- RegisterCompetitionResultHandler
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-3.1

# Commit 5: Queries
feat(application): implement read queries

- Create query classes
- Add query parameters and filters
- Document query contracts

Refs: #PROMPT-11-PHASE-3.2

# Commit 6: Query handlers
feat(application): implement query handlers

- GetAthletePerformanceHandler
- GetTrainingHistoryHandler
- GetPerformanceTrendsHandler
- GetTeamAnalyticsHandler
- Add 25 unit tests

Refs: #PROMPT-11-PHASE-3.2

# Commit 7: Domain events
feat(domain): define domain events

- Create event classes
- Document event payloads
- Add event metadata

Refs: #PROMPT-11-PHASE-3.3

# Commit 8: Event handlers
feat(application): implement event handlers

- PerformanceRecordedHandler
- PersonalBestAchievedHandler
- TrainingCompletedHandler
- Add 15 unit tests

Refs: #PROMPT-11-PHASE-3.3

# Commit 9: CQRS integration tests
test(application): add CQRS integration tests

- Test command-query separation
- Test event propagation
- Add 20 integration tests

Refs: #PROMPT-11-PHASE-3

# Commit 10: Phase 3 completion
docs(prompt-11): complete Phase 3 documentation

- Update roadmap
- Document CQRS patterns
- Add usage examples

Refs: #PROMPT-11-PHASE-3
```

### Phase 4: Integration & Refactoring (4-5 commits)

```bash
# Commit 1: Refactor controllers
refactor(presentation): update controllers to use CQRS

- Refactor AthletesController
- Refactor TrainingController
- Refactor PerformanceController
- Update Swagger documentation

Refs: #PROMPT-11-PHASE-4.1

# Commit 2: Resolve TODOs
refactor(sports-service): resolve all pending TODOs

- Clean up competitions.service.ts (6 TODOs)
- Clean up performance.service.ts (2 TODOs)
- Clean up training.service.ts (1 TODO)
- Remove or refactor old services

Refs: #PROMPT-11-PHASE-4.2

# Commit 3: E2E tests (part 1)
test(e2e): implement athlete performance flow tests

- Create athlete → assign training → record performance
- Test personal best detection
- Test full workflow end-to-end

Refs: #PROMPT-11-PHASE-4.3

# Commit 4: E2E tests (part 2)
test(e2e): implement remaining E2E tests

- Training assignment flow
- Competition registration flow
- Performance trend analysis flow
- Add 15 E2E tests total

Refs: #PROMPT-11-PHASE-4.3

# Commit 5: Phase 4 completion
docs(prompt-11): complete Phase 4 documentation

- Update roadmap
- Document integration approach
- Celebrate refactoring completion

Refs: #PROMPT-11-PHASE-4
```

### Phase 5: Documentation & Optimization (3-4 commits)

```bash
# Commit 1: Architecture documentation
docs(prompt-11): create comprehensive architecture documentation

- ARCHITECTURE.md with diagrams
- DOMAIN_MODEL.md with entity relationships
- Document bounded contexts

Refs: #PROMPT-11-PHASE-5

# Commit 2: API examples and testing guide
docs(prompt-11): add API examples and testing strategy

- API_EXAMPLES.md with curl/REST examples
- TESTING_STRATEGY.md with testing patterns
- Add ubiquitous language glossary

Refs: #PROMPT-11-PHASE-5

# Commit 3: Performance optimization
perf(sports-service): optimize queries and add caching

- Add database indexes
- Implement strategic caching
- Optimize complex analysis queries
- Profile and document improvements

Refs: #PROMPT-11-PHASE-5

# Commit 4: Phase 5 and Prompt 11 completion
docs(prompt-11): finalize Prompt 11 implementation

- Mark all phases as complete
- Update final metrics and coverage
- Create COMPLETION_REPORT.md
- Celebrate successful DDD implementation! 🎉

Refs: #PROMPT-11-PHASE-5
```

---

## 🔄 Merge Strategy

### After Each Phase

```bash
# Example for Phase 1.1
git checkout feature/prompt-11-ddd-implementation
git merge feature/prompt-11-phase-1.1-entities
git push origin feature/prompt-11-ddd-implementation

# Run tests before merge
npm test
npm run test:cov

# Update roadmap
# Update QUICK_REFERENCE.md progress bars
```

### After Prompt 11 Complete

```bash
# Create PR to development
git checkout development
git merge feature/prompt-11-ddd-implementation

# Final validation
npm run test:cov  # Verify >85% coverage
npm run lint      # Verify no lint errors
npm run build     # Verify build succeeds

# Push to development
git push origin development

# Create release tag
git tag -a v2.0.0-prompt11 -m "Complete DDD implementation for Sports Service"
git push origin v2.0.0-prompt11
```

---

## 📊 Commit Statistics Goal

### Target Metrics

- **Total commits:** 35-45
- **Average commit size:** 200-400 lines
- **Files per commit:** 5-15 files
- **Test coverage increase:** 45 → 400+ tests

### Quality Checks Before Each Commit

```bash
# Run these before committing
npm run lint                    # No lint errors
npm test -- --bail             # No test failures
npm run test:cov -- --coverage # Coverage increasing
git status                     # No untracked critical files
```

---

## 🎯 Commit Naming Examples

### Good Commit Messages ✅

```
feat(domain): implement Athlete entity with business logic

- Add recordPerformance() method with personal best detection
- Add assignToTraining() with validation rules
- Add calculateProgressTrend() for analysis
- Emit domain events on state changes
- Add 15 comprehensive unit tests

Closes #42
Refs: #PROMPT-11-PHASE-1.1
```

### Bad Commit Messages ❌

```
# Too vague
Update files

# No context
Add tests

# Too many changes
Implement everything for phase 1
```

---

## 📝 Pre-Commit Checklist

Before each commit, verify:

- [ ] Tests passing (`npm test`)
- [ ] Lint passing (`npm run lint`)
- [ ] Coverage not decreased
- [ ] No console.logs or debugger statements
- [ ] No commented-out code
- [ ] Documentation updated if needed
- [ ] Roadmap updated if phase complete
- [ ] Commit message follows convention

---

## 🔗 Git Workflow Commands

### Daily Workflow

```bash
# Start work
git checkout feature/prompt-11-ddd-implementation
git pull origin feature/prompt-11-ddd-implementation

# Create phase branch
git checkout -b feature/prompt-11-phase-1.1-entities

# Work... commit... commit...

# Before merging back
npm test
npm run lint
npm run test:cov

# Merge to main branch
git checkout feature/prompt-11-ddd-implementation
git merge feature/prompt-11-phase-1.1-entities
git push origin feature/prompt-11-ddd-implementation
```

### View Progress

```bash
# See commit history
git log --oneline --graph

# See stats
git diff --stat origin/development

# See files changed
git diff --name-only origin/development
```

---

**Última Actualización:** 30 de Octubre, 2025  
**Estado:** Ready to start Phase 1.1  
**Próximo Commit:** `feat(domain): add base Entity and AggregateRoot classes`
