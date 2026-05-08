/**
 * RecoveryDecisionExecution.js - Execute approved recovery decisions only
 * PHASE 3B: Optimization - Restrict self-healing to execution responsibility
 *
 * Responsibility: Execute recovery actions (NOT classify, NOT validate)
 * - Self-healing does NOT classify failures (RecoveryEngine does)
 * - Self-healing does NOT validate operations (ValidationEngine does)
 * - Self-healing executes approved LOW/MEDIUM recovery actions only
 * - HIGH/CRITICAL failures remain escalation-only (human/recovery engine)
 * - Strict responsibility isolation from classification/validation layers
 */

class RecoveryDecisionExecution {
  constructor(constitutionManager) {
    if (!constitutionManager) {
      throw new Error('constitutionManager required');
    }

    this.constitutionManager = constitutionManager;
    this.executedRecoveries = [];
    this.executionMetrics = {
      decisionRequested: 0,
      decisionApproved: 0,
      decisionDenied: 0,
      executionsAttempted: 0,
      executionsSuccessful: 0,
      executionsFailed: 0,
      escalations: 0
    };
  }

  /**
   * Request recovery execution (does NOT classify or validate)
   * Input: PRE-CLASSIFIED failure with severity and recovery strategy
   * Output: Execute or Escalate
   */
  async executeRecoveryDecision(preClassifiedFailure, context) {
    this.executionMetrics.decisionRequested++;

    // CRITICAL RULE: Never execute for HIGH/CRITICAL
    if (['HIGH', 'CRITICAL'].includes(preClassifiedFailure.severity)) {
      this.executionMetrics.escalations++;
      return {
        executionAllowed: false,
        decision: 'ESCALATE',
        severity: preClassifiedFailure.severity,
        reason: 'HIGH/CRITICAL failures require human/recovery-engine escalation',
        mustEscalate: true
      };
    }

    // Only execute for LOW/MEDIUM
    if (!['LOW', 'MEDIUM'].includes(preClassifiedFailure.severity)) {
      this.executionMetrics.decisionDenied++;
      return {
        executionAllowed: false,
        decision: 'UNKNOWN_SEVERITY',
        severity: preClassifiedFailure.severity,
        reason: 'Unknown severity level'
      };
    }

    // Check if recovery strategy is auto-executable
    const isAutoExecutable = this._isStrategyAutoExecutable(
      preClassifiedFailure.recoveryStrategy,
      preClassifiedFailure.severity
    );

    if (!isAutoExecutable) {
      this.executionMetrics.decisionDenied++;
      return {
        executionAllowed: false,
        decision: 'STRATEGY_NOT_EXECUTABLE',
        strategy: preClassifiedFailure.recoveryStrategy,
        reason: `Strategy ${preClassifiedFailure.recoveryStrategy} not auto-executable`
      };
    }

    this.executionMetrics.decisionApproved++;

    // Execute the recovery action
    return this._executeRecoveryAction(preClassifiedFailure, context);
  }

  /**
   * Determine if recovery strategy is auto-executable
   * Only RETRY and FALLBACK are auto-executable for LOW/MEDIUM
   * ISOLATE, COMPENSATE, SHUTDOWN require human decision
   */
  _isStrategyAutoExecutable(strategy, severity) {
    const autoExecutable = {
      'LOW': ['RETRY', 'FALLBACK'],
      'MEDIUM': ['RETRY', 'FALLBACK']
    };

    const allowed = autoExecutable[severity] || [];
    return allowed.includes(strategy);
  }

  /**
   * Execute the recovery action
   * Private method — actual recovery execution
   */
  async _executeRecoveryAction(failure, context) {
    this.executionMetrics.executionsAttempted++;

    try {
      let result;

      if (failure.recoveryStrategy === 'RETRY') {
        result = await this._executeRetry(failure, context);
      } else if (failure.recoveryStrategy === 'FALLBACK') {
        result = await this._executeFallback(failure, context);
      } else {
        return {
          executionAllowed: false,
          decision: 'UNKNOWN_STRATEGY',
          strategy: failure.recoveryStrategy
        };
      }

      if (result.success) {
        this.executionMetrics.executionsSuccessful++;
        this._recordRecoveryExecution(failure, result);
        return {
          executionAllowed: true,
          decision: 'EXECUTED',
          strategy: failure.recoveryStrategy,
          result: result,
          timestamp: new Date().toISOString()
        };
      } else {
        this.executionMetrics.executionsFailed++;
        return {
          executionAllowed: false,
          decision: 'EXECUTION_FAILED',
          strategy: failure.recoveryStrategy,
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      this.executionMetrics.executionsFailed++;
      return {
        executionAllowed: false,
        decision: 'EXECUTION_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute RETRY strategy
   */
  async _executeRetry(failure, context) {
    const retryPolicy = {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoff_ms: 10000
    };

    let attempt = 0;
    let lastError = null;
    let delay = 1000; // Start with 1 second

    while (attempt < retryPolicy.maxRetries) {
      attempt++;

      try {
        // Simulate retry of failed operation
        // In real implementation, this would call the actual operation again
        const retryResult = await this._retryOperation(failure.sourceModule, failure.context);

        if (retryResult.success) {
          return {
            success: true,
            strategy: 'RETRY',
            attempt,
            message: `Retry succeeded on attempt ${attempt}`,
            result: retryResult
          };
        }

        lastError = retryResult.error;

        // Exponential backoff
        if (attempt < retryPolicy.maxRetries) {
          delay = Math.min(delay * retryPolicy.backoffMultiplier, retryPolicy.maxBackoff_ms);
          await this._sleep(delay);
        }

      } catch (error) {
        lastError = error.message;
      }
    }

    return {
      success: false,
      strategy: 'RETRY',
      attempts: attempt,
      error: `All ${retryPolicy.maxRetries} retry attempts failed: ${lastError}`
    };
  }

  /**
   * Execute FALLBACK strategy
   */
  async _executeFallback(failure, context) {
    try {
      // Fallback: use default values / degraded mode
      const fallbackResult = await this._activateFallback(failure.sourceModule, failure.context);

      if (fallbackResult.success) {
        return {
          success: true,
          strategy: 'FALLBACK',
          message: 'Fallback activated',
          degradation: 'PARTIAL',
          result: fallbackResult
        };
      }

      return {
        success: false,
        strategy: 'FALLBACK',
        error: fallbackResult.error
      };

    } catch (error) {
      return {
        success: false,
        strategy: 'FALLBACK',
        error: error.message
      };
    }
  }

  /**
   * Retry operation (placeholder — actual implementation in recovery layer)
   */
  async _retryOperation(moduleId, context) {
    // Placeholder: real implementation would retry the actual operation
    return {
      success: Math.random() > 0.3, // 70% success rate for demo
      result: { retried: true, moduleId, context }
    };
  }

  /**
   * Activate fallback mode (placeholder)
   */
  async _activateFallback(moduleId, context) {
    // Placeholder: real implementation would switch module to degraded mode
    return {
      success: true,
      fallback: true,
      moduleId,
      degradation: 'PARTIAL'
    };
  }

  /**
   * Sleep utility for backoff
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record recovery execution in audit trail
   */
  _recordRecoveryExecution(failure, result) {
    const execution = {
      timestamp: new Date().toISOString(),
      failureId: failure.id,
      strategy: failure.recoveryStrategy,
      severity: failure.severity,
      result: result.success ? 'SUCCESS' : 'FAILED',
      details: result
    };

    this.executedRecoveries.push(execution);

    // Keep only last 1000 executions
    if (this.executedRecoveries.length > 1000) {
      this.executedRecoveries.shift();
    }
  }

  /**
   * Check if failure can be auto-recovered
   * (Helper for external systems to know if escalation is needed)
   */
  canAutoRecover(failure) {
    if (['HIGH', 'CRITICAL'].includes(failure.severity)) {
      return { canRecover: false, mustEscalate: true };
    }

    const isExecutable = this._isStrategyAutoExecutable(
      failure.recoveryStrategy,
      failure.severity
    );

    return { canRecover: isExecutable, mustEscalate: !isExecutable };
  }

  /**
   * Get execution metrics
   */
  getMetrics() {
    return {
      ...this.executionMetrics,
      successRate: this.executionMetrics.executionsAttempted > 0
        ? (this.executionMetrics.executionsSuccessful / this.executionMetrics.executionsAttempted * 100).toFixed(2) + '%'
        : 'N/A',
      approvalRate: this.executionMetrics.decisionRequested > 0
        ? (this.executionMetrics.decisionApproved / this.executionMetrics.decisionRequested * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(limit = 50) {
    return this.executedRecoveries.slice(-limit);
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.executionMetrics = {
      decisionRequested: 0,
      decisionApproved: 0,
      decisionDenied: 0,
      executionsAttempted: 0,
      executionsSuccessful: 0,
      executionsFailed: 0,
      escalations: 0
    };
    return { reset: true };
  }
}

module.exports = RecoveryDecisionExecution;
