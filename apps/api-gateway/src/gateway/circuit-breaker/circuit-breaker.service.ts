import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreaker } from './circuit-breaker';
import { CircuitBreakerState } from './circuit-breaker.types';
import { MetricsService } from '../services/metrics.service';

/**
 * Circuit Breaker Service
 *
 * Manages circuit breakers for all downstream microservices.
 * Each service gets its own circuit breaker instance with independent state.
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.initializeBreakers();
  }

  /**
   * Initialize circuit breakers for all known services
   */
  private initializeBreakers(): void {
    const services = ['identity', 'sports', 'clubs', 'communication'];

    services.forEach((serviceName) => {
      const breaker = new CircuitBreaker({
        name: serviceName,
        failureThreshold: this.configService.get<number>(
          `CIRCUIT_BREAKER_${serviceName.toUpperCase()}_FAILURE_THRESHOLD`,
          5,
        ),
        successThreshold: this.configService.get<number>(
          `CIRCUIT_BREAKER_${serviceName.toUpperCase()}_SUCCESS_THRESHOLD`,
          2,
        ),
        timeout: this.configService.get<number>(
          `CIRCUIT_BREAKER_${serviceName.toUpperCase()}_TIMEOUT`,
          60000,
        ),
        halfOpenMaxRequests: this.configService.get<number>(
          `CIRCUIT_BREAKER_${serviceName.toUpperCase()}_HALF_OPEN_MAX_REQUESTS`,
          3,
        ),
      });

      this.breakers.set(serviceName, breaker);
      this.logger.log(`Circuit breaker registered for service: ${serviceName}`);
    });
  }

  /**
   * Get circuit breaker for a specific service
   *
   * @param serviceKey - Service identifier (identity, sports, clubs, communication)
   * @returns CircuitBreaker instance
   */
  getCircuitBreaker(serviceKey: string): CircuitBreaker {
    const breaker = this.breakers.get(serviceKey);

    if (!breaker) {
      this.logger.warn(
        `Circuit breaker not found for service: ${serviceKey}. Creating default breaker.`,
      );

      // Create a default breaker if not found
      const defaultBreaker = new CircuitBreaker({
        name: serviceKey,
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        halfOpenMaxRequests: 3,
      });

      this.breakers.set(serviceKey, defaultBreaker);
      return defaultBreaker;
    }

    return breaker;
  }

  /**
   * Execute an operation through a circuit breaker
   *
   * @param serviceKey - Service identifier
   * @param operation - Async function to execute
   * @returns Result of the operation
   * @throws CircuitOpenException if circuit is open
   */
  async executeWithBreaker<T>(serviceKey: string, operation: () => Promise<T>): Promise<T> {
    const breaker = this.getCircuitBreaker(serviceKey);
    const stateBefore = breaker.getState().state;

    const result = await breaker.execute(operation);

    // Update metrics if state changed
    const stateAfter = breaker.getState().state;
    if (stateBefore !== stateAfter) {
      this.metricsService.updateCircuitBreakerState(serviceKey, stateAfter);
    }

    return result;
  }

  /**
   * Get states of all circuit breakers
   *
   * @returns Array of circuit breaker states
   */
  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.breakers.values()).map((breaker) => breaker.getState());
  }

  /**
   * Get state of a specific circuit breaker
   *
   * @param serviceKey - Service identifier
   * @returns Circuit breaker state or null if not found
   */
  getState(serviceKey: string): CircuitBreakerState | null {
    const breaker = this.breakers.get(serviceKey);
    return breaker ? breaker.getState() : null;
  }

  /**
   * Reset a specific circuit breaker
   *
   * @param serviceKey - Service identifier
   */
  reset(serviceKey: string): void {
    const breaker = this.breakers.get(serviceKey);
    if (breaker) {
      breaker.reset();
      this.logger.log(`Circuit breaker reset for service: ${serviceKey}`);
    } else {
      this.logger.warn(`Cannot reset - circuit breaker not found for service: ${serviceKey}`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker, serviceName) => {
      breaker.reset();
      this.logger.log(`Circuit breaker reset for service: ${serviceName}`);
    });
  }
}
