import { Injectable, OnModuleInit } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Metrics Service - Prometheus metrics collection
 * Tracks API Gateway performance and operational metrics
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  // HTTP Request metrics
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestErrors: Counter<string>;

  // Circuit Breaker metrics
  private readonly circuitBreakerState: Gauge<string>;
  private readonly circuitBreakerTrips: Counter<string>;

  // Service health metrics
  private readonly serviceHealth: Gauge<string>;

  // Active requests
  private readonly activeRequests: Gauge<string>;

  constructor() {
    // Collect default Node.js metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register });

    // HTTP Request counter
    this.httpRequestsTotal = new Counter({
      name: 'api_gateway_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [register],
    });

    // HTTP Request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'api_gateway_http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'service'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [register],
    });

    // HTTP Request errors counter
    this.httpRequestErrors = new Counter({
      name: 'api_gateway_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type', 'service'],
      registers: [register],
    });

    // Circuit Breaker state gauge
    this.circuitBreakerState = new Gauge({
      name: 'api_gateway_circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
      labelNames: ['service'],
      registers: [register],
    });

    // Circuit Breaker trips counter
    this.circuitBreakerTrips = new Counter({
      name: 'api_gateway_circuit_breaker_trips_total',
      help: 'Total number of circuit breaker trips to OPEN state',
      labelNames: ['service'],
      registers: [register],
    });

    // Service health gauge
    this.serviceHealth = new Gauge({
      name: 'api_gateway_service_health',
      help: 'Service health status (0=DOWN, 1=DEGRADED, 2=UP)',
      labelNames: ['service'],
      registers: [register],
    });

    // Active requests gauge
    this.activeRequests = new Gauge({
      name: 'api_gateway_active_requests',
      help: 'Number of active HTTP requests',
      labelNames: ['service'],
      registers: [register],
    });
  }

  onModuleInit() {
    // Initialize service health to 0 (DOWN) for all services
    const services = ['identity', 'sports', 'clubs', 'communication'];
    services.forEach((service) => {
      this.serviceHealth.set({ service }, 0);
      this.circuitBreakerState.set({ service }, 0); // CLOSED
    });
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    service: string,
    durationMs: number,
  ): void {
    this.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      service,
    });

    this.httpRequestDuration.observe(
      {
        method,
        route,
        service,
      },
      durationMs,
    );
  }

  /**
   * Record HTTP request error
   */
  recordHttpError(method: string, route: string, errorType: string, service: string): void {
    this.httpRequestErrors.inc({
      method,
      route,
      error_type: errorType,
      service,
    });
  }

  /**
   * Update circuit breaker state
   * @param service Service name
   * @param state CLOSED=0, HALF_OPEN=1, OPEN=2
   */
  updateCircuitBreakerState(service: string, state: 'CLOSED' | 'HALF_OPEN' | 'OPEN'): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'HALF_OPEN' ? 1 : 2;
    this.circuitBreakerState.set({ service }, stateValue);

    // Increment trip counter if transitioning to OPEN
    if (state === 'OPEN') {
      this.circuitBreakerTrips.inc({ service });
    }
  }

  /**
   * Update service health status
   * @param service Service name
   * @param status DOWN=0, DEGRADED=1, UP=2
   */
  updateServiceHealth(service: string, status: 'DOWN' | 'DEGRADED' | 'UP'): void {
    const statusValue = status === 'DOWN' ? 0 : status === 'DEGRADED' ? 1 : 2;
    this.serviceHealth.set({ service }, statusValue);
  }

  /**
   * Increment active requests counter
   */
  incrementActiveRequests(service: string): void {
    this.activeRequests.inc({ service });
  }

  /**
   * Decrement active requests counter
   */
  decrementActiveRequests(service: string): void {
    this.activeRequests.dec({ service });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get content type for Prometheus metrics
   */
  getContentType(): string {
    return register.contentType;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    register.resetMetrics();
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics(): void {
    register.clear();
  }
}
