# Prompt #15: Integración Frontend-Backend

## Contexto del Sistema

Eres un experto desarrollador full-stack especializado en integración Angular-NestJS. Debes implementar la comunicación completa entre el frontend Angular y los microservicios NestJS de la plataforma deportiva, siguiendo las decisiones arquitectónicas establecidas.

## Arquitectura de Comunicación Definida

### API Gateway Centralizado

```
Frontend Angular (4200)
    ↓ HTTP REST
API Gateway (3000)
    ↓ Enrutamiento interno
Microservicios:
├── identity-service (3001)
├── sports-service (3002)
├── club-management (3003)
└── communication (3004)
```

### Estrategia de Error Handling: Híbrido

- **Global Error Interceptor** para errores comunes (401, 500, red)
- **Manejo específico** en componentes para errores de negocio
- **PrimeNG Toast** para notificaciones de usuario

### Loading States: Pessimistic Updates

- Mostrar loading states durante operaciones
- Actualizar UI solo después de confirmación del servidor
- No optimistic updates para mantener consistencia

## Implementación Angular - HTTP Services

### 1. Configuración Base del HTTP Client

```typescript
// src/app/core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiGateway; // http://localhost:3000/api/v1

  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
  ) {}

  // Métodos base para comunicación con API Gateway
  get<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, {
        ...this.getDefaultOptions(),
        ...options,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  post<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, body, {
        ...this.getDefaultOptions(),
        ...options,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  private getDefaultOptions(): any {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      withCredentials: true, // Para sessions
    };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error);
  }
}
```

### 2. Global Error Interceptor

```typescript
// src/app/core/interceptors/error.interceptor.ts
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private messageService: MessageService,
    private router: Router,
    private store: Store<AppState>,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry(1), // Retry automático para errores de red
      catchError((error: HttpErrorResponse) => {
        // Manejo global de errores comunes
        switch (error.status) {
          case 401:
            this.handleUnauthorized();
            break;
          case 403:
            this.handleForbidden();
            break;
          case 500:
            this.handleServerError(error);
            break;
          case 0: // Error de red
            this.handleNetworkError();
            break;
          default:
            // Errores específicos se manejan en componentes
            break;
        }

        return throwError(() => error);
      }),
    );
  }

  private handleUnauthorized(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Sesión Expirada',
      detail: 'Por favor, inicia sesión nuevamente',
    });
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/auth/login']);
  }

  private handleServerError(error: HttpErrorResponse): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error del Servidor',
      detail: 'Ocurrió un error interno. Por favor, intenta más tarde.',
    });
    console.error('Server Error:', error);
  }
}
```

### 3. NgRx Effects para Operaciones Asíncronas

```typescript
// src/app/features/training/store/training.effects.ts
@Injectable()
export class TrainingEffects {
  constructor(
    private actions$: Actions,
    private trainingService: TrainingService,
    private messageService: MessageService,
    private store: Store<AppState>,
  ) {}

  // Cargar entrenamientos
  loadTrainings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrainingActions.loadTrainings),
      withLatestFrom(this.store.select(selectCurrentClubId)),
      switchMap(([action, clubId]) => {
        if (!clubId) {
          return of(
            TrainingActions.loadTrainingsFailure({
              error: 'No hay club seleccionado',
            }),
          );
        }

        return this.trainingService.getTrainings(clubId, action.filters).pipe(
          map((trainings) => TrainingActions.loadTrainingsSuccess({ trainings })),
          catchError((error) => {
            this.handleTrainingError('cargar entrenamientos', error);
            return of(TrainingActions.loadTrainingsFailure({ error: error.message }));
          }),
        );
      }),
    ),
  );

  // Validación asíncrona de horarios
  validateSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TrainingActions.validateSchedule),
      withLatestFrom(this.store.select(selectCurrentClubId)),
      debounceTime(500), // Debounce para no hacer muchas requests
      switchMap(([action, clubId]) => {
        if (!clubId) return EMPTY;

        return this.trainingService.validateScheduleConflict(clubId, action.scheduleData).pipe(
          map((result) => TrainingActions.validateScheduleSuccess({ result })),
          catchError((error) =>
            of(TrainingActions.validateScheduleFailure({ error: error.message })),
          ),
        );
      }),
    ),
  );

  private handleTrainingError(operation: string, error: any): void {
    if (error.status === 409) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Conflicto de Horario',
        detail: 'Ya existe un entrenamiento en este horario',
      });
    } else if (error.status === 422) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos Inválidos',
        detail: error.error?.message || 'Verifica los datos ingresados',
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `No se pudo ${operation}. Intenta nuevamente.`,
      });
    }
  }
}
```

## Criterios de Aceptación

- ✅ API Gateway como único punto de comunicación desde frontend
- ✅ Global Error Interceptor manejando errores comunes (401, 500, red)
- ✅ Manejo específico de errores de negocio en componentes
- ✅ Pessimistic updates con loading states apropiados
- ✅ Validación progressive con async validators
- ✅ File upload optimizado con compresión y chunking
- ✅ Retry automático para errores de red
- ✅ PrimeNG Toast notifications para feedback de usuario
- ✅ NgRx Effects para operaciones asíncronas
- ✅ TypeScript strict mode sin errores
- ✅ Configuración dual para desarrollo y producción

Implementa esta integración completa siguiendo las mejores prácticas de Angular y asegurando una comunicación robusta y eficiente con el backend de microservicios.
