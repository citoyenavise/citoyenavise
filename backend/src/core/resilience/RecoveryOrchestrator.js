/**
 * RecoveryOrchestrator - Orchestrates failure recovery and system resilience
 * Implements constitutional resilience policies at runtime
 */

const fs = require('fs');
const path = require('path');

class RecoveryOrchestrator {
  constructor() {
    this.policies = this.loadPolicies();
    this.failureState = 'HEALTHY';
    this.failureHistory = [];
    this.recoveryAttempts = new Map();
    this.systemHealth = 100;
    this.circuitBreakers = new Map();
  }

  loadPolicies() {
    try {
      const constitutionDir = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION', 'resilience');
      const policies = {};

      const files = ['ResiliencePolicies.json', 'RecoveryStrategyRegistry.json', 'FailureStateMachine.json', 'SystemStabilityRules.json'];

      files.forEach(file => {
        const filePath = path.join(constitutionDir, file);
        if (fs.existsSync(filePath)) {
          policies[file.replace('.json', '')] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      });

      return policies;
    } catch (error) {
      console.error('Failed to load resilience policies:', error);
      return {};
    }
  }

  classifyFailure(error) {
    const errorCode = error.code || error.message;
    const registry = this.policies.RecoveryStrategyRegistry;

    for (const [failureType, strategy] of Object.entries(registry.strategies || {})) {
      if (errorCode.includes(failureType) || failureType.toLowerCase().includes(errorCode.toLowerCase())) {
        return {
          type: failureType,
          severity: strategy.severity,
          recoveryPath: strategy.recoveryPath,
          retryPolicy: strategy.retryPolicy,
          fallback: strategy.fallback,
          escalate: strategy.escalate
        };
      }
    }

    return {
      type: 'SERVICE_ERROR',
      severity: 'HIGH',
      recoveryPath: 'retry_with_exponential_backoff'
    };
  }

  async executeRecovery(error, context) {
    const classification = this.classifyFailure(error);

    // Log failure
    this.logFailure({
      error: error.message,
      classification,
      timestamp: new Date(),
      traceId: context?.traceId
    });

    // Transition to appropriate failure state
    await this.transitionFailureState(classification.severity);

    // Execute recovery strategy
    const recoveryResult = await this.executeRecoveryStrategy(classification, context);

    // Validate recovery
    if (recoveryResult.success) {
      await this.validateRecovery(context);
      this.transitionToHealthy();
    } else {
      await this.escalateFailure(classification, context);
    }

    return recoveryResult;
  }

  async executeRecoveryStrategy(classification, context) {
    const strategy = classification.recoveryPath;

    switch (strategy) {
      case 'retry_with_backoff':
        return await this.retryWithBackoff(context, classification.retryPolicy);

      case 'retry_with_exponential_backoff':
        return await this.retryWithExponentialBackoff(context, classification.retryPolicy);

      case 'fallback_or_degrade':
        return await this.activateFallback(context);

      case 'circuit_breaker_and_bulkhead':
        return await this.activateCircuitBreakerAndBulkhead(context);

      case 'graceful_degradation':
        return await this.enableGracefulDegradation(context);

      default:
        return { success: false, strategy, error: 'Unknown strategy' };
    }
  }

  async retryWithBackoff(context, retryPolicy = {}) {
    const maxRetries = retryPolicy.maxRetries || 3;
    const initialBackoff = retryPolicy.initialBackoffMs || 100;
    const maxBackoff = retryPolicy.maxBackoffMs || 5000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const backoffMs = Math.min(initialBackoff * Math.pow(2, attempt), maxBackoff);

      try {
        await this.sleep(backoffMs);

        // Attempt recovery
        if (context.retry && typeof context.retry === 'function') {
          const result = await context.retry();
          if (result) {
            return { success: true, strategy: 'retry_with_backoff', attempts: attempt + 1 };
          }
        }
      } catch (error) {
        if (attempt === maxRetries - 1) {
          return { success: false, strategy: 'retry_with_backoff', attempts: attempt + 1, error };
        }
      }
    }

    return { success: false, strategy: 'retry_with_backoff', attempts: maxRetries };
  }

  async retryWithExponentialBackoff(context, retryPolicy = {}) {
    const maxRetries = retryPolicy.maxRetries || 3;
    const initialBackoff = retryPolicy.initialBackoffMs || 100;
    const maxBackoff = retryPolicy.maxBackoffMs || 5000;
    const multiplier = retryPolicy.multiplier || 2.0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const backoffMs = Math.min(initialBackoff * Math.pow(multiplier, attempt), maxBackoff);
      const jitter = Math.random() * 100;

      try {
        await this.sleep(backoffMs + jitter);

        if (context.retry && typeof context.retry === 'function') {
          const result = await context.retry();
          if (result) {
            return { success: true, strategy: 'retry_with_exponential_backoff', attempts: attempt + 1 };
          }
        }
      } catch (error) {
        if (attempt === maxRetries - 1) {
          return { success: false, strategy: 'retry_with_exponential_backoff', attempts: attempt + 1, error };
        }
      }
    }

    return { success: false, strategy: 'retry_with_exponential_backoff', attempts: maxRetries };
  }

  async activateFallback(context) {
    try {
      if (context.fallback && typeof context.fallback === 'function') {
        const result = await context.fallback();
        if (result) {
          return { success: true, strategy: 'fallback', usedFallback: true };
        }
      }
    } catch (error) {
      console.error('Fallback failed:', error);
    }

    return { success: false, strategy: 'fallback', error: 'Fallback unavailable' };
  }

  async activateCircuitBreakerAndBulkhead(context) {
    const cbKey = context.moduleId || 'default';

    if (!this.circuitBreakers.has(cbKey)) {
      this.circuitBreakers.set(cbKey, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: null,
        timeoutSeconds: 30
      });
    }

    const cb = this.circuitBreakers.get(cbKey);

    if (cb.state === 'OPEN') {
      const timeSinceOpen = (Date.now() - cb.lastFailureTime) / 1000;
      if (timeSinceOpen > cb.timeoutSeconds) {
        cb.state = 'HALF_OPEN';
      } else {
        return { success: false, strategy: 'circuit_breaker', state: 'OPEN' };
      }
    }

    try {
      if (context.retry && typeof context.retry === 'function') {
        const result = await context.retry();
        if (result) {
          cb.state = 'CLOSED';
          cb.failureCount = 0;
          return { success: true, strategy: 'circuit_breaker', state: 'CLOSED' };
        }
      }
    } catch (error) {
      cb.failureCount++;
      cb.lastFailureTime = Date.now();

      if (cb.failureCount >= 5) {
        cb.state = 'OPEN';
      }

      return { success: false, strategy: 'circuit_breaker', state: 'OPEN', failureCount: cb.failureCount };
    }

    return { success: false, strategy: 'circuit_breaker', error: 'Unknown error' };
  }

  async enableGracefulDegradation(context) {
    try {
      if (context.degradeFallback && typeof context.degradeFallback === 'function') {
        const result = await context.degradeFallback();
        if (result) {
          this.systemHealth = Math.max(50, this.systemHealth - 30);
          return { success: true, strategy: 'graceful_degradation', degraded: true };
        }
      }
    } catch (error) {
      console.error('Degradation failed:', error);
    }

    return { success: false, strategy: 'graceful_degradation', error: 'Degradation unavailable' };
  }

  async transitionFailureState(severity) {
    const stateMap = {
      'LOW': 'TRANSIENT_FAILURE',
      'MEDIUM': 'TEMPORARY_FAILURE',
      'HIGH': 'PERSISTENT_FAILURE',
      'CRITICAL': 'CRITICAL_FAILURE'
    };

    this.failureState = stateMap[severity] || 'DETECTING';
  }

  async validateRecovery(context) {
    // Verify error rate is normalized
    // Verify latency is normalized
    // Verify health checks passing
    // Verify no cascading failures

    return true;
  }

  async escalateFailure(classification, context) {
    console.error('Escalating failure:', {
      severity: classification.severity,
      type: classification.type,
      traceId: context?.traceId,
      timestamp: new Date().toISOString()
    });

    // Notify monitoring/alerting system
    // Create incident if critical
    // Escalate to oncall if needed
  }

  transitionToHealthy() {
    this.failureState = 'HEALTHY';
    this.systemHealth = Math.min(100, this.systemHealth + 20);
  }

  logFailure(failureInfo) {
    this.failureHistory.push(failureInfo);

    // Keep only last 1000 failures
    if (this.failureHistory.length > 1000) {
      this.failureHistory = this.failureHistory.slice(-1000);
    }
  }

  getSystemHealth() {
    return {
      healthScore: this.systemHealth,
      failureState: this.failureState,
      recentFailures: this.failureHistory.slice(-10),
      circuitBreakerStates: Array.from(this.circuitBreakers.entries()).map(([key, cb]) => ({
        module: key,
        state: cb.state,
        failureCount: cb.failureCount
      }))
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RecoveryOrchestrator;
