# Prompt #12: Frontend Angular + PrimeNG + NgRx Setup

## Contexto del Sistema

Eres un experto desarrollador Angular especializado en aplicaciones empresariales complejas. Necesitas configurar el frontend de una plataforma deportiva integral con arquitectura de microservicios.

## Especificaciones del Proyecto

### Stack Frontend Definido

- **Framework**: Angular 18/19 con TypeScript
- **UI Library**: PrimeNG para componentes ricos de datos
- **State Management**: NgRx para manejo de estado complejo
- **Arquitectura**: Feature modules por dominio de negocio
- **Styling**: SCSS con diseño responsive
- **Futuro**: Capacidades PWA

### Arquitectura de Módulos

```
frontend/src/app/
├── core/                    # Servicios singleton y guards
├── shared/                  # Componentes y servicios compartidos
├── features/               # Módulos por dominio
│   ├── auth/               # Autenticación y autorización
│   ├── dashboard/          # Dashboard principal
│   ├── training/           # Gestión de entrenamientos
│   ├── athletes/           # Gestión de atletas
│   ├── competitions/       # Gestión de competencias
│   ├── clubs/              # Gestión de clubes
│   ├── payments/           # Gestión financiera
│   └── communication/      # Notificaciones y anuncios
└── layout/                 # Componentes de layout
```

### Configuración NgRx State

```typescript
// State Structure
interface AppState {
  auth: AuthState;
  club: ClubState;
  athletes: AthletesState;
  training: TrainingState;
  competitions: CompetitionsState;
  ui: UIState;
}
```

## Tareas a Realizar

### 1. Configuración Inicial del Proyecto Angular

```bash
# Comandos a ejecutar
ng new sports-platform-frontend --routing --style=scss --strict
cd sports-platform-frontend
ng add @ngrx/store @ngrx/effects @ngrx/store-devtools
npm install primeng primeicons
```

### 2. Configuración PrimeNG

- Instalar y configurar PrimeNG con tema personalizable
- Configurar módulos principales: Calendar, Table, Dialog, Charts
- Implementar tema responsive con variables SCSS
- Configurar iconos PrimeIcons

### 3. Configuración NgRx

- Setup del store principal con feature stores
- Configuración de efectos para llamadas HTTP
- Implementación de selectors optimizados
- DevTools para desarrollo

### 4. Estructura de Servicios

```typescript
// Servicios principales
@Injectable({ providedIn: 'root' })
export class ApiService {
  // Cliente HTTP base para microservicios
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Autenticación con Google OAuth
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  // Gestión de entrenamientos
}
```

### 5. Guards y Interceptors

- AuthGuard para rutas protegidas
- RoleGuard para permisos granulares
- JWT Interceptor para autenticación automática
- Error Interceptor para manejo centralizado

## Componente Central: TrainingCalendarPage

### Especificaciones del Calendario

- **Vista principal**: Semanal (70% de la pantalla)
- **Panel lateral**: Detalles de entrenamiento (30%)
- **Interacción**: Click en día muestra entrenamientos
- **Usuario primario**: Entrenador como usuario central
- **Datos**: Sincronización real-time con sports-service

### Estructura del Componente

```typescript
@Component({
  selector: 'app-training-calendar',
  template: `
    <div class="training-calendar-container">
      <div class="calendar-main">
        <p-calendar
          [view]="'week'"
          [events]="trainingEvents$ | async"
          (onDaySelect)="onDaySelected($event)"
        >
        </p-calendar>
      </div>
      <div class="details-panel">
        <app-training-details
          [selectedDate]="selectedDate$ | async"
          [trainings]="selectedTrainings$ | async"
        >
        </app-training-details>
      </div>
    </div>
  `,
})
export class TrainingCalendarPageComponent {
  // Implementación con NgRx
}
```

## Configuración de Rutas

### Routing Principal

```typescript
const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'training',
    loadChildren: () => import('./features/training/training.module').then((m) => m.TrainingModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COACH', 'ADMIN'] },
  },
];
```

## Integración con Backend

### Configuración de API Base URLs

```typescript
export const environment = {
  production: false,
  apiGateway: 'http://localhost:3000/api/v1',
  identityService: 'http://localhost:3001',
  sportsService: 'http://localhost:3002',
  clubService: 'http://localhost:3003',
  communicationService: 'http://localhost:3004',
};
```

### HTTP Client Configuration

- Interceptors para manejo de errores
- Retry policies para requests fallidos
- Loading states centralizados
- Cache strategies para datos estáticos

## Estándares de Desarrollo

### TypeScript Configuration

- Strict mode habilitado
- Path mapping para imports limpios
- Interfaces tipadas para todas las entidades
- Enums para constantes del dominio

### Componentes Guidelines

- OnPush change detection strategy
- Reactive forms para formularios complejos
- Standalone components donde sea apropiado
- Lazy loading para optimización

### Testing Setup

- Karma + Jasmine para unit tests
- Cypress para E2E testing
- Testing utilities para NgRx
- Mock services para desarrollo

## Deliverables Esperados

1. **Proyecto Angular configurado** con todas las dependencias
2. **Módulos base** implementados con lazy loading
3. **NgRx store** configurado con states principales
4. **TrainingCalendarPage** funcional con layout básico
5. **Servicios HTTP** configurados para microservicios
6. **Guards y interceptors** implementados
7. **Tema PrimeNG** personalizado y responsive
8. **Routing** completo con protección de rutas

## Criterios de Aceptación

- ✅ Aplicación Angular arranca sin errores
- ✅ PrimeNG components se renderizan correctamente
- ✅ NgRx DevTools funcionales en desarrollo
- ✅ TrainingCalendarPage muestra calendario semanal
- ✅ Autenticación con Google OAuth integrada
- ✅ Responsive design funcional en móvil y desktop
- ✅ TypeScript strict mode sin errores
- ✅ Lazy loading de módulos funcionando

Implementa esta configuración frontend completa siguiendo las mejores prácticas de Angular y asegurando la integración perfecta con el backend de microservicios ya definido.
