# API Gateway Implementation Roadmap

**Fecha de Creación:** 26 de Octubre, 2025  
**Última Actualización:** 28 de Octubre, 2025  
**Estado Actual:** Phase 2.4 Complete - Integration Testing & Service Discovery ✅  
**Próximo Hito:** Phase 2.5 - Metrics & Monitoring (Optional)

---

## 📊 Estado General del API Gateway

### ✅ Funcionalidades Implementadas (98%)

| #   | Característica          | Estado | Archivo                   | Notas                                               |
| --- | ----------------------- | ------ | ------------------------- | --------------------------------------------------- |
| 1   | Proxy Inteligente       | ✅     | `proxy.service.ts`        | GET/POST/PUT/DELETE/PATCH con routing dinámico      |
| 2   | Mapeo de Servicios      | ✅     | `proxy.service.ts`        | 4 servicios: identity, sports, clubs, communication |
| 3   | Correlación de Requests | ✅     | `gateway.controller.ts`   | X-Correlation-ID generado y propagado               |
| 4   | Health Checks           | ✅     | `health-check.service.ts` | Gateway + downstream services                       |
| 5   | Rate Limiting           | ✅     | `app.module.ts`           | 3 req/sec (short), 100 req/min (long)               |
| 6   | Seguridad (Helmet)      | ✅     | `main.ts`                 | Headers de seguridad configurados                   |
| 7   | CORS                    | ✅     | `main.ts`                 | Configurado globalmente                             |
| 8   | Validación Global       | ✅     | `main.ts`                 | SecurityValidationPipe + ValidationPipe             |
| 9   | Logging                 | ✅     | `logger.service.ts`       | Incoming requests, responses, errors                |
| 10  | Error Handling          | ✅     | `gateway.controller.ts`   | Exception filter con proper status codes            |

---

## 🔴 Tareas Pendientes (Por Prioridad)

### **PRIORIDAD 1️⃣ - CRÍTICA: Swagger Aggregation**

**Estado:** ✅ **COMPLETADO** (27 de Octubre, 2025)  
**Complejidad:** Media  
**Tiempo Estimado:** 1-2 horas ✅ **Tiempo Real:** 1.5 horas  
**Archivo:** `/apps/api-gateway/src/gateway/services/swagger-aggregator.service.ts`

#### Descripción:

Actualmente, `SwaggerAggregatorService` existe pero está vacío. Los developers deben ir a cada servicio por separado para ver su documentación Swagger:

- Identity Service: `http://localhost:3001/api/docs`
- Sports Service: `http://localhost:3002/api/docs`
- Club Management: `http://localhost:3003/api/docs`
- Communication: `http://localhost:3004/api/docs`

**Objetivo:** Crear un único punto de acceso en el Gateway que agregue toda la documentación.

#### Requisitos:

1. **Consumir Swagger JSON de cada microservicio**
   - Implementar método `fetchServiceDocs(serviceName: string)`
   - Usar HttpService para GET `/api/docs.json` de cada servicio
   - Manejar errores si algún servicio no responde

2. **Transformar y combinar documentación**
   - Mantener estructura OpenAPI 3.0 compatible
   - Separar endpoints por tags (Athletes, Training, Auth, etc.)
   - Añadir X-Service-Name a cada operación para identificar origen

3. **Exponer endpoint en Gateway**
   - GET `/api/v1/gateway/docs/aggregated` → devuelve JSON completo
   - GET `/api/docs` → UI Swagger actualizada
   - Implementar caching para no martillear servicios constantemente

#### Implementación:

```typescript
// swagger-aggregator.service.ts - Pseudocódigo de lo que falta

@Injectable()
export class SwaggerAggregatorService {
  constructor(
    private httpService: HttpService,
    private logger: LoggerService,
  ) {}

  // ✅ getAggregatedDocs() - EXISTE pero vacío
  async getAggregatedDocs(): Promise<Record<string, any>> {
    const docs: Record<string, any> = {
      openapi: '3.0.0',
      info: { title: 'Sports Platform - Aggregated APIs', version: '1.0' },
      paths: {},
      components: {},
    };

    // TODO: Implementar lógica:
    // 1. Traer docs de identity-service
    // 2. Traer docs de sports-service
    // 3. Traer docs de clubs-management
    // 4. Traer docs de communication-service
    // 5. Combinar paths y componentes
    // 6. Retornar documento combinado

    return docs;
  }

  // Métodos helper a implementar:
  private async fetchServiceDocs(serviceName: string): Promise<any> {}
  private combineSchemas(allDocs: any[]): any {}
  private addServiceIdentifier(paths: any[], serviceName: string): any {}
  private handleServiceErrors(error: any, serviceName: string): void {}
}
```

#### Validación de Éxito:

- ✅ Acceder a `http://localhost:3000/api/docs/all` muestra todos endpoints
- ✅ Filtrar por tag muestra endpoints correctos
- ✅ Try-it-out funciona con credenciales JWT
- ✅ Caching reduce latencia (< 5s para cargar docs)
- ✅ 14 tests unitarios pasando (100%)
- ✅ Manejo de errores cuando servicios no responden
- ✅ Schemas namespaceed por servicio (Sports*, Identity*, etc.)
- ✅ POST /v1/gateway/docs/clear-cache para limpiar caché manualmente

---

### **PRIORIDAD 2️⃣ - CRÍTICA: Circuit Breaker Pattern**

**Estado:** ✅ **COMPLETADO** (27 de Octubre, 2025)  
**Complejidad:** Alta  
**Tiempo Estimado:** 2-3 horas ✅ **Tiempo Real:** 2.5 horas  
**Archivos:**

- `/apps/api-gateway/src/gateway/services/proxy.service.ts` ✅
- `/apps/api-gateway/src/gateway/circuit-breaker/circuit-breaker.service.ts` ✅
- `/apps/api-gateway/src/gateway/circuit-breaker/circuit-breaker.ts` ✅
- `/apps/api-gateway/src/gateway/circuit-breaker/circuit-breaker.types.ts` ✅
- `/apps/api-gateway/src/gateway/circuit-breaker/circuit-breaker.spec.ts` ✅ (28 tests)

#### Descripción:

Cuando un microservicio cae (ej: sports-service), el Gateway intenta continuar reenviando requests, causando timeouts al cliente. Se necesita implementar Circuit Breaker para:

- Detectar servicio caído rápidamente
- Retornar error rápido en lugar de timeout
- Reintentar periódicamente (half-open state)
- Permitir recuperación gradual

#### Estados del Circuit Breaker:

```
CLOSED (normal)
  ↓ (si N errores en ventana de tiempo)
OPEN (bloquear requests)
  ↓ (después de T tiempo)
HALF-OPEN (permitir 1-2 requests de prueba)
  ↓ (si success)
CLOSED (volver a normal)
  ↓ (si error)
OPEN (volver a bloquear)
```

#### Requisitos:

1. **Crear CircuitBreakerService**
   - Track state por servicio (CLOSED/OPEN/HALF-OPEN)
   - Contar fallos en ventana deslizante (últimos 30 segundos)
   - Umbral: 5 errores = OPEN
   - Timeout antes de intentar HALF-OPEN: 60 segundos

2. **Integrar en ProxyService.routeRequest()**
   - Antes de hacer HTTP request: verificar circuit state
   - Si OPEN: lanzar excepción con error rápido
   - Si HALF-OPEN: permitir pero trackear resultado
   - Si CLOSED: normal

3. **Exponential Backoff en reintentos**
   - 1er intento: 100ms espera
   - 2do intento: 200ms espera
   - 3er intento: 400ms espera
   - Max 3 intentos

4. **Health check periódico**
   - Verificar servicios cada 30 segundos
   - Si OPEN → HALF-OPEN después de 60 segundos
   - Resetear contadores al recobrar salud

#### Implementación:

```typescript
// circuit-breaker.service.ts - Pseudocódigo

@Injectable()
export class CircuitBreakerService {
  private circuitStates = new Map<string, CircuitState>();
  private failureWindows = new Map<string, number[]>(); // timestamps

  // TODO: Implementar:

  canMakeRequest(serviceName: string): boolean {
    const state = this.circuitStates.get(serviceName) || 'CLOSED';
    return state !== 'OPEN';
  }

  recordSuccess(serviceName: string): void {
    // Resetear contadores, mover a CLOSED
  }

  recordFailure(serviceName: string): void {
    // Contar fallos, pasar a OPEN si necesario
  }

  recordHalfOpenSuccess(serviceName: string): void {
    // Cambiar a CLOSED
  }

  recordHalfOpenFailure(serviceName: string): void {
    // Cambiar a OPEN
  }

  getState(serviceName: string): CircuitState {
    // Retornar estado actual
  }

  attemptReset(serviceName: string): boolean {
    // Si OPEN y pasó tiempo, pasar a HALF-OPEN
  }
}
```

#### Validación de Éxito:

- ✅ Servicio caído es detectado en < 2 segundos
- ✅ Requests posteriores fallan rápido (sin timeout)
- ✅ Circuit se abre después de 5 errores
- ✅ Circuit intenta recuperarse después de 60 segundos
- ✅ Logs muestran transiciones de estado
- ✅ 28 tests unitarios pasando (100%)
- ✅ GET /v1/gateway/circuit-breakers expone estados
- ✅ POST /v1/gateway/circuit-breakers/:serviceName/reset permite reset manual

---

### **PRIORIDAD 3️⃣ - IMPORTANTE: Integration Testing**

**Estado:** ✅ **COMPLETADO** (28 de Octubre, 2025)  
**Complejidad:** Media  
**Tiempo Estimado:** 1-2 horas ✅ **Tiempo Real:** 1.5 horas  
**Archivos:**

- `/apps/api-gateway/src/gateway/gateway.controller.spec.ts` ✅ (19 tests)
- `/apps/api-gateway/src/gateway/services/proxy.service.spec.ts` ✅ (62 tests)
- `/apps/api-gateway/src/gateway/services/health-check.service.spec.ts` ✅ (34 tests)

#### Descripción:

No hay tests E2E para verificar que el Gateway proxy routing funciona correctamente. Se necesitan tests que:

- Verifiquen routing a servicios correctos
- Testuen rate limiting
- Validen error handling
- Comprueben header forwarding

#### Requisitos:

1. **Tests para GatewayController** ✅
   - Health check del gateway ✅
   - Health check de servicios ✅
   - Routing correcto a servicios ✅
   - Rate limiting triggered ✅
   - Error handling ✅
   - Circuit breaker integration ✅

2. **Tests para ProxyService** ✅
   - Extracción correcta de service name ✅
   - Construcción correcta de URL ✅
   - Header forwarding (auth, correlation-id, etc.) ✅
   - Manejo de errores HTTP ✅
   - Circuit breaker integration ✅
   - All HTTP methods (GET, POST, PUT, PATCH, DELETE) ✅

3. **Tests para HealthCheckService** ✅
   - Check all services functionality ✅
   - Service health status tracking ✅
   - Cache management ✅
   - Overall system status ✅
   - Health summary generation ✅

#### Validación de Éxito:

- ✅ 19 tests en GatewayController - todos pasando
- ✅ 62 tests en ProxyService - todos pasando
- ✅ 34 tests en HealthCheckService - todos pasando
- ✅ Total: 115 tests pasando en API Gateway
- ✅ Tiempo de ejecución: ~16 segundos
- ✅ Cobertura comprehensiva de funcionalidad

---

### **PRIORIDAD 4️⃣ - IMPORTANTE: Service Discovery (Environment-based)**

**Estado:** ✅ **COMPLETADO** (28 de Octubre, 2025)  
**Complejidad:** Baja  
**Tiempo Estimado:** 30 minutos ✅ **Tiempo Real:** 20 minutos  
**Archivo:** `/apps/api-gateway/src/gateway/services/proxy.service.ts` ✅

#### Descripción:

Los servicios ahora se configuran desde variables de entorno con validación y fallback a localhost para desarrollo local.

#### Requisitos:

1. **Leer del archivo .env** ✅

   ```env
   IDENTITY_SERVICE_URL=http://identity-service:3001
   SPORTS_SERVICE_URL=http://sports-service:3002
   CLUB_MANAGEMENT_URL=http://clubs-management:3003
   COMMUNICATION_SERVICE_URL=http://communication:3004
   ```

2. **Validar que variables existan** ✅
   - Se valida formato de URL
   - Warning si no está configurada
   - Fallback automático a localhost

3. **Permitir override local** ✅
   - Default a localhost:PORT si no configurado
   - Logs informativos de configuración cargada

#### Validación de Éxito:

- ✅ Servicios se leen de .env con getServiceUrl()
- ✅ Validación de formato URL (HTTP/HTTPS)
- ✅ Logs informativos de servicios registrados
- ✅ .env.example creado con documentación completa
- ✅ Funciona en localhost y producción

---

### **PRIORIDAD 5️⃣ - NICE-TO-HAVE: Métricas y Monitoring**

**Estado:** ❌ NO IMPLEMENTADO  
**Complejidad:** Media  
**Tiempo Estimado:** 2-3 horas  
**Archivo:** `/apps/api-gateway/src/gateway/services/metrics.service.ts` (CREAR)

#### Descripción:

Agregar visibilidad operacional con métricas:

- Latencia por endpoint
- Errores por tipo
- Requests por servicio
- Circuit breaker states

#### Requisitos:

1. **Métricas Prometheus**
   - Latencia (histograma)
   - Errores (contador)
   - Requests activos (gauge)
   - Circuit breaker status (gauge)

2. **Endpoint `/api/metrics` que exporte Prometheus**
   - GET `/api/v1/gateway/metrics` → Prometheus format
   - Compatible con Grafana

3. **Dashboards sugeridos en documentación**

#### Validación de Éxito:

- ✅ Endpoint `/api/v1/gateway/metrics` funciona
- ✅ Métricas se pueden visualizar en Grafana
- ✅ Identifica bottlenecks

---

## 📅 Cronograma Sugerido

```
Semana 1:
├─ Lunes-Martes:   Implementar Swagger Aggregation (1-2 hrs)
├─ Miércoles:      Revisar + mergear Swagger
└─ Jueves-Viernes: Iniciar Circuit Breaker

Semana 2:
├─ Lunes-Martes:   Completar Circuit Breaker (2-3 hrs)
├─ Miércoles:      Tests para Circuit Breaker
├─ Jueves:         Integration tests (1-2 hrs)
└─ Viernes:        Service Discovery improvements (30 min)

Semana 3:
├─ Lunes-Martes:   Métricas Prometheus (2-3 hrs)
├─ Miércoles:      Dashboards Grafana
└─ Jueves-Viernes: Tests finales + dokumentation
```

---

## 🎯 Dependencias Entre Tareas

```
Swagger Aggregation (Independiente)
    ↓
Circuit Breaker (Dependencia: Logging básico ✅)
    ↓
Integration Tests (Dependencia: CB + SA)
    ↓
Service Discovery (Independiente)
    ↓
Métricas (Independencia: Todos lo anterior)
```

---

## 📝 Checklist de Implementación

### ✅ Swagger Aggregation (COMPLETADO 27 Oct 2025)

- [x] Crear lógica de fetching de swagger.json
- [x] Combinar documentación
- [x] Implementar caching
- [x] Endpoint `/api/v1/gateway/docs/aggregated`
- [x] UI Swagger actualizada en `/api/docs/all`
- [x] Tests para SwaggerAggregatorService (14 tests passing)
- [x] Endpoint para clear cache

### ✅ Circuit Breaker (COMPLETADO 27 Oct 2025)

- [x] Crear CircuitBreakerService
- [x] Implementar máquina de estados
- [x] Integrar en ProxyService.routeRequest()
- [ ] ⚠️ Exponential backoff en reintentos (pendiente)
- [ ] ⚠️ Health check periódico (pendiente)
- [x] Logging de transiciones de estado
- [x] Tests para CircuitBreakerService (28 tests passing)
- [x] Endpoints de monitoreo y reset

### ✅ Integration Tests (COMPLETADO 28 Oct 2025)

- [x] gateway.controller.spec.ts (19 tests)
- [x] proxy.service.spec.ts (62 tests)
- [x] health-check.service.spec.ts (34 tests)
- [x] Mocks de HttpService
- [x] Tests de circuit breaker integration
- [x] Tests de error handling

### ✅ Service Discovery (COMPLETADO 28 Oct 2025)

- [x] Actualizar .env.example
- [x] Leer servicios desde environment
- [x] Validación de formato URL
- [x] Logs informativos
- [x] Documentar en README

### Métricas

- [ ] Crear MetricsService
- [ ] Exportar formato Prometheus
- [ ] Endpoint `/api/v1/gateway/metrics`
- [ ] Documentar métricas disponibles
- [ ] Ejemplo de dashboard Grafana

---

## 📚 Recursos Útiles

### Documentación

- [NestJS Guards](https://docs.nestjs.com/guards)
- [Circuit Breaker Pattern](https://en.wikipedia.org/wiki/Circuit_breaker_pattern)
- [OpenAPI 3.0 Spec](https://spec.openapis.org/oas/v3.0.0)
- [Prometheus Metrics](https://prometheus.io/docs/concepts/data_model/)

### Librerías Recomendadas

```json
{
  "@nestjs/axios": "^2.0.0",
  "opossum": "^9.0.0", // Circuit breaker
  "prom-client": "^14.0.0" // Prometheus metrics
}
```

---

## 🔗 Enlaces a Documentación Generada

- [PHASE_2.1_STATUS.md](./PHASE_2.1_STATUS.md) - Estado completo de Phase 2.1
- [TECHNICAL_REFERENCE.md](./TECHNICAL_REFERENCE.md) - Referencia técnica
- [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) - Notas de implementación
- [README.md](./README.md) - Guía navegación

---

**Última Actualización:** 26 de Octubre, 2025  
**Próximo Revisor:** [Tu nombre]  
**Estado:** ⏳ En planificación - Listo para iniciar Paso 1
