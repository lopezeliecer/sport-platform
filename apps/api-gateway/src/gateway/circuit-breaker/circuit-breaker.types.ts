/**
 * Circuit Breaker States
 *
 * CLOSED: Normal operation, requests pass through
 * OPEN: Circuit is open, requests fail immediately without calling service
 * HALF_OPEN: Testing if service recovered, allows limited requests through
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Configuration for Circuit Breaker behavior
 */
export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures before opening circuit
   * @default 5
   */
  failureThreshold: number;

  /**
   * Number of successful requests in HALF_OPEN to close circuit
   * @default 2
   */
  successThreshold: number;

  /**
   * Time in milliseconds to wait before transitioning from OPEN to HALF_OPEN
   * @default 60000 (60 seconds)
   */
  timeout: number;

  /**
   * Maximum number of requests allowed in HALF_OPEN state
   * @default 3
   */
  halfOpenMaxRequests: number;

  /**
   * Service name for logging/monitoring
   */
  name: string;
}

/**
 * Circuit Breaker state snapshot for monitoring
 */
export interface CircuitBreakerState {
  name: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

/**
 * Exception thrown when circuit is open
 */
export class CircuitOpenException extends Error {
  constructor(
    public readonly serviceName: string,
    public readonly nextAttemptTime: Date,
  ) {
    super(
      `Circuit breaker is OPEN for service "${serviceName}". Next attempt at ${nextAttemptTime.toISOString()}`,
    );
    this.name = 'CircuitOpenException';
  }
}

/**
 * Exception thrown when too many requests in HALF_OPEN state
 */
export class TooManyRequestsException extends Error {
  constructor(public readonly serviceName: string) {
    super(`Too many requests to service "${serviceName}" in HALF_OPEN state`);
    this.name = 'TooManyRequestsException';
  }
}
