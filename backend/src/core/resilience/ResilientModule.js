/**
 * ResilientModule - Mixin providing resilience capabilities to all modules
 * Implements auto-recovery, circuit breaker, and graceful degradation
 */

const RecoveryOrchestrator = require('./RecoveryOrchestrator');

class ResilientModule {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.orchestra =new RecoveryOrchestrator();
    this.healthyCallCount = 0;
    this.failureCallCount = 0;
    this.degradedMode = false;
  }

  /**
   * Wrap any function with automatic recovery
   */
  async withRecovery(fn, context = {}, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || 5000;
    const fallback = options.fallback || (() => ({ degraded: true }));

    context.moduleId = this.moduleName;
    context.retry = fn;
    context.fallback = fallback;

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), timeout)
        )
      ]);

      this.healthyCallCount++;
      return result;
    } catch (error) {
      this.failureCallCount++;

      // Classify and recover
      const recovery = await this.orchestra.executeRecovery(error, context);

      if (recovery.success) {
        return { recovered: true, ...recovery };
      } else {
        // Fall back to degraded response
        return await fallback();
      }
    }
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async withCircuitBreaker(operation, serviceName, options = {}) {
    const context = {
      moduleId: this.moduleName,
      serviceName,
      retry: operation,
      fallback: options.fallback || (() => null)
    };

    return await this.orchestra.activateCircuitBreakerAndBulkhead(context);
  }

  /**
   * Execute operation with automatic fallback
   */
  async withFallback(primary, fallback) {
    try {
      return await primary();
    } catch (error) {
      console.warn(`Primary operation failed for ${this.moduleName}, using fallback:`, error.message);

      try {
        return await fallback();
      } catch (fallbackError) {
        console.error(`Fallback also failed for ${this.moduleName}:`, fallbackError.message);
        throw fallbackError;
      }
    }
  }

  /**
   * Enable graceful degradation
   */
  enableDegradedMode() {
    this.degradedMode = true;
    console.warn(`Module ${this.moduleName} switched to degraded mode`);
  }

  /**
   * Check if in degraded mode
   */
  isDegraded() {
    return this.degradedMode;
  }

  /**
   * Get module health status
   */
  getHealth() {
    const total = this.healthyCallCount + this.failureCallCount;
    const successRate = total > 0 ? (this.healthyCallCount / total * 100).toFixed(1) : 100;

    return {
      module: this.moduleName,
      healthy: !this.degradedMode,
      degraded: this.degradedMode,
      successRate: `${successRate}%`,
      totalCalls: total,
      failureCount: this.failureCallCount,
      systemHealth: this.orchestra.getSystemHealth()
    };
  }

  /**
   * Reset health counters (after recovery)
   */
  resetCounters() {
    this.healthyCallCount = 0;
    this.failureCallCount = 0;
    this.degradedMode = false;
  }
}

module.exports = ResilientModule;
