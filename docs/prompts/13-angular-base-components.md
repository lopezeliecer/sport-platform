# Prompt #13: Angular Base Components Implementation

## Contexto del Sistema

Eres un experto desarrollador Angular especializado en componentes reutilizables y arquitectura escalable. Debes implementar los componentes base fundamentales para la plataforma deportiva, priorizando el calendario de entrenamientos como componente central.

## Componentes Base Requeridos

### 1. TrainingCalendarComponent (PRIORITARIO)

**Propósito**: Componente central del sistema para gestión visual de entrenamientos

```typescript
@Component({
  selector: 'app-training-calendar',
  template: `
    <div class="training-calendar-wrapper">
      <!-- Header con navegación y filtros -->
      <div class="calendar-header">
        <div class="calendar-navigation">
          <p-button icon="pi pi-chevron-left" (onClick)="previousWeek()" styleClass="p-button-text">
          </p-button>
          <h2>{{ currentWeek$ | async | weekRange }}</h2>
          <p-button icon="pi pi-chevron-right" (onClick)="nextWeek()" styleClass="p-button-text">
          </p-button>
        </div>
        <div class="calendar-actions">
          <p-dropdown
            [options]="athletes$ | async"
            [(ngModel)]="selectedAthlete"
            placeholder="Filtrar por atleta"
            optionLabel="name"
            [showClear]="true"
          >
          </p-dropdown>
          <p-button label="Nuevo Entrenamiento" icon="pi pi-plus" (onClick)="createTraining()">
          </p-button>
        </div>
      </div>

      <!-- Layout principal: 70% calendario + 30% detalles -->
      <div class="calendar-content">
        <div class="calendar-main">
          <p-fullCalendar
            #calendar
            [options]="calendarOptions"
            [events]="trainingEvents$ | async"
            (dateClick)="onDateClick($event)"
            (eventClick)="onEventClick($event)"
          >
          </p-fullCalendar>
        </div>

        <div class="details-panel" [class.expanded]="showDetails">
          <app-training-details
            [selectedDate]="selectedDate$ | async"
            [trainings]="selectedTrainings$ | async"
            [loading]="loading$ | async"
            (trainingUpdated)="onTrainingUpdated($event)"
            (trainingDeleted)="onTrainingDeleted($event)"
          >
          </app-training-details>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./training-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingCalendarComponent implements OnInit, OnDestroy {
  // NgRx selectors
  currentWeek$ = this.store.select(selectCurrentWeek);
  trainingEvents$ = this.store.select(selectTrainingEvents);
  selectedDate$ = this.store.select(selectSelectedDate);
  selectedTrainings$ = this.store.select(selectSelectedTrainings);
  athletes$ = this.store.select(selectClubAthletes);
  loading$ = this.store.select(selectTrainingLoading);

  // Component state
  showDetails = false;
  selectedAthlete: Athlete | null = null;
  calendarOptions: CalendarOptions;

  constructor(
    private store: Store<AppState>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.initializeCalendar();
    this.loadInitialData();
  }

  // Calendar configuration optimizada para entrenamientos
  private initializeCalendar() {
    this.calendarOptions = {
      initialView: 'timeGridWeek',
      headerToolbar: false, // Custom header
      slotMinTime: '05:00:00',
      slotMaxTime: '23:00:00',
      allDaySlot: false,
      slotDuration: '00:30:00',
      height: 'auto',
      locale: 'es',
      firstDay: 1, // Monday
      eventDisplay: 'block',
      eventColor: '#3788d8',
      eventTextColor: '#ffffff',
      weekends: true,
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday to Saturday
        startTime: '06:00',
        endTime: '22:00',
      },
    };
  }
}
```

### 2. TrainingDetailsComponent

**Propósito**: Panel lateral con detalles de entrenamientos seleccionados

```typescript
@Component({
  selector: 'app-training-details',
  template: `
    <div class="training-details-panel">
      <div class="panel-header">
        <h3>{{ selectedDate | date: 'EEEE, d MMMM y' }}</h3>
        <p-button
          icon="pi pi-times"
          styleClass="p-button-text p-button-sm"
          (onClick)="closePanel()"
        >
        </p-button>
      </div>

      <div class="panel-content" *ngIf="!loading; else loadingTemplate">
        <div *ngIf="trainings && trainings.length > 0; else noTrainings">
          <div
            class="training-card"
            *ngFor="let training of trainings; trackBy: trackByTraining"
            [class.selected]="selectedTraining?.id === training.id"
            (click)="selectTraining(training)"
          >
            <div class="training-header">
              <span class="training-time">
                {{ training.startTime | date: 'HH:mm' }} -
                {{ training.endTime | date: 'HH:mm' }}
              </span>
              <p-tag [value]="training.type" [severity]="getTrainingTypeSeverity(training.type)">
              </p-tag>
            </div>

            <div class="training-info">
              <h4>{{ training.title }}</h4>
              <p class="training-description">{{ training.description }}</p>

              <div class="training-metrics" *ngIf="training.plannedMetrics">
                <div class="metric">
                  <i class="pi pi-clock"></i>
                  <span>{{ training.plannedMetrics.duration }} min</span>
                </div>
                <div class="metric">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ training.plannedMetrics.distance }}m</span>
                </div>
                <div class="metric">
                  <i class="pi pi-users"></i>
                  <span>{{ training.athletes?.length || 0 }} atletas</span>
                </div>
              </div>
            </div>

            <div class="training-actions">
              <p-button
                icon="pi pi-pencil"
                styleClass="p-button-text p-button-sm"
                (onClick)="editTraining(training); $event.stopPropagation()"
              >
              </p-button>
              <p-button
                icon="pi pi-copy"
                styleClass="p-button-text p-button-sm"
                (onClick)="duplicateTraining(training); $event.stopPropagation()"
              >
              </p-button>
              <p-button
                icon="pi pi-trash"
                styleClass="p-button-text p-button-sm p-button-danger"
                (onClick)="deleteTraining(training); $event.stopPropagation()"
              >
              </p-button>
            </div>
          </div>
        </div>

        <ng-template #noTrainings>
          <div class="no-trainings">
            <i class="pi pi-calendar-plus"></i>
            <h4>No hay entrenamientos</h4>
            <p>No hay entrenamientos programados para esta fecha.</p>
            <p-button label="Crear Entrenamiento" icon="pi pi-plus" (onClick)="createNewTraining()">
            </p-button>
          </div>
        </ng-template>
      </div>

      <ng-template #loadingTemplate>
        <div class="loading-container">
          <p-progressSpinner></p-progressSpinner>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./training-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingDetailsComponent {
  @Input() selectedDate: Date | null = null;
  @Input() trainings: Training[] = [];
  @Input() loading = false;

  @Output() trainingUpdated = new EventEmitter<Training>();
  @Output() trainingDeleted = new EventEmitter<string>();
  @Output() panelClosed = new EventEmitter<void>();

  selectedTraining: Training | null = null;

  trackByTraining(index: number, training: Training): string {
    return training.id;
  }

  getTrainingTypeSeverity(type: string): string {
    const severityMap = {
      technique: 'info',
      endurance: 'success',
      speed: 'warning',
      strength: 'danger',
    };
    return severityMap[type] || 'info';
  }
}
```

### 3. AthleteCardComponent

**Propósito**: Tarjeta reutilizable para mostrar información de atletas

```typescript
@Component({
  selector: 'app-athlete-card',
  template: `
    <div class="athlete-card" [class.selected]="selected">
      <div class="athlete-avatar">
        <p-avatar
          [image]="athlete.photoUrl"
          [label]="getInitials(athlete.firstName, athlete.lastName)"
          size="large"
          shape="circle"
        >
        </p-avatar>
        <div class="status-indicator" [class]="athlete.status">
          <i class="pi" [class]="getStatusIcon(athlete.status)"></i>
        </div>
      </div>

      <div class="athlete-info">
        <h3>{{ athlete.firstName }} {{ athlete.lastName }}</h3>
        <p class="athlete-category">{{ athlete.category }} • {{ athlete.age }} años</p>

        <div class="athlete-metrics" *ngIf="showMetrics">
          <div class="metric">
            <span class="metric-label">Personal Best</span>
            <span class="metric-value">{{ athlete.personalBest || 'N/A' }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Entrenamientos/semana</span>
            <span class="metric-value">{{ athlete.weeklyTrainings || 0 }}</span>
          </div>
        </div>

        <div class="athlete-tags" *ngIf="athlete.tags">
          <p-tag *ngFor="let tag of athlete.tags" [value]="tag" styleClass="athlete-tag"> </p-tag>
        </div>
      </div>

      <div class="athlete-actions" *ngIf="showActions">
        <p-button
          icon="pi pi-user"
          styleClass="p-button-text"
          (onClick)="viewProfile()"
          pTooltip="Ver perfil"
        >
        </p-button>
        <p-button
          icon="pi pi-chart-line"
          styleClass="p-button-text"
          (onClick)="viewProgress()"
          pTooltip="Ver progreso"
        >
        </p-button>
        <p-button
          icon="pi pi-calendar"
          styleClass="p-button-text"
          (onClick)="viewSchedule()"
          pTooltip="Ver horarios"
        >
        </p-button>
      </div>
    </div>
  `,
  styleUrls: ['./athlete-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthleteCardComponent {
  @Input() athlete!: Athlete;
  @Input() selected = false;
  @Input() showMetrics = true;
  @Input() showActions = true;

  @Output() profileClick = new EventEmitter<Athlete>();
  @Output() progressClick = new EventEmitter<Athlete>();
  @Output() scheduleClick = new EventEmitter<Athlete>();

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getStatusIcon(status: string): string {
    const iconMap = {
      active: 'pi-check-circle',
      inactive: 'pi-times-circle',
      injured: 'pi-exclamation-triangle',
    };
    return iconMap[status] || 'pi-question-circle';
  }
}
```

### 4. TrainingFormComponent

**Propósito**: Formulario para crear/editar entrenamientos

```typescript
@Component({
  selector: 'app-training-form',
  template: `
    <p-dialog
      [(visible)]="visible"
      [header]="isEditMode ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '50vw' }"
      (onHide)="onClose()"
    >
      <form [formGroup]="trainingForm" (ngSubmit)="onSubmit()">
        <!-- Información básica -->
        <div class="form-section">
          <h4>Información Básica</h4>

          <div class="p-field">
            <label for="title">Título *</label>
            <input type="text" id="title" pInputText formControlName="title" class="w-full" />
          </div>

          <div class="p-field">
            <label for="description">Descripción</label>
            <textarea
              id="description"
              pInputTextarea
              formControlName="description"
              rows="3"
              class="w-full"
            >
            </textarea>
          </div>

          <div class="form-row">
            <div class="p-field">
              <label for="type">Tipo de Entrenamiento *</label>
              <p-dropdown
                id="type"
                formControlName="type"
                [options]="trainingTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar tipo"
                class="w-full"
              >
              </p-dropdown>
            </div>

            <div class="p-field">
              <label for="difficulty">Dificultad</label>
              <p-rating id="difficulty" formControlName="difficulty" [stars]="5" [cancel]="false">
              </p-rating>
            </div>
          </div>
        </div>

        <!-- Programación temporal -->
        <div class="form-section">
          <h4>Horario</h4>

          <div class="form-row">
            <div class="p-field">
              <label for="date">Fecha *</label>
              <p-calendar
                id="date"
                formControlName="date"
                dateFormat="dd/mm/yy"
                [showButtonBar]="true"
                class="w-full"
              >
              </p-calendar>
            </div>

            <div class="p-field">
              <label for="startTime">Hora Inicio *</label>
              <p-calendar
                id="startTime"
                formControlName="startTime"
                [timeOnly]="true"
                hourFormat="24"
                class="w-full"
              >
              </p-calendar>
            </div>

            <div class="p-field">
              <label for="endTime">Hora Fin *</label>
              <p-calendar
                id="endTime"
                formControlName="endTime"
                [timeOnly]="true"
                hourFormat="24"
                class="w-full"
              >
              </p-calendar>
            </div>
          </div>
        </div>

        <!-- Participantes -->
        <div class="form-section">
          <h4>Atletas Participantes</h4>

          <p-multiSelect
            formControlName="athletes"
            [options]="availableAthletes"
            optionLabel="fullName"
            optionValue="id"
            placeholder="Seleccionar atletas"
            [filter]="true"
            filterBy="fullName"
            class="w-full"
          >
            <ng-template let-athlete pTemplate="item">
              <div class="athlete-option">
                <p-avatar
                  [image]="athlete.photoUrl"
                  [label]="getInitials(athlete.firstName, athlete.lastName)"
                  size="small"
                >
                </p-avatar>
                <span>{{ athlete.fullName }}</span>
                <p-tag [value]="athlete.category" styleClass="ml-auto"> </p-tag>
              </div>
            </ng-template>
          </p-multiSelect>
        </div>

        <!-- Métricas planificadas -->
        <div class="form-section">
          <h4>Métricas Planificadas</h4>

          <div class="form-row">
            <div class="p-field">
              <label for="duration">Duración (min)</label>
              <p-inputNumber
                id="duration"
                formControlName="duration"
                [min]="15"
                [max]="300"
                suffix=" min"
                class="w-full"
              >
              </p-inputNumber>
            </div>

            <div class="p-field">
              <label for="distance">Distancia (m)</label>
              <p-inputNumber
                id="distance"
                formControlName="distance"
                [min]="0"
                [max]="10000"
                suffix=" m"
                class="w-full"
              >
              </p-inputNumber>
            </div>

            <div class="p-field">
              <label for="intensity">Intensidad (%)</label>
              <p-inputNumber
                id="intensity"
                formControlName="intensity"
                [min]="50"
                [max]="100"
                suffix=" %"
                class="w-full"
              >
              </p-inputNumber>
            </div>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancelar"
          icon="pi pi-times"
          styleClass="p-button-text"
          (onClick)="onClose()"
        >
        </p-button>
        <p-button
          [label]="isEditMode ? 'Actualizar' : 'Crear'"
          icon="pi pi-check"
          [loading]="saving"
          [disabled]="trainingForm.invalid"
          (onClick)="onSubmit()"
        >
        </p-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./training-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingFormComponent implements OnInit {
  @Input() visible = false;
  @Input() training: Training | null = null;
  @Input() availableAthletes: Athlete[] = [];
  @Input() saving = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() trainingSubmit = new EventEmitter<CreateTrainingDto>();
  @Output() trainingUpdate = new EventEmitter<UpdateTrainingDto>();

  trainingForm!: FormGroup;
  isEditMode = false;

  trainingTypes = [
    { label: 'Técnica', value: 'technique' },
    { label: 'Resistencia', value: 'endurance' },
    { label: 'Velocidad', value: 'speed' },
    { label: 'Fuerza', value: 'strength' },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.trainingForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['', Validators.required],
      difficulty: [3],
      date: [new Date(), Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      athletes: [[], Validators.required],
      duration: [60],
      distance: [1000],
      intensity: [75],
    });
  }
}
```

## Estructura de Archivos Esperada

```
frontend/src/app/shared/components/
├── training-calendar/
│   ├── training-calendar.component.ts
│   ├── training-calendar.component.html
│   ├── training-calendar.component.scss
│   └── training-calendar.component.spec.ts
├── training-details/
│   ├── training-details.component.ts
│   ├── training-details.component.html
│   ├── training-details.component.scss
│   └── training-details.component.spec.ts
├── athlete-card/
│   ├── athlete-card.component.ts
│   ├── athlete-card.component.html
│   ├── athlete-card.component.scss
│   └── athlete-card.component.spec.ts
├── training-form/
│   ├── training-form.component.ts
│   ├── training-form.component.html
│   ├── training-form.component.scss
│   └── training-form.component.spec.ts
└── index.ts
```

## Estilos SCSS Responsive

### training-calendar.component.scss

```scss
.training-calendar-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);

    .calendar-navigation {
      display: flex;
      align-items: center;
      gap: 1rem;

      h2 {
        margin: 0;
        font-weight: 600;
      }
    }

    .calendar-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  }

  .calendar-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    .calendar-main {
      flex: 0 0 70%;
      padding: 1rem;
      overflow-y: auto;
    }

    .details-panel {
      flex: 0 0 30%;
      border-left: 1px solid var(--surface-border);
      background: var(--surface-ground);

      &.expanded {
        flex: 0 0 40%;
      }
    }
  }
}

// Responsive design
@media (max-width: 1024px) {
  .calendar-content {
    .calendar-main {
      flex: 0 0 60%;
    }

    .details-panel {
      flex: 0 0 40%;
    }
  }
}

@media (max-width: 768px) {
  .calendar-content {
    flex-direction: column;

    .calendar-main {
      flex: 1;
    }

    .details-panel {
      flex: 0 0 300px;
      border-left: none;
      border-top: 1px solid var(--surface-border);
    }
  }
}
```

## Criterios de Aceptación

- ✅ TrainingCalendarComponent funcional con vista semanal
- ✅ Integración completa con PrimeNG FullCalendar
- ✅ Panel lateral responsive (30%/70% desktop, stack en móvil)
- ✅ TrainingDetailsComponent con información completa
- ✅ AthleteCardComponent reutilizable y flexible
- ✅ TrainingFormComponent con validaciones
- ✅ Responsive design funcional en todas las resoluciones
- ✅ TypeScript strict sin errores
- ✅ OnPush change detection implementado
- ✅ Tests unitarios básicos para cada componente

Implementa estos componentes base siguiendo las mejores prácticas de Angular y asegurando la perfecta integración con PrimeNG y NgRx para el manejo de estado.
