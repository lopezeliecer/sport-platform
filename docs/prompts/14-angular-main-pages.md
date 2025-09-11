# Prompt #14: Angular Main Pages Implementation

## Contexto del Sistema
Eres un experto desarrollador Angular especializado en aplicaciones empresariales complejas. Debes implementar las páginas principales de la plataforma deportiva, empezando por la TrainingCalendarPage como componente central del sistema.

## Páginas Principales Requeridas

### 1. TrainingCalendarPage (PRIORITARIO)
**Ruta**: `/training/calendar`
**Propósito**: Página central del sistema para gestión visual completa de entrenamientos

```typescript
@Component({
  selector: 'app-training-calendar-page',
  template: `
    <div class="training-calendar-page">
      <!-- Header con breadcrumb y acciones globales -->
      <div class="page-header">
        <p-breadcrumb [model]="breadcrumbItems" [home]="homeItem"></p-breadcrumb>
        <div class="header-actions">
          <p-button 
            label="Exportar Calendario" 
            icon="pi pi-download"
            styleClass="p-button-outlined"
            (onClick)="exportCalendar()">
          </p-button>
          <p-button 
            label="Configurar Vista" 
            icon="pi pi-cog"
            styleClass="p-button-outlined"
            (onClick)="openViewSettings()">
          </p-button>
        </div>
      </div>

      <!-- Filtros y controles superiores -->
      <div class="page-controls">
        <div class="filters-section">
          <div class="filter-group">
            <label>Club:</label>
            <p-dropdown 
              [options]="clubs$ | async"
              [(ngModel)]="selectedClub"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar club"
              (onChange)="onClubChange($event)">
            </p-dropdown>
          </div>

          <div class="filter-group">
            <label>Categorías:</label>
            <p-multiSelect 
              [options]="categories$ | async"
              [(ngModel)]="selectedCategories"
              optionLabel="name"
              optionValue="id"
              placeholder="Todas las categorías"
              [filter]="true"
              (onChange)="onCategoriesChange($event)">
            </p-multiSelect>
          </div>

          <div class="filter-group">
            <label>Entrenadores:</label>
            <p-multiSelect 
              [options]="coaches$ | async"
              [(ngModel)]="selectedCoaches"
              optionLabel="fullName"
              optionValue="id"
              placeholder="Todos los entrenadores"
              [filter]="true"
              (onChange)="onCoachesChange($event)">
            </p-multiSelect>
          </div>

          <div class="filter-group">
            <p-button 
              label="Limpiar Filtros" 
              icon="pi pi-filter-slash"
              styleClass="p-button-text"
              (onClick)="clearFilters()">
            </p-button>
          </div>
        </div>

        <div class="view-controls">
          <p-selectButton 
            [options]="viewOptions"
            [(ngModel)]="currentView"
            optionLabel="label"
            optionValue="value"
            (onChange)="onViewChange($event)">
          </p-selectButton>
        </div>
      </div>

      <!-- Componente principal del calendario -->
      <div class="calendar-container">
        <app-training-calendar
          [view]="currentView"
          [filters]="activeFilters$ | async"
          [events]="filteredEvents$ | async"
          [loading]="loading$ | async"
          (eventClick)="onEventClick($event)"
          (dateClick)="onDateClick($event)"
          (eventDrop)="onEventDrop($event)"
          (eventResize)="onEventResize($event)">
        </app-training-calendar>
      </div>

      <!-- Modales y dialogs -->
      <app-training-form
        [(visible)]="showTrainingForm"
        [training]="selectedTraining"
        [availableAthletes]="availableAthletes$ | async"
        [saving]="savingTraining$ | async"
        (trainingSubmit)="onTrainingCreate($event)"
        (trainingUpdate)="onTrainingUpdate($event)">
      </app-training-form>

      <p-dialog 
        [(visible)]="showViewSettings"
        header="Configurar Vista del Calendario"
        [modal]="true"
        [closable]="true"
        [style]="{width: '30vw'}">
        
        <div class="view-settings">
          <div class="setting-group">
            <label>Horario de trabajo:</label>
            <div class="time-range">
              <p-calendar 
                [(ngModel)]="workingHours.start"
                [timeOnly]="true"
                hourFormat="24">
              </p-calendar>
              <span>hasta</span>
              <p-calendar 
                [(ngModel)]="workingHours.end"
                [timeOnly]="true"
                hourFormat="24">
              </p-calendar>
            </div>
          </div>

          <div class="setting-group">
            <label>Duración de slots:</label>
            <p-dropdown 
              [(ngModel)]="slotDuration"
              [options]="slotDurationOptions"
              optionLabel="label"
              optionValue="value">
            </p-dropdown>
          </div>

          <div class="setting-group">
            <p-checkbox 
              [(ngModel)]="showWeekends"
              binary="true"
              label="Mostrar fines de semana">
            </p-checkbox>
          </div>

          <div class="setting-group">
            <p-checkbox 
              [(ngModel)]="showConflicts"
              binary="true"
              label="Resaltar conflictos de horario">
            </p-checkbox>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancelar" 
            icon="pi pi-times"
            styleClass="p-button-text"
            (onClick)="showViewSettings = false">
          </p-button>
          <p-button 
            label="Aplicar" 
            icon="pi pi-check"
            (onClick)="applyViewSettings()">
          </p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styleUrls: ['./training-calendar-page.component.scss']
})
export class TrainingCalendarPageComponent implements OnInit, OnDestroy {
  // NgRx Selectors
  clubs$ = this.store.select(selectUserClubs);
  categories$ = this.store.select(selectActiveCategories);
  coaches$ = this.store.select(selectActiveCoaches);
  filteredEvents$ = this.store.select(selectFilteredTrainingEvents);
  activeFilters$ = this.store.select(selectActiveFilters);
  availableAthletes$ = this.store.select(selectAvailableAthletes);
  loading$ = this.store.select(selectTrainingLoading);
  savingTraining$ = this.store.select(selectSavingTraining);

  // Component state
  selectedClub: string | null = null;
  selectedCategories: string[] = [];
  selectedCoaches: string[] = [];
  selectedTraining: Training | null = null;
  showTrainingForm = false;
  showViewSettings = false;
  currentView = 'timeGridWeek';

  // UI Configuration
  breadcrumbItems = [
    { label: 'Entrenamientos' },
    { label: 'Calendario' }
  ];
  homeItem = { icon: 'pi pi-home', routerLink: '/dashboard' };

  viewOptions = [
    { label: 'Día', value: 'timeGridDay' },
    { label: 'Semana', value: 'timeGridWeek' },
    { label: 'Mes', value: 'dayGridMonth' }
  ];

  workingHours = { start: '06:00', end: '22:00' };
  slotDuration = '00:30:00';
  showWeekends = true;
  showConflicts = true;

  slotDurationOptions = [
    { label: '15 minutos', value: '00:15:00' },
    { label: '30 minutos', value: '00:30:00' },
    { label: '1 hora', value: '01:00:00' }
  ];

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.setupSubscriptions();
  }

  private loadInitialData() {
    this.store.dispatch(TrainingActions.loadTrainings());
    this.store.dispatch(ClubActions.loadUserClubs());
    this.store.dispatch(AthleteActions.loadAthletes());
  }

  onEventClick(event: any) {
    this.selectedTraining = event.event.extendedProps.training;
    this.showTrainingForm = true;
  }

  onDateClick(event: any) {
    this.selectedTraining = null;
    this.showTrainingForm = true;
    // Pre-fill form with selected date/time
    this.store.dispatch(TrainingActions.setSelectedDateTime({
      date: event.date,
      startTime: event.date,
      endTime: new Date(event.date.getTime() + 60 * 60 * 1000) // +1 hour
    }));
  }

  onEventDrop(event: any) {
    const updatedTraining = {
      ...event.event.extendedProps.training,
      startTime: event.event.start,
      endTime: event.event.end
    };
    this.store.dispatch(TrainingActions.updateTraining({ 
      id: updatedTraining.id, 
      training: updatedTraining 
    }));
  }
}
```

### 2. DashboardPage
**Ruta**: `/dashboard`
**Propósito**: Dashboard principal con métricas y acceso rápido

```typescript
@Component({
  selector: 'app-dashboard-page',
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <h1>Dashboard</h1>
        <div class="header-actions">
          <p-dropdown 
            [options]="clubs$ | async"
            [(ngModel)]="selectedClub"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar club">
          </p-dropdown>
        </div>
      </div>

      <!-- Quick Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ (totalAthletes$ | async) || 0 }}</h3>
            <p>Atletas Activos</p>
            <small class="stat-change positive">+5% vs mes anterior</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-content">
            <h3>{{ (weeklyTrainings$ | async) || 0 }}</h3>
            <p>Entrenamientos Semana</p>
            <small class="stat-change neutral">Mismo que semana anterior</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="stat-content">
            <h3>{{ (upcomingCompetitions$ | async) || 0 }}</h3>
            <p>Competencias Próximas</p>
            <small class="stat-change">Próximos 30 días</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>{{ (attendanceRate$ | async) || 0 }}%</h3>
            <p>Asistencia Promedio</p>
            <small class="stat-change positive">+2% vs mes anterior</small>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Trainings -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Entrenamientos Recientes</h3>
            <p-button 
              label="Ver Todos" 
              styleClass="p-button-text"
              routerLink="/training/calendar">
            </p-button>
          </div>
          <div class="card-content">
            <div 
              class="training-item" 
              *ngFor="let training of recentTrainings$ | async; trackBy: trackByTraining">
              <div class="training-info">
                <h4>{{ training.title }}</h4>
                <p>{{ training.date | date:'shortDate' }} • {{ training.startTime | date:'shortTime' }}</p>
                <p-tag [value]="training.type" [severity]="getTrainingTypeSeverity(training.type)"></p-tag>
              </div>
              <div class="training-metrics">
                <span>{{ training.participants?.length || 0 }} atletas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Acciones Rápidas</h3>
          </div>
          <div class="card-content">
            <div class="quick-actions">
              <p-button 
                label="Nuevo Entrenamiento"
                icon="pi pi-plus"
                styleClass="p-button-outlined"
                (onClick)="createTraining()">
              </p-button>
              <p-button 
                label="Registrar Atleta"
                icon="pi pi-user-plus"
                styleClass="p-button-outlined"
                (onClick)="registerAthlete()">
              </p-button>
              <p-button 
                label="Nueva Competencia"
                icon="pi pi-trophy"
                styleClass="p-button-outlined"
                (onClick)="createCompetition()">
              </p-button>
              <p-button 
                label="Ver Reportes"
                icon="pi pi-chart-bar"
                styleClass="p-button-outlined"
                routerLink="/reports">
              </p-button>
            </div>
          </div>
        </div>

        <!-- Weekly Calendar Preview -->
        <div class="dashboard-card wide">
          <div class="card-header">
            <h3>Calendario Semanal</h3>
            <p-button 
              label="Ver Completo" 
              styleClass="p-button-text"
              routerLink="/training/calendar">
            </p-button>
          </div>
          <div class="card-content">
            <app-training-calendar
              [view]="'timeGridWeek'"
              [height]="300"
              [events]="weeklyEvents$ | async"
              [headerToolbar]="false"
              [readonly]="true">
            </app-training-calendar>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="dashboard-card">
          <div class="card-header">
            <h3>Próximos Eventos</h3>
          </div>
          <div class="card-content">
            <div 
              class="event-item" 
              *ngFor="let event of upcomingEvents$ | async; trackBy: trackByEvent">
              <div class="event-date">
                <span class="day">{{ event.date | date:'dd' }}</span>
                <span class="month">{{ event.date | date:'MMM' }}</span>
              </div>
              <div class="event-info">
                <h4>{{ event.title }}</h4>
                <p>{{ event.type }} • {{ event.location }}</p>
                <small>{{ event.time }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  // NgRx Selectors
  clubs$ = this.store.select(selectUserClubs);
  totalAthletes$ = this.store.select(selectTotalAthletes);
  weeklyTrainings$ = this.store.select(selectWeeklyTrainingsCount);
  upcomingCompetitions$ = this.store.select(selectUpcomingCompetitionsCount);
  attendanceRate$ = this.store.select(selectAverageAttendanceRate);
  recentTrainings$ = this.store.select(selectRecentTrainings);
  weeklyEvents$ = this.store.select(selectWeeklyEvents);
  upcomingEvents$ = this.store.select(selectUpcomingEvents);

  selectedClub: string | null = null;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.store.dispatch(DashboardActions.loadDashboardData());
  }

  createTraining() {
    this.router.navigate(['/training/calendar'], { 
      queryParams: { action: 'create' } 
    });
  }

  registerAthlete() {
    this.router.navigate(['/athletes'], { 
      queryParams: { action: 'create' } 
    });
  }

  createCompetition() {
    this.router.navigate(['/competitions'], { 
      queryParams: { action: 'create' } 
    });
  }

  trackByTraining(index: number, training: Training): string {
    return training.id;
  }

  trackByEvent(index: number, event: any): string {
    return event.id;
  }
}
```

### 3. AthletesListPage
**Ruta**: `/athletes`
**Propósito**: Listado y gestión de atletas

```typescript
@Component({
  selector: 'app-athletes-list-page',
  template: `
    <div class="athletes-list-page">
      <div class="page-header">
        <h1>Atletas</h1>
        <div class="header-actions">
          <p-button 
            label="Exportar Lista" 
            icon="pi pi-download"
            styleClass="p-button-outlined"
            (onClick)="exportAthletes()">
          </p-button>
          <p-button 
            label="Nuevo Atleta" 
            icon="pi pi-plus"
            (onClick)="createAthlete()">
          </p-button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="page-controls">
        <div class="search-section">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              pInputText 
              placeholder="Buscar atletas..."
              [(ngModel)]="searchTerm"
              (input)="onSearch($event)">
          </span>
        </div>

        <div class="filters-section">
          <p-dropdown 
            [options]="categories$ | async"
            [(ngModel)]="selectedCategory"
            optionLabel="name"
            optionValue="id"
            placeholder="Todas las categorías"
            [showClear]="true"
            (onChange)="onCategoryFilter($event)">
          </p-dropdown>

          <p-dropdown 
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos los estados"
            [showClear]="true"
            (onChange)="onStatusFilter($event)">
          </p-dropdown>

          <p-selectButton 
            [options]="viewModeOptions"
            [(ngModel)]="viewMode"
            optionLabel="icon"
            optionValue="value">
          </p-selectButton>
        </div>
      </div>

      <!-- Athletes Content -->
      <div class="athletes-content" [ngSwitch]="viewMode">
        <!-- Card View -->
        <div *ngSwitchCase="'cards'" class="athletes-grid">
          <app-athlete-card
            *ngFor="let athlete of filteredAthletes$ | async; trackBy: trackByAthlete"
            [athlete]="athlete"
            [showActions]="true"
            [showMetrics]="true"
            (profileClick)="viewProfile($event)"
            (progressClick)="viewProgress($event)"
            (scheduleClick)="viewSchedule($event)">
          </app-athlete-card>
        </div>

        <!-- Table View -->
        <div *ngSwitchCase="'table'" class="athletes-table">
          <p-table 
            [value]="filteredAthletes$ | async"
            [loading]="loading$ | async"
            [paginator]="true"
            [rows]="20"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} atletas"
            [rowsPerPageOptions]="[10, 20, 50]"
            [sortField]="'lastName'"
            [sortOrder]="1"
            dataKey="id"
            [resizableColumns]="true"
            [columnResizeMode]="'fit'"
            styleClass="p-datatable-sm">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="lastName">
                  Nombre <p-sortIcon field="lastName"></p-sortIcon>
                </th>
                <th pSortableColumn="category">
                  Categoría <p-sortIcon field="category"></p-sortIcon>
                </th>
                <th pSortableColumn="age">
                  Edad <p-sortIcon field="age"></p-sortIcon>
                </th>
                <th pSortableColumn="status">
                  Estado <p-sortIcon field="status"></p-sortIcon>
                </th>
                <th>Personal Best</th>
                <th>Entrenamientos/Semana</th>
                <th>Acciones</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-athlete>
              <tr>
                <td>
                  <div class="athlete-name">
                    <p-avatar 
                      [image]="athlete.photoUrl"
                      [label]="getInitials(athlete.firstName, athlete.lastName)"
                      size="normal">
                    </p-avatar>
                    <span>{{ athlete.firstName }} {{ athlete.lastName }}</span>
                  </div>
                </td>
                <td>
                  <p-tag [value]="athlete.category"></p-tag>
                </td>
                <td>{{ athlete.age }} años</td>
                <td>
                  <p-tag 
                    [value]="athlete.status" 
                    [severity]="getStatusSeverity(athlete.status)">
                  </p-tag>
                </td>
                <td>{{ athlete.personalBest || 'N/A' }}</td>
                <td>{{ athlete.weeklyTrainings || 0 }}</td>
                <td>
                  <div class="table-actions">
                    <p-button 
                      icon="pi pi-eye"
                      styleClass="p-button-text p-button-sm"
                      (onClick)="viewProfile(athlete)"
                      pTooltip="Ver perfil">
                    </p-button>
                    <p-button 
                      icon="pi pi-pencil"
                      styleClass="p-button-text p-button-sm"
                      (onClick)="editAthlete(athlete)"
                      pTooltip="Editar">
                    </p-button>
                    <p-button 
                      icon="pi pi-chart-line"
                      styleClass="p-button-text p-button-sm"
                      (onClick)="viewProgress(athlete)"
                      pTooltip="Ver progreso">
                    </p-button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./athletes-list-page.component.scss']
})
export class AthletesListPageComponent implements OnInit {
  // NgRx Selectors
  filteredAthletes$ = this.store.select(selectFilteredAthletes);
  categories$ = this.store.select(selectActiveCategories);
  loading$ = this.store.select(selectAthletesLoading);

  // Component state
  searchTerm = '';
  selectedCategory: string | null = null;
  selectedStatus: string | null = null;
  viewMode = 'cards';

  statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
    { label: 'Lesionado', value: 'injured' }
  ];

  viewModeOptions = [
    { icon: 'pi pi-th-large', value: 'cards' },
    { icon: 'pi pi-list', value: 'table' }
  ];

  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {}

  ngOnInit() {
    this.store.dispatch(AthleteActions.loadAthletes());
  }

  onSearch(event: any) {
    this.store.dispatch(AthleteActions.setSearchTerm({ 
      searchTerm: event.target.value 
    }));
  }

  trackByAthlete(index: number, athlete: Athlete): string {
    return athlete.id;
  }
}
```

## Estructura de Archivos de Páginas

```
frontend/src/app/features/
├── dashboard/
│   ├── pages/
│   │   └── dashboard-page/
│   │       ├── dashboard-page.component.ts
│   │       ├── dashboard-page.component.html
│   │       ├── dashboard-page.component.scss
│   │       └── dashboard-page.component.spec.ts
│   ├── dashboard-routing.module.ts
│   └── dashboard.module.ts
├── training/
│   ├── pages/
│   │   └── training-calendar-page/
│   │       ├── training-calendar-page.component.ts
│   │       ├── training-calendar-page.component.html
│   │       ├── training-calendar-page.component.scss
│   │       └── training-calendar-page.component.spec.ts
│   ├── training-routing.module.ts
│   └── training.module.ts
├── athletes/
│   ├── pages/
│   │   ├── athletes-list-page/
│   │   └── athlete-detail-page/
│   ├── athletes-routing.module.ts
│   └── athletes.module.ts
└── competitions/
    ├── pages/
    │   ├── competitions-list-page/
    │   └── competition-detail-page/
    ├── competitions-routing.module.ts
    └── competitions.module.ts
```

## Estilos SCSS para Páginas

### training-calendar-page.component.scss
```scss
.training-calendar-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--surface-border);
    
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .page-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    
    .filters-section {
      display: flex;
      gap: 1rem;
      align-items: center;
      
      .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        label {
          font-weight: 500;
          white-space: nowrap;
        }
      }
    }
    
    .view-controls {
      :ng-deep .p-selectbutton {
        .p-button {
          padding: 0.5rem 1rem;
        }
      }
    }
  }

  .calendar-container {
    background: white;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }
}

// Responsive
@media (max-width: 1024px) {
  .training-calendar-page {
    .page-controls {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
      
      .filters-section {
        flex-wrap: wrap;
      }
    }
  }
}

@media (max-width: 768px) {
  .training-calendar-page {
    .page-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .filters-section {
      .filter-group {
        flex-direction: column;
        align-items: stretch;
        
        label {
          font-size: 0.875rem;
        }
      }
    }
  }
}
```

### dashboard-page.component.scss
```scss
.dashboard-page {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
    
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
      }
      
      .stat-content {
        flex: 1;
        
        h3 {
          margin: 0 0 0.25rem 0;
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-color);
        }
        
        p {
          margin: 0 0 0.25rem 0;
          color: var(--text-color-secondary);
          font-weight: 500;
        }
        
        .stat-change {
          font-size: 0.875rem;
          
          &.positive {
            color: var(--green-500);
          }
          
          &.negative {
            color: var(--red-500);
          }
          
          &.neutral {
            color: var(--text-color-secondary);
          }
        }
      }
    }
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1rem;
    
    .dashboard-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      grid-column: span 6;
      
      &.wide {
        grid-column: span 12;
      }
      
      .card-header {
        padding: 1rem;
        border-bottom: 1px solid var(--surface-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        h3 {
          margin: 0;
          font-weight: 600;
        }
      }
      
      .card-content {
        padding: 1rem;
      }
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    
    :ng-deep .p-button {
      justify-content: flex-start;
    }
  }
}

// Responsive
@media (max-width: 1024px) {
  .dashboard-page {
    .dashboard-grid {
      .dashboard-card {
        grid-column: span 12;
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .quick-actions {
      grid-template-columns: 1fr;
    }
  }
}
```

## Criterios de Aceptación

- ✅ TrainingCalendarPage completamente funcional como página central
- ✅ DashboardPage con métricas y vista general del sistema
- ✅ AthletesListPage con filtros, búsqueda y múltiples vistas
- ✅ Navegación fluida entre páginas con rutas lazy-loaded
- ✅ Responsive design completo para todas las páginas
- ✅ Integración completa con NgRx para manejo de estado
- ✅ Componentes reutilizables integrados correctamente
- ✅ Loading states y error handling implementados
- ✅ Breadcrumbs y navegación contextual
- ✅ TypeScript strict mode sin errores
- ✅ Tests unitarios básicos para cada página

Implementa estas páginas principales siguiendo las mejores prácticas de Angular, asegurando la perfecta integración con los componentes base ya creados y el estado global de la aplicación.
