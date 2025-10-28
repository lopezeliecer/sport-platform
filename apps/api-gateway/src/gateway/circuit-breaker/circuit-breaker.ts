import { Logger } from '@nestjs/common';
import {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitOpenException,
  TooManyRequestsException,
} from './circuit-breaker.types';

/**
 * Circuit Breaker Implementation
 *
 * Implements the Circuit Breaker pattern to prevent cascading failures
 * in distributed systems. The breaker transitions between three states:
 *
 * CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 *
 * @example
 * const breaker = new CircuitBreaker({ name: 'identity-service', failureThreshold: 5 });
 * await breaker.execute(async () => {
 *   return await httpService.get('/api/users');
 * });
 */
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);

  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private nextAttemptTime: Date | null = null;
  private halfOpenRequests = 0;

  // Metrics
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: Partial<CircuitBreakerConfig> & Pick<CircuitBreakerConfig, 'name'>) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000, // 60 seconds
      halfOpenMaxRequests: config.halfOpenMaxRequests ?? 3,
      name: config.name,
    };

    this.logger.log(`Circuit Breaker initialized for "${this.config.name}"`);
  }

  /**
   * Execute an operation through the circuit breaker
   *
   * @param operation - Async function to execute
   * @returns Result of the operation
   * @throws CircuitOpenException if circuit is open
   * @throws TooManyRequestsException if too many requests in HALF_OPEN
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        throw new CircuitOpenException(this.config.name, this.nextAttemptTime!);
      }
    }

    // Check half-open request limit
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequests >= this.config.halfOpenMaxRequests) {
        throw new TooManyRequestsException(this.config.name);
      }
      this.halfOpenRequests++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      this.logger.debug(
        `[${this.config.name}] Success in HALF_OPEN: ${this.successCount}/${this.config.successThreshold}`,
      );

      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Record a failed operation
   */
  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = new Date();

    this.logger.warn(
      `[${this.config.name}] Failure recorded: ${this.failureCount}/${this.config.failureThreshold}`,
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN immediately opens the circuit
      this.transitionToOpen();
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.timeout);
    this.halfOpenRequests = 0;

    this.logger.error(
      `[${this.config.name}] Circuit OPENED. Next attempt at ${this.nextAttemptTime.toISOString()}`,
    );
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    this.halfOpenRequests = 0;

    this.logger.log(`[${this.config.name}] Circuit transitioned to HALF_OPEN`);
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.halfOpenRequests = 0;

    this.logger.log(`[${this.config.name}] Circuit CLOSED - Service recovered`);
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return {
      name: this.config.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.logger.log(`[${this.config.name}] Circuit breaker manually reset`);
    this.transitionToClosed();
  }

  /**
   * Get the current circuit state
   */
  getCurrentState(): CircuitState {
    return this.state;
  }
}
