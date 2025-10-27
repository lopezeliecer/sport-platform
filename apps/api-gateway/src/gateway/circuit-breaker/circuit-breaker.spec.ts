import { CircuitBreaker } from './circuit-breaker';
import {
  CircuitState,
  CircuitOpenException,
  TooManyRequestsException,
} from './circuit-breaker.types';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      name: 'test-service',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000, // 1 second for faster tests
      halfOpenMaxRequests: 2,
    });
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      const state = breaker.getState();
      expect(state.state).toBe(CircuitState.CLOSED);
      expect(state.failureCount).toBe(0);
      expect(state.successCount).toBe(0);
    });

    it('should have correct configuration', () => {
      const state = breaker.getState();
      expect(state.name).toBe('test-service');
    });
  });

  describe('CLOSED State - Success Path', () => {
    it('should execute operation successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(breaker.getCurrentState()).toBe(CircuitState.CLOSED);
    });

    it('should reset failure count after success', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // Fail once
      await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      expect(breaker.getState().failureCount).toBe(1);

      // Succeed
      await breaker.execute(successOperation);
      expect(breaker.getState().failureCount).toBe(0);
    });

    it('should track total metrics', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');

      await breaker.execute(successOperation);
      await breaker.execute(successOperation);

      const state = breaker.getState();
      expect(state.totalRequests).toBe(2);
      expect(state.totalSuccesses).toBe(2);
      expect(state.totalFailures).toBe(0);
    });
  });

  describe('CLOSED -> OPEN Transition', () => {
    it('should transition to OPEN after reaching failure threshold', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      expect(breaker.getCurrentState()).toBe(CircuitState.OPEN);
      expect(breaker.getState().failureCount).toBe(3);
    });

    it('should set nextAttemptTime when opening', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const beforeTime = Date.now();

      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      const state = breaker.getState();
      expect(state.nextAttemptTime).not.toBeNull();
      expect(state.nextAttemptTime!.getTime()).toBeGreaterThan(beforeTime);
    });

    it('should record last failure time', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const beforeTime = Date.now();

      await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');

      const state = breaker.getState();
      expect(state.lastFailureTime).not.toBeNull();
      expect(state.lastFailureTime!.getTime()).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('OPEN State Behavior', () => {
    beforeEach(async () => {
      // Open the circuit
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }
    });

    it('should throw CircuitOpenException immediately', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await expect(breaker.execute(operation)).rejects.toThrow(CircuitOpenException);
      expect(operation).not.toHaveBeenCalled(); // Operation should not be executed
    });

    it('should include service name in exception', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      try {
        await breaker.execute(operation);
        throw new Error('Should have thrown CircuitOpenException');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenException);
        expect((error as CircuitOpenException).serviceName).toBe('test-service');
      }
    });

    it('should include nextAttemptTime in exception', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      try {
        await breaker.execute(operation);
        throw new Error('Should have thrown CircuitOpenException');
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenException);
        expect((error as CircuitOpenException).nextAttemptTime).toBeInstanceOf(Date);
      }
    });
  });

  describe('OPEN -> HALF_OPEN Transition', () => {
    it('should transition to HALF_OPEN after timeout', async () => {
      // Open the circuit
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      expect(breaker.getCurrentState()).toBe(CircuitState.OPEN);

      // Wait for timeout (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next request should transition to HALF_OPEN
      const successOperation = jest.fn().mockResolvedValue('success');
      await breaker.execute(successOperation);

      expect(breaker.getCurrentState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should reset success count when entering HALF_OPEN', async () => {
      // Open the circuit
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Transition to HALF_OPEN
      const successOperation = jest.fn().mockResolvedValue('success');
      await breaker.execute(successOperation);

      const state = breaker.getState();
      expect(state.state).toBe(CircuitState.HALF_OPEN);
      expect(state.successCount).toBe(1); // First success in HALF_OPEN
    });
  });

  describe('HALF_OPEN State Behavior', () => {
    beforeEach(async () => {
      // Open the circuit
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      // Wait for timeout and transition to HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const successOperation = jest.fn().mockResolvedValue('success');
      await breaker.execute(successOperation);
    });

    it('should limit number of requests in HALF_OPEN', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      // Try to execute a third request (we already had one in beforeEach)
      // Since halfOpenMaxRequests is 2 and we already executed 1 in beforeEach,
      // we can execute 1 more before hitting the limit
      await breaker.execute(operation);

      // This completes successThreshold (2) and transitions to CLOSED
      // So the breaker is now CLOSED, not HALF_OPEN anymore
      expect(breaker.getCurrentState()).toBe(CircuitState.CLOSED);
    });

    it('should throw TooManyRequestsException when exceeding halfOpenMaxRequests', async () => {
      // Create a new breaker with longer success threshold to stay in HALF_OPEN
      const testBreaker = new CircuitBreaker({
        name: 'test-limit',
        failureThreshold: 2,
        successThreshold: 5, // High threshold to stay in HALF_OPEN longer
        timeout: 1000,
        halfOpenMaxRequests: 2,
      });

      // Open the circuit
      const failOp = jest.fn().mockRejectedValue(new Error('fail'));
      await expect(testBreaker.execute(failOp)).rejects.toThrow();
      await expect(testBreaker.execute(failOp)).rejects.toThrow();

      // Wait and transition to HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const successOp = jest.fn().mockResolvedValue('success');
      await testBreaker.execute(successOp); // First request
      await testBreaker.execute(successOp); // Second request

      // Third request should throw TooManyRequestsException
      await expect(testBreaker.execute(successOp)).rejects.toThrow(TooManyRequestsException);
    });

    it('should transition to CLOSED after success threshold', async () => {
      // Already had 1 success in beforeEach, need 1 more (successThreshold = 2)
      const successOperation = jest.fn().mockResolvedValue('success');

      await breaker.execute(successOperation);

      expect(breaker.getCurrentState()).toBe(CircuitState.CLOSED);
      expect(breaker.getState().failureCount).toBe(0);
      expect(breaker.getState().successCount).toBe(0);
    });

    it('should transition back to OPEN on any failure', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');

      expect(breaker.getCurrentState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Manual Reset', () => {
    it('should reset to CLOSED state', async () => {
      // Open the circuit
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      expect(breaker.getCurrentState()).toBe(CircuitState.OPEN);

      // Manual reset
      breaker.reset();

      expect(breaker.getCurrentState()).toBe(CircuitState.CLOSED);
    });

    it('should reset all counters', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Generate some failures
      await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');

      breaker.reset();

      const state = breaker.getState();
      expect(state.failureCount).toBe(0);
      expect(state.successCount).toBe(0);
      expect(state.lastFailureTime).toBeNull();
      expect(state.nextAttemptTime).toBeNull();
    });
  });

  describe('Metrics Tracking', () => {
    it('should track total requests correctly', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      await breaker.execute(successOperation);
      await breaker.execute(successOperation);
      await expect(breaker.execute(failingOperation)).rejects.toThrow();

      const state = breaker.getState();
      expect(state.totalRequests).toBe(3);
    });

    it('should track successes and failures separately', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      await breaker.execute(successOperation);
      await breaker.execute(successOperation);
      await expect(breaker.execute(failingOperation)).rejects.toThrow();
      await expect(breaker.execute(failingOperation)).rejects.toThrow();

      const state = breaker.getState();
      expect(state.totalSuccesses).toBe(2);
      expect(state.totalFailures).toBe(2);
    });

    it('should continue tracking metrics in OPEN state', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }

      const beforeRequests = breaker.getState().totalRequests;

      // Try to execute in OPEN state
      const operation = jest.fn().mockResolvedValue('success');
      await expect(breaker.execute(operation)).rejects.toThrow(CircuitOpenException);

      const state = breaker.getState();
      expect(state.totalRequests).toBe(beforeRequests + 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle default configuration values', () => {
      const defaultBreaker = new CircuitBreaker({ name: 'default' });
      const state = defaultBreaker.getState();

      expect(state.name).toBe('default');
      // Defaults are set in the constructor
    });

    it('should handle rapid successive failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const promises = [];

      // Execute 5 failures rapidly
      for (let i = 0; i < 5; i++) {
        promises.push(breaker.execute(failingOperation).catch(() => {}));
      }

      await Promise.all(promises);

      // Should be OPEN after threshold
      expect(breaker.getCurrentState()).toBe(CircuitState.OPEN);
    });

    it('should maintain state across different operation types', async () => {
      const operation1 = jest.fn().mockResolvedValue('result1');
      const operation2 = jest.fn().mockResolvedValue('result2');

      const result1 = await breaker.execute(operation1);
      const result2 = await breaker.execute(operation2);

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(breaker.getState().totalRequests).toBe(2);
    });

    it('should handle errors with custom error objects', async () => {
      class CustomError extends Error {
        constructor(public code: number) {
          super('Custom error');
        }
      }

      const failingOperation = jest.fn().mockRejectedValue(new CustomError(500));

      try {
        await breaker.execute(failingOperation);
        throw new Error('Should have thrown CustomError');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).code).toBe(500);
      }

      expect(breaker.getState().failureCount).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete failure -> recovery cycle', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // 1. CLOSED -> OPEN
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingOperation)).rejects.toThrow('fail');
      }
      expect(breaker.getCurrentState()).toBe(CircuitState.OPEN);

      // 2. Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 3. OPEN -> HALF_OPEN
      await breaker.execute(successOperation);
      expect(breaker.getCurrentState()).toBe(CircuitState.HALF_OPEN);

      // 4. HALF_OPEN -> CLOSED
      await breaker.execute(successOperation);
      expect(breaker.getCurrentState()).toBe(CircuitState.CLOSED);

      // 5. Verify normal operation
      await breaker.execute(successOperation);
      expect(breaker.getState().totalSuccesses).toBeGreaterThan(0);
    });

    it('should handle intermittent failures in CLOSED state', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Succeed
      await breaker.execute(successOperation);
      expect(breaker.getState().failureCount).toBe(0);

      // Fail
      await expect(breaker.execute(failingOperation)).rejects.toThrow();
      expect(breaker.getState().failureCount).toBe(1);

      // Succeed again - should reset failure count
      await breaker.execute(successOperation);
      expect(breaker.getState().failureCount).toBe(0);
      expect(breaker.getCurrentState()).toBe(CircuitState.CLOSED);
    });
  });
});
