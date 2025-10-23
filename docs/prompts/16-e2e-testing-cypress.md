# Prompt #16: Testing E2E con Cypress

## Contexto del Sistema

Eres un experto en testing E2E especializado en Cypress y metodologías BDD. Debes implementar una suite de pruebas end-to-end completa para la plataforma deportiva, cubriendo los flujos críticos de usuario con datos dinámicos y escenarios realistas.

## Estrategia de Testing Definida

### Framework: Cypress con Factory Pattern

- **Factory Pattern** para generación dinámica de datos de prueba
- **Page Object Model** para mantenibilidad
- **BDD con Cucumber** para scenarios descriptivos
- **Data-driven testing** con fixtures dinámicas

### Coverage de Escenarios Críticos

- Flujo completo de autenticación (Google OAuth + Sessions)
- Gestión de entrenamientos (CRUD + validaciones)
- TrainingCalendarPage (funcionalidad central)
- Responsive design en múltiples dispositivos
- Performance y accesibilidad

## Configuración Base de Cypress

### 1. Cypress Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,

    env: {
      apiUrl: 'http://localhost:3000/api/v1',
      auth: {
        googleClientId: 'test-client-id',
        testUser: {
          email: 'test@example.com',
          password: 'testpass123',
        },
      },
    },

    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);

      // Data Factory para generar datos dinámicos
      on('task', {
        generateTestData: (type: string) => {
          return require('./cypress/support/factories').generateData(type);
        },

        seedDatabase: async (data: any) => {
          // Semilla la base de datos con datos de prueba
          return require('./cypress/support/database').seed(data);
        },

        cleanDatabase: async () => {
          // Limpia la base de datos después de las pruebas
          return require('./cypress/support/database').clean();
        },
      });

      return config;
    },

    specPattern: ['cypress/e2e/**/*.feature', 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'],
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.ts',
  },
});
```

### 2. Factory Pattern para Datos Dinámicos

```typescript
// cypress/support/factories/index.ts
import { faker } from '@faker-js/faker';

export interface TestClub {
  id: string;
  name: string;
  sport: string;
  address: string;
  email: string;
  phone: string;
}

export interface TestTraining {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'technique' | 'endurance' | 'strength' | 'competition';
  athletes: string[];
  coach: string;
}

export interface TestAthlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  category: string;
  medicalClearance: boolean;
}

export class DataFactory {
  static generateClub(overrides: Partial<TestClub> = {}): TestClub {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Swimming Club',
      sport: 'swimming',
      address: faker.location.streetAddress(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      ...overrides,
    };
  }

  static generateTraining(overrides: Partial<TestTraining> = {}): TestTraining {
    const startHour = faker.number.int({ min: 6, max: 20 });
    const duration = faker.number.int({ min: 60, max: 180 }); // 1-3 horas

    return {
      id: faker.string.uuid(),
      title: faker.lorem.words(3),
      date: faker.date.future().toISOString().split('T')[0],
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${Math.floor((startHour * 60 + duration) / 60)
        .toString()
        .padStart(2, '0')}:${((startHour * 60 + duration) % 60).toString().padStart(2, '0')}`,
      type: faker.helpers.arrayElement(['technique', 'endurance', 'strength', 'competition']),
      athletes: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
        faker.string.uuid(),
      ),
      coach: faker.string.uuid(),
      ...overrides,
    };
  }

  static generateAthlete(overrides: Partial<TestAthlete> = {}): TestAthlete {
    const birthDate = faker.date.birthdate({ min: 8, max: 25, mode: 'age' });

    return {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      birthDate: birthDate.toISOString().split('T')[0],
      category: this.calculateCategory(birthDate),
      medicalClearance: faker.datatype.boolean({ probability: 0.8 }),
      ...overrides,
    };
  }

  static generateMultiple<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }

  private static calculateCategory(birthDate: Date): string {
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age <= 10) return 'infantil';
    if (age <= 12) return 'alevín';
    if (age <= 14) return 'benjamín';
    if (age <= 16) return 'cadete';
    if (age <= 18) return 'juvenil';
    return 'senior';
  }
}

// cypress/support/factories/scenario-builder.ts
export class ScenarioBuilder {
  static buildTrainingScheduleScenario() {
    const club = DataFactory.generateClub();
    const athletes = DataFactory.generateMultiple(() => DataFactory.generateAthlete(), 12);
    const trainings = DataFactory.generateMultiple(
      () =>
        DataFactory.generateTraining({
          athletes: athletes.slice(0, 6).map((a) => a.id),
        }),
      5,
    );

    return { club, athletes, trainings };
  }

  static buildConflictScenario() {
    const club = DataFactory.generateClub();
    const athlete = DataFactory.generateAthlete();

    const conflictingTraining1 = DataFactory.generateTraining({
      date: '2024-03-15',
      startTime: '10:00',
      endTime: '11:30',
      athletes: [athlete.id],
    });

    const conflictingTraining2 = DataFactory.generateTraining({
      date: '2024-03-15',
      startTime: '11:00', // Overlap con el anterior
      endTime: '12:30',
      athletes: [athlete.id],
    });

    return { club, athlete, trainings: [conflictingTraining1, conflictingTraining2] };
  }
}
```

### 3. Page Object Model

```typescript
// cypress/support/pages/training-calendar.page.ts
export class TrainingCalendarPage {
  // Elementos del calendario (70% layout)
  get calendarContainer() {
    return cy.get('[data-cy=calendar-container]');
  }
  get calendarWeekView() {
    return cy.get('[data-cy=calendar-week-view]');
  }
  get calendarMonthView() {
    return cy.get('[data-cy=calendar-month-view]');
  }
  get trainingSlots() {
    return cy.get('[data-cy=training-slot]');
  }
  get addTrainingBtn() {
    return cy.get('[data-cy=add-training-btn]');
  }

  // Panel de detalles (30% layout)
  get detailsPanel() {
    return cy.get('[data-cy=details-panel]');
  }
  get trainingDetails() {
    return cy.get('[data-cy=training-details]');
  }
  get athletesList() {
    return cy.get('[data-cy=athletes-list]');
  }
  get trainingForm() {
    return cy.get('[data-cy=training-form]');
  }

  // Filtros y búsqueda
  get searchInput() {
    return cy.get('[data-cy=search-input]');
  }
  get athleteFilter() {
    return cy.get('[data-cy=athlete-filter]');
  }
  get typeFilter() {
    return cy.get('[data-cy=type-filter]');
  }
  get dateRangeFilter() {
    return cy.get('[data-cy=date-range-filter]');
  }

  visit() {
    cy.visit('/training-calendar');
    this.waitForLoad();
    return this;
  }

  waitForLoad() {
    cy.get('[data-cy=loading-spinner]').should('not.exist');
    this.calendarContainer.should('be.visible');
    this.detailsPanel.should('be.visible');
    return this;
  }

  switchToWeekView() {
    cy.get('[data-cy=week-view-btn]').click();
    this.calendarWeekView.should('be.visible');
    return this;
  }

  switchToMonthView() {
    cy.get('[data-cy=month-view-btn]').click();
    this.calendarMonthView.should('be.visible');
    return this;
  }

  createTraining(training: Partial<TestTraining>) {
    this.addTrainingBtn.click();
    this.trainingForm.should('be.visible');

    if (training.title) {
      cy.get('[data-cy=training-title]').type(training.title);
    }

    if (training.date) {
      cy.get('[data-cy=training-date]').type(training.date);
    }

    if (training.startTime) {
      cy.get('[data-cy=training-start-time]').type(training.startTime);
    }

    if (training.endTime) {
      cy.get('[data-cy=training-end-time]').type(training.endTime);
    }

    if (training.type) {
      cy.get('[data-cy=training-type]').select(training.type);
    }

    if (training.athletes) {
      training.athletes.forEach((athleteId) => {
        cy.get(`[data-cy=athlete-checkbox-${athleteId}]`).check();
      });
    }

    cy.get('[data-cy=save-training-btn]').click();
    return this;
  }

  selectTraining(trainingId: string) {
    cy.get(`[data-cy=training-slot-${trainingId}]`).click();
    this.trainingDetails.should('be.visible');
    return this;
  }

  filterByAthlete(athleteName: string) {
    this.athleteFilter.click();
    cy.get('[data-cy=athlete-option]').contains(athleteName).click();
    return this;
  }

  searchTrainings(query: string) {
    this.searchInput.clear().type(query);
    cy.get('[data-cy=search-btn]').click();
    return this;
  }

  verifyTrainingExists(trainingTitle: string) {
    this.trainingSlots.contains(trainingTitle).should('be.visible');
    return this;
  }

  verifyConflictWarning() {
    cy.get('[data-cy=conflict-warning]').should('be.visible');
    cy.get('[data-cy=conflict-message]').should('contain', 'conflicto de horario');
    return this;
  }

  verifyResponsiveLayout() {
    // Verificar layout 70/30 en desktop
    cy.viewport(1280, 720);
    this.calendarContainer.should('have.css', 'flex', '0 0 70%');
    this.detailsPanel.should('have.css', 'flex', '0 0 30%');

    // Verificar layout responsive en mobile
    cy.viewport(375, 667);
    this.calendarContainer.should('have.css', 'width', '100%');
    this.detailsPanel.should('not.be.visible'); // Panel colapsado en mobile

    return this;
  }
}
```

## BDD Scenarios con Cucumber

### 4. Feature Files

```gherkin
# cypress/e2e/training-management.feature
Feature: Training Management
  Como entrenador del club
  Quiero gestionar los entrenamientos
  Para organizar las sesiones de mis atletas

  Background:
    Given I am logged in as a coach
    And I have access to a club with athletes
    And I am on the training calendar page

  Scenario: Create a new training session
    When I click on the add training button
    And I fill in the training details:
      | field      | value                    |
      | title      | Technique Training       |
      | date       | 2024-03-15              |
      | startTime  | 10:00                   |
      | endTime    | 11:30                   |
      | type       | technique               |
    And I select 5 athletes for the training
    And I save the training
    Then the training should appear in the calendar
    And I should see a success notification
    And the training details should be visible in the panel

  Scenario: Detect schedule conflicts
    Given there is an existing training on "2024-03-15" from "10:00" to "11:30"
    When I try to create a training on "2024-03-15" from "11:00" to "12:30"
    And I select the same athletes
    Then I should see a conflict warning
    And the save button should be disabled until I resolve the conflict

  Scenario: Filter trainings by athlete
    Given there are multiple trainings in the calendar
    When I filter by athlete "María González"
    Then I should only see trainings assigned to "María González"
    And the calendar should highlight those training slots

  Scenario: Responsive calendar view
    When I switch to mobile viewport
    Then the calendar should take full width
    And the details panel should be collapsible
    When I switch to desktop viewport
    Then the layout should show 70% calendar and 30% details panel

  Scenario: Search trainings functionality
    Given there are trainings with titles containing "Endurance"
    When I search for "Endurance"
    Then only trainings matching "Endurance" should be visible
    And the search term should be highlighted in results
```

### 5. Step Definitions

```typescript
// cypress/e2e/step-definitions/training-management.steps.ts
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
import { TrainingCalendarPage } from '../../support/pages/training-calendar.page';
import { DataFactory, ScenarioBuilder } from '../../support/factories';

const page = new TrainingCalendarPage();
let testData: any = {};

Given('I am logged in as a coach', () => {
  cy.login('coach');
});

Given('I have access to a club with athletes', () => {
  cy.task('generateTestData', 'training-scenario').then((data) => {
    testData = data;
    cy.task('seedDatabase', data);
  });
});

Given('I am on the training calendar page', () => {
  page.visit();
});

Given(
  'there is an existing training on {string} from {string} to {string}',
  (date, startTime, endTime) => {
    const existingTraining = DataFactory.generateTraining({
      date,
      startTime,
      endTime,
      athletes: testData.athletes.slice(0, 3).map((a) => a.id),
    });

    cy.task('seedDatabase', { trainings: [existingTraining] });
    testData.existingTraining = existingTraining;
  },
);

When('I click on the add training button', () => {
  page.addTrainingBtn.click();
});

When('I fill in the training details:', (dataTable) => {
  const training = dataTable.hashes()[0];
  page.createTraining(training);
});

When('I select {int} athletes for the training', (count) => {
  const selectedAthletes = testData.athletes.slice(0, count);
  selectedAthletes.forEach((athlete) => {
    cy.get(`[data-cy=athlete-checkbox-${athlete.id}]`).check();
  });
  testData.selectedAthletes = selectedAthletes;
});

When('I save the training', () => {
  cy.get('[data-cy=save-training-btn]').click();
});

When(
  'I try to create a training on {string} from {string} to {string}',
  (date, startTime, endTime) => {
    page.createTraining({ date, startTime, endTime });
  },
);

When('I select the same athletes', () => {
  testData.existingTraining.athletes.forEach((athleteId) => {
    cy.get(`[data-cy=athlete-checkbox-${athleteId}]`).check();
  });
});

When('I filter by athlete {string}', (athleteName) => {
  page.filterByAthlete(athleteName);
});

When('I search for {string}', (searchTerm) => {
  page.searchTrainings(searchTerm);
});

When('I switch to mobile viewport', () => {
  cy.viewport(375, 667);
});

When('I switch to desktop viewport', () => {
  cy.viewport(1280, 720);
});

Then('the training should appear in the calendar', () => {
  cy.get('[data-cy=training-slot]').should('contain', 'Technique Training');
});

Then('I should see a success notification', () => {
  cy.get('.p-toast-message-success').should('be.visible');
  cy.get('.p-toast-summary').should('contain', 'Entrenamiento Creado');
});

Then('I should see a conflict warning', () => {
  page.verifyConflictWarning();
});

Then('the save button should be disabled until I resolve the conflict', () => {
  cy.get('[data-cy=save-training-btn]').should('be.disabled');
});

Then('the layout should show 70% calendar and 30% details panel', () => {
  page.verifyResponsiveLayout();
});
```

## Comandos Personalizados de Cypress

### 6. Custom Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(role: 'admin' | 'coach' | 'athlete'): Chainable<void>;
      seedTestData(scenario: string): Chainable<any>;
      cleanTestData(): Chainable<void>;
      checkResponsive(): Chainable<void>;
      waitForAngular(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (role: 'admin' | 'coach' | 'athlete') => {
  cy.session(`${role}-session`, () => {
    cy.visit('/auth/login');

    // Mock Google OAuth para testing
    cy.window().then((win) => {
      win.localStorage.setItem('auth-token', 'mock-jwt-token');
      win.localStorage.setItem('user-role', role);
      win.localStorage.setItem('user-id', 'test-user-id');
    });

    cy.intercept('POST', '**/auth/validate', {
      statusCode: 200,
      body: {
        valid: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: role,
          clubId: 'test-club-id',
        },
      },
    }).as('validateAuth');

    cy.visit('/dashboard');
    cy.wait('@validateAuth');
  });
});

Cypress.Commands.add('seedTestData', (scenario: string) => {
  cy.task('generateTestData', scenario).then((data) => {
    cy.task('seedDatabase', data);
    return cy.wrap(data);
  });
});

Cypress.Commands.add('cleanTestData', () => {
  cy.task('cleanDatabase');
});

Cypress.Commands.add('checkResponsive', () => {
  const viewports = [
    { width: 1280, height: 720, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('[data-cy=main-content]').should('be.visible');

    if (viewport.name === 'mobile') {
      cy.get('[data-cy=mobile-menu-toggle]').should('be.visible');
    } else {
      cy.get('[data-cy=desktop-navigation]').should('be.visible');
    }
  });
});

Cypress.Commands.add('waitForAngular', () => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const check = () => {
        if (win.getAllAngularTestabilities) {
          const testabilities = win.getAllAngularTestabilities();
          const pending = testabilities.some((testability) => !testability.isStable());

          if (!pending) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        } else {
          resolve();
        }
      };
      check();
    });
  });
});
```

## Criterios de Aceptación

- ✅ Factory Pattern implementado para generación dinámica de datos
- ✅ Page Object Model para mantenibilidad del código
- ✅ BDD scenarios con Cucumber para legibilidad
- ✅ Coverage completo de flujos críticos (auth, CRUD, calendar)
- ✅ Testing responsive en múltiples viewports
- ✅ Validación de conflictos de horarios
- ✅ Integration con backend real (seeding y cleanup)
- ✅ Custom commands para operaciones comunes
- ✅ Parallel execution configurado
- ✅ Reports detallados con screenshots y videos
- ✅ CI/CD integration ready

Implementa esta suite de testing E2E completa para asegurar la calidad y funcionalidad de la plataforma deportiva en todos los escenarios críticos de usuario.
