# Prompt #17: Optimización de Performance

## Contexto del Sistema
Eres un experto en optimización de performance para aplicaciones Angular. Debes implementar mejoras de rendimiento completas en la plataforma deportiva, enfocándote en el componente central TrainingCalendarPage y optimizaciones específicas basadas en las decisiones arquitectónicas tomadas.

## Estrategia de Optimización Definida

### TrackBy Functions para Rendimiento
- **TrackBy obligatorio** en todas las listas y *ngFor
- **Identificadores únicos** para prevenir re-renderizado innecesario
- **Funciones optimizadas** para cada tipo de entidad

### Debounce en Filtros y Búsquedas
- **500ms debounce** en filtros del TrainingCalendarPage
- **Cancelación automática** de requests previos
- **Loading states** durante búsquedas

### Lazy Loading y Preloading
- **Módulos lazy** para todas las features
- **Preloading estratégico** de rutas críticas
- **Component lazy loading** para modales y panels

### File Upload Optimizado
- **Compresión automática** de imágenes de atletas
- **Chunked upload** para archivos grandes (>5MB)
- **Progress tracking** detallado

## Implementación de TrackBy Functions

### 1. TrackBy para TrainingCalendarPage

```typescript
// src/app/features/training/pages/training-calendar/training-calendar.page.ts
export class TrainingCalendarPage implements OnInit {
  
  // TrackBy functions para listas críticas
  trackByTrainingId = (index: number, training: Training): string => training.id;
  trackByAthleteId = (index: number, athlete: Athlete): string => athlete.id;
  trackByTimeSlot = (index: number, slot: TimeSlot): string => `${slot.date}-${slot.time}`;
  trackByFilterOption = (index: number, option: FilterOption): string => option.value;

  // Entidades del calendario
  trainings$ = this.store.select(selectFilteredTrainings);
  athletes$ = this.store.select(selectClubAthletes);
  timeSlots$ = this.store.select(selectCalendarTimeSlots);
  
  // Estados de loading optimizados
  loadingTrainings$ = this.store.select(selectLoadingTrainings);
  searchingTrainings$ = this.store.select(selectSearchingTrainings);
  
  constructor(
    private store: Store<AppState>,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initializeOptimizedCalendar();
  }

  private initializeOptimizedCalendar() {
    // Cargar datos iniciales con OnPush strategy
    this.store.dispatch(TrainingActions.loadInitialData());
    
    // Setup de filtros con debounce
    this.setupOptimizedFilters();
  }

  private setupOptimizedFilters() {
    // Debounced search con cancelación
    const searchControl = new FormControl('');
    searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query?.trim()) {
          return of(null);
        }
        
        this.store.dispatch(TrainingActions.searchTrainings({ query }));
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }
}
```

### 2. Optimización del TrainingCalendarComponent

```typescript
// src/app/shared/components/training-calendar/training-calendar.component.ts
@Component({
  selector: 'app-training-calendar',
  templateUrl: './training-calendar.component.html',
  styleUrls: ['./training-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Obligatorio para performance
  providers: [
    // Providers optimizados para el calendario
    {
      provide: CALENDAR_CONFIG,
      useValue: {
        virtualScrolling: true,
        bufferSize: 10,
        trackByFn: (index: number, item: any) => item.id
      }
    }
  ]
})
export class TrainingCalendarComponent implements OnInit, OnDestroy {
  
  // Inputs con OnPush strategy
  @Input() trainings: Training[] = [];
  @Input() selectedDate: Date = new Date();
  @Input() viewMode: 'week' | 'month' = 'week';
  
  // Outputs optimizados
  @Output() trainingSelected = new EventEmitter<Training>();
  @Output() dateChanged = new EventEmitter<Date>();
  @Output() viewModeChanged = new EventEmitter<'week' | 'month'>();

  // Computed properties para evitar recálculos
  @Memoize()
  get calendarWeeks(): CalendarWeek[] {
    return this.calculateCalendarWeeks(this.selectedDate, this.trainings);
  }

  @Memoize()
  get trainingsByDate(): Map<string, Training[]> {
    return this.groupTrainingsByDate(this.trainings);
  }

  // TrackBy functions específicas
  trackByWeek = (index: number, week: CalendarWeek): string => 
    `${week.startDate.getTime()}-${week.endDate.getTime()}`;
    
  trackByDay = (index: number, day: CalendarDay): string => 
    day.date.toISOString().split('T')[0];
    
  trackByTraining = (index: number, training: Training): string => training.id;

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(CALENDAR_CONFIG) private config: CalendarConfig
  ) {}

  ngOnInit() {
    this.initializeVirtualScrolling();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeVirtualScrolling() {
    // Virtual scrolling para calendarios con muchos entrenamientos
    if (this.config.virtualScrolling) {
      this.setupVirtualScrolling();
    }
  }

  private calculateCalendarWeeks(date: Date, trainings: Training[]): CalendarWeek[] {
    // Cálculo optimizado de semanas del calendario
    // Usar cache para evitar recálculos innecesarios
    const cacheKey = `${date.getTime()}-${trainings.length}`;
    return this.getCachedWeeks(cacheKey) || this.computeWeeks(date, trainings);
  }

  private groupTrainingsByDate(trainings: Training[]): Map<string, Training[]> {
    return trainings.reduce((map, training) => {
      const dateKey = training.date.toISOString().split('T')[0];
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, training]);
      return map;
    }, new Map<string, Training[]>());
  }

  // Optimización para clicks frecuentes
  @HostListener('click', ['$event'])
  onCalendarClick(event: Event) {
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    const trainingElement = target.closest('[data-training-id]');
    
    if (trainingElement) {
      const trainingId = trainingElement.getAttribute('data-training-id');
      const training = this.trainings.find(t => t.id === trainingId);
      
      if (training) {
        this.trainingSelected.emit(training);
      }
    }
  }
}
```

## Debounce Optimizado para Filtros

### 3. Servicio de Filtros con Debounce

```typescript
// src/app/features/training/services/training-filter.service.ts
@Injectable({ providedIn: 'root' })
export class TrainingFilterService {
  
  private readonly DEBOUNCE_TIME = 500;
  private readonly searchSubject = new BehaviorSubject<string>('');
  private readonly athleteFilterSubject = new BehaviorSubject<string[]>([]);
  private readonly dateRangeSubject = new BehaviorSubject<DateRange | null>(null);
  
  // Observables públicos con debounce aplicado
  public readonly searchQuery$ = this.searchSubject.pipe(
    debounceTime(this.DEBOUNCE_TIME),
    distinctUntilChanged(),
    map(query => query.trim())
  );
  
  public readonly athleteFilter$ = this.athleteFilterSubject.pipe(
    debounceTime(this.DEBOUNCE_TIME),
    distinctUntilChanged(),
    filter(athletes => Array.isArray(athletes))
  );
  
  public readonly dateRangeFilter$ = this.dateRangeSubject.pipe(
    debounceTime(this.DEBOUNCE_TIME),
    distinctUntilChanged(),
    filter(range => range !== null)
  );

  // Observable combinado para aplicar todos los filtros
  public readonly appliedFilters$ = combineLatest([
    this.searchQuery$,
    this.athleteFilter$,
    this.dateRangeFilter$
  ]).pipe(
    map(([search, athletes, dateRange]) => ({
      search,
      athletes,
      dateRange,
      timestamp: Date.now() // Para evitar resultados obsoletos
    })),
    distinctUntilChanged((prev, curr) => 
      prev.search === curr.search &&
      JSON.stringify(prev.athletes) === JSON.stringify(curr.athletes) &&
      JSON.stringify(prev.dateRange) === JSON.stringify(curr.dateRange)
    )
  );

  constructor(private trainingService: TrainingService) {
    this.initializeFilterEffects();
  }

  // Métodos públicos para actualizar filtros
  updateSearchQuery(query: string): void {
    this.searchSubject.next(query);
  }

  updateAthleteFilter(athleteIds: string[]): void {
    this.athleteFilterSubject.next(athleteIds);
  }

  updateDateRange(range: DateRange): void {
    this.dateRangeSubject.next(range);
  }

  clearAllFilters(): void {
    this.searchSubject.next('');
    this.athleteFilterSubject.next([]);
    this.dateRangeSubject.next(null);
  }

  private initializeFilterEffects() {
    // Efecto para aplicar filtros con cancelación automática
    this.appliedFilters$.pipe(
      switchMap(filters => {
        // Cancelar request anterior automáticamente
        return this.trainingService.getFilteredTrainings(filters).pipe(
          catchError(error => {
            console.warn('Filter request cancelled or failed:', error);
            return of([]); // Devolver array vacío en caso de error
          })
        );
      })
    ).subscribe(); // NgRx Effects manejará la subscripción
  }
}
```

### 4. Componente de Filtros Optimizado

```typescript
// src/app/shared/components/training-filters/training-filters.component.ts
@Component({
  selector: 'app-training-filters',
  templateUrl: './training-filters.component.html',
  styleUrls: ['./training-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingFiltersComponent implements OnInit, OnDestroy {
  
  // Form controls con debounce individual
  searchControl = new FormControl('');
  athleteControl = new FormControl([]);
  dateRangeControl = new FormControl(null);
  
  // Opciones con TrackBy
  athletes$ = this.store.select(selectAvailableAthletes);
  trackByAthleteOption = (index: number, athlete: Athlete): string => athlete.id;
  
  // Estados de loading
  searching$ = this.filterService.searchQuery$.pipe(
    switchMap(query => query ? of(true) : of(false)),
    startWith(false)
  );
  
  private destroy$ = new Subject<void>();

  constructor(
    private filterService: TrainingFilterService,
    private store: Store<AppState>,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupOptimizedControls();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupOptimizedControls() {
    // Search con debounce y cancelación
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterService.updateSearchQuery(query || '');
    });

    // Filtro de atletas con debounce
    this.athleteControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(athletes => {
      this.filterService.updateAthleteFilter(athletes || []);
    });

    // Rango de fechas con validación
    this.dateRangeControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(range => this.isValidDateRange(range)),
      takeUntil(this.destroy$)
    ).subscribe(range => {
      this.filterService.updateDateRange(range);
    });
  }

  private isValidDateRange(range: any): boolean {
    return range && range.startDate && range.endDate && 
           range.startDate <= range.endDate;
  }

  // Método optimizado para limpiar filtros
  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.athleteControl.setValue([], { emitEvent: false });
    this.dateRangeControl.setValue(null, { emitEvent: false });
    
    this.filterService.clearAllFilters();
    this.cdr.markForCheck();
  }
}
```

## Lazy Loading y Preloading Strategy

### 5. Configuración Avanzada de Routing

```typescript
// src/app/app-routing.module.ts
const routes: Routes = [
  {
    path: 'training',
    loadChildren: () => import('./features/training/training.module').then(m => m.TrainingModule),
    data: { preload: true, priority: 'high' } // Preload crítico
  },
  {
    path: 'athletes',
    loadChildren: () => import('./features/athletes/athletes.module').then(m => m.AthletesModule),
    data: { preload: true, priority: 'medium' }
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule),
    data: { preload: false, priority: 'low' } // No preload para reports
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    data: { preload: false, priority: 'low' }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: CustomPreloadingStrategy, // Estrategia personalizada
    enableTracing: false // Desactivar en producción
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 6. Estrategia de Preloading Personalizada

```typescript
// src/app/core/strategies/custom-preloading.strategy.ts
@Injectable({ providedIn: 'root' })
export class CustomPreloadingStrategy implements PreloadingStrategy {
  
  private preloadedModules = new Set<string>();
  
  constructor(private connectionService: ConnectionService) {}

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const routeData = route.data || {};
    const shouldPreload = routeData['preload'];
    const priority = routeData['priority'] || 'low';
    const path = route.path || 'unknown';

    // No precargar si ya fue precargado
    if (this.preloadedModules.has(path)) {
      return of(null);
    }

    // Verificar condiciones para preloading
    if (!shouldPreload || !this.shouldPreloadNow(priority)) {
      return of(null);
    }

    console.log(`Preloading module: ${path} (priority: ${priority})`);
    
    return this.delayedLoad(load, priority).pipe(
      tap(() => {
        this.preloadedModules.add(path);
        console.log(`Module preloaded successfully: ${path}`);
      }),
      catchError(error => {
        console.warn(`Failed to preload module ${path}:`, error);
        return of(null);
      })
    );
  }

  private shouldPreloadNow(priority: string): boolean {
    // No precargar en conexiones lentas para prioridad baja
    if (priority === 'low' && this.connectionService.isSlowConnection()) {
      return false;
    }

    // No precargar si la batería está baja (en dispositivos móviles)
    if (this.connectionService.isBatteryLow()) {
      return priority === 'high';
    }

    return true;
  }

  private delayedLoad(load: () => Observable<any>, priority: string): Observable<any> {
    const delay = this.getDelayForPriority(priority);
    
    return timer(delay).pipe(
      switchMap(() => load())
    );
  }

  private getDelayForPriority(priority: string): number {
    switch (priority) {
      case 'high': return 100;   // Precargar casi inmediatamente
      case 'medium': return 2000; // Precargar después de 2 segundos
      case 'low': return 5000;    // Precargar después de 5 segundos
      default: return 3000;
    }
  }
}
```

## File Upload Optimizado

### 7. Servicio de Upload con Compresión

```typescript
// src/app/core/services/optimized-upload.service.ts
@Injectable({ providedIn: 'root' })
export class OptimizedUploadService {
  
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private readonly IMAGE_QUALITY = 0.8;
  private readonly MAX_IMAGE_DIMENSION = 1920;

  constructor(
    private http: HttpClient,
    private compressionService: ImageCompressionService
  ) {}

  uploadFile(file: File, options: UploadOptions = {}): Observable<UploadProgress> {
    return from(this.processFile(file, options)).pipe(
      switchMap(processedFile => this.performUpload(processedFile, options))
    );
  }

  private async processFile(file: File, options: UploadOptions): Promise<File> {
    // Comprimir imágenes automáticamente
    if (this.isImage(file) && file.size > 500 * 1024) { // Si > 500KB
      console.log(`Compressing image: ${file.name} (${this.formatFileSize(file.size)})`);
      
      const compressedFile = await this.compressionService.compress(file, {
        quality: options.quality || this.IMAGE_QUALITY,
        maxWidth: options.maxWidth || this.MAX_IMAGE_DIMENSION,
        maxHeight: options.maxHeight || this.MAX_IMAGE_DIMENSION
      });
      
      console.log(`Image compressed: ${compressedFile.name} (${this.formatFileSize(compressedFile.size)})`);
      return compressedFile;
    }

    return file;
  }

  private performUpload(file: File, options: UploadOptions): Observable<UploadProgress> {
    // Usar chunked upload para archivos grandes
    if (file.size > this.CHUNK_SIZE * 2) {
      return this.chunkedUpload(file, options);
    }

    return this.singleUpload(file, options);
  }

  private singleUpload(file: File, options: UploadOptions): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', options.type || 'general');

    return this.http.post<any>('/api/v1/files/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => this.mapHttpEventToProgress(event)),
      startWith({ progress: 0, status: 'uploading' } as UploadProgress)
    );
  }

  private chunkedUpload(file: File, options: UploadOptions): Observable<UploadProgress> {
    const chunks = this.createChunks(file, this.CHUNK_SIZE);
    const uploadId = this.generateUploadId();
    
    return from(chunks).pipe(
      concatMap((chunk, index) => 
        this.uploadChunk(chunk, index, chunks.length, uploadId, options)
      ),
      scan((acc, current) => ({
        progress: Math.round((current.chunkIndex + 1) / chunks.length * 100),
        status: current.chunkIndex === chunks.length - 1 ? 'completed' : 'uploading',
        uploadedBytes: acc.uploadedBytes + current.chunkSize,
        totalBytes: file.size
      }), { progress: 0, status: 'uploading', uploadedBytes: 0, totalBytes: file.size } as UploadProgress)
    );
  }

  private createChunks(file: File, chunkSize: number): Blob[] {
    const chunks: Blob[] = [];
    let offset = 0;

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      chunks.push(file.slice(offset, end));
      offset = end;
    }

    return chunks;
  }

  private uploadChunk(
    chunk: Blob, 
    index: number, 
    totalChunks: number, 
    uploadId: string,
    options: UploadOptions
  ): Observable<ChunkUploadResult> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('uploadId', uploadId);

    return this.http.post<any>('/api/v1/files/upload-chunk', formData).pipe(
      map(response => ({
        chunkIndex: index,
        chunkSize: chunk.size,
        response
      })),
      retry(2) // Retry automático para chunks fallidos
    );
  }

  private mapHttpEventToProgress(event: HttpEvent<any>): UploadProgress {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        const progress = Math.round(100 * event.loaded / event.total!);
        return {
          progress,
          status: 'uploading',
          uploadedBytes: event.loaded,
          totalBytes: event.total!
        };
      
      case HttpEventType.Response:
        return {
          progress: 100,
          status: 'completed',
          result: event.body,
          uploadedBytes: event.body?.fileSize || 0,
          totalBytes: event.body?.fileSize || 0
        };
      
      default:
        return { progress: 0, status: 'uploading' };
    }
  }

  private isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateUploadId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

## Criterios de Aceptación

- ✅ TrackBy functions implementadas en todas las listas (*ngFor)
- ✅ Debounce de 500ms en filtros y búsquedas
- ✅ Cancelación automática de requests previos
- ✅ Lazy loading configurado para todos los módulos
- ✅ Preloading estratégico basado en prioridad y conexión
- ✅ ChangeDetectionStrategy.OnPush en componentes críticos
- ✅ Compresión automática de imágenes
- ✅ Chunked upload para archivos grandes
- ✅ Virtual scrolling en listas largas
- ✅ Memoization en computed properties costosas
- ✅ Progress tracking detallado en uploads
- ✅ Performance monitoring y métricas

Implementa estas optimizaciones de performance para asegurar que la plataforma deportiva ofrezca una experiencia de usuario fluida y responsiva en todos los dispositivos y condiciones de red.
