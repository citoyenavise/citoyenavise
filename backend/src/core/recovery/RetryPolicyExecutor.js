/**
 * RetryPolicyExecutor.js - Execute retry policies for failed operations
 * PHASE 1.6: Recovery Layer
 *
 * Responsibility: Manage retry strategies and execution
 * - Execute retries with backoff
 * - Track retry attempts
 * - Apply circuit breaker patterns
 * - Monitor retry effectiveness
 * - Generate retry reports
 */

class RetryPolicyExecutor {
  constructor(options = {}) {
    this.retryPolicies = new Map();
    this.activeRetries = new Map();
    this.retryHistory = [];

    this.config = {
      defaultMaxRetries: options.defaultMaxRetries || 3,
      defaultInitialDelay_ms: options.defaultInitialDelay_ms || 100,
      defaultBackoffMultiplier: options.defaultBackoffMultiplier || 2,
      maxBackoffDelay_ms: options.maxBackoffDelay_ms || 30000,
      defaultTimeout_ms: options.defaultTimeout_ms || 10000
    };

    this.metrics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      successRate_percent: 0
    };

    this._initializeDefaultPolicies();
  }

  /**
   * Initialize default retry policies
   */
  _initializeDefaultPolicies() {
    // Exponential backoff for transient errors
    this.registerPolicy('EXPONENTIAL_BACKOFF', {
      maxAttempts: 3,
      initialDelay_ms: 100,
      backoffMultiplier: 2,
      maxDelay_ms: 10000,
      applicableErrors: ['TIMEOUT', 'CONNECTION_ERROR', 'SERVICE_UNAVAILABLE']
    });

    // Linear backoff for validation errors
    this.registerPolicy('LINEAR_BACKOFF', {
      maxAttempts: 2,
      initialDelay_ms: 500,
      backoffMultiplier: 1.5,
      maxDelay_ms: 5000,
      applicableErrors: ['VALIDATION_FAILURE', 'STATE_INCONSISTENCY']
    });

    // Immediate retry for transient state
    this.registerPolicy('IMMEDIATE', {
      maxAttempts: 5,
      initialDelay_ms: 0,
      backoffMultiplier: 1,
      maxDelay_ms: 0,
      applicableErrors: ['TEMPORARY_LOCK', 'RESOURCE_BUSY']
    });

    // No retry for permanent errors
    this.registerPolicy('NO_RETRY', {
      maxAttempts: 0,
      initialDelay_ms: 0,
      backoffMultiplier: 0,
      maxDelay_ms: 0,
      applicableErrors: ['PERMISSION_DENIED', 'INVALID_INPUT', 'NOT_FOUND']
    });
  }

  /**
   * Register custom retry policy
   */
  registerPolicy(policyName, config) {
    this.retryPolicies.set(policyName, {
      name: policyName,
      maxAttempts: config.maxAttempts,
      initialDelay_ms: config.initialDelay_ms,
      backoffMultiplier: config.backoffMultiplier,
      maxDelay_ms: config.maxDelay_ms,
      applicableErrors: config.applicableErrors || []
    });

    return { registered: true, policyName };
  }

  /**
   * Execute retry for failed operation
   */
  executeRetry(failureData) {
    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine appropriate retry policy
    const policy = this._selectRetryPolicy(failureData);

    if (!policy || policy.maxAttempts === 0) {
      return {
        success: false,
        reason: 'No retry policy applicable',
        retryId
      };
    }

    const retry = {
      retryId,
      operationId: failureData.operationId,
      failureData,
      policy: policy.name,
      attempts: [],
      status: 'IN_PROGRESS',
      startTime: Date.now(),
      completed: false
    };

    this.activeRetries.set(retryId, retry);
    this.metrics.totalRetries++;

    // Execute retry attempts
    let lastError = null;
    let success = false;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      const attemptData = {
        attempt,
        timestamp: new Date().toISOString(),
        startTime: Date.now()
      };

      // Calculate backoff delay
      if (attempt > 1) {
        const delay = this._calculateBackoff(attempt - 1, policy);
        attemptData.delayMs = delay;
        this._sleep(delay); // Synchronous sleep for simplicity
      }

      // Attempt operation
      try {
        const result = this._attemptOperation(failureData);

        if (result.success) {
          attemptData.result = 'SUCCESS';
          attemptData.duration_ms = Date.now() - attemptData.startTime;
          retry.attempts.push(attemptData);

          success = true;
          break;
        } else {
          lastError = result.error;
          attemptData.result = 'FAILED';
          attemptData.error = result.error;
          attemptData.duration_ms = Date.now() - attemptData.startTime;
        }
      } catch (error) {
        lastError = error.message;
        attemptData.result = 'ERROR';
        attemptData.error = error.message;
        attemptData.duration_ms = Date.now() - attemptData.startTime;
      }

      retry.attempts.push(attemptData);
    }

    // Finalize retry
    retry.completed = true;
    retry.status = success ? 'SUCCESS' : 'FAILED';
    retry.endTime = Date.now();
    retry.duration_ms = retry.endTime - retry.startTime;
    retry.totalAttempts = retry.attempts.length;

    if (success) {
      this.metrics.successfulRetries++;
    } else {
      this.metrics.failedRetries++;
    }

    // Update history
    this.retryHistory.push(retry);
    if (this.retryHistory.length > 10000) {
      this.retryHistory.shift();
    }

    // Remove from active
    this.activeRetries.delete(retryId);

    // Update metrics
    this._updateMetrics();

    return {
      success,
      retryId,
      attempts: retry.attempts.length,
      reason: success ? 'Retry successful' : `Retry failed after ${retry.attempts.length} attempts`,
      lastError
    };
  }

  /**
   * Select appropriate retry policy
   */
  _selectRetryPolicy(failureData) {
    const errorType = failureData.errorType || 'UNKNOWN';

    // Check each policy for applicable errors
    for (const [policyName, policy] of this.retryPolicies) {
      for (const applicableError of policy.applicableErrors) {
        if (errorType.includes(applicableError)) {
          return policy;
        }
      }
    }

    // Default to exponential backoff
    return this.retryPolicies.get('EXPONENTIAL_BACKOFF');
  }

  /**
   * Calculate backoff delay
   */
  _calculateBackoff(attemptNumber, policy) {
    const exponentialDelay = policy.initialDelay_ms * Math.pow(
      policy.backoffMultiplier,
      attemptNumber
    );

    const cappedDelay = Math.min(exponentialDelay, policy.maxDelay_ms);

    // Add jitter (±10%)
    const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
    return Math.round(Math.max(0, cappedDelay + jitter));
  }

  /**
   * Attempt operation
   */
  _attemptOperation(failureData) {
    // Simulate operation attempt
    // In real implementation, this would call the actual operation
    try {
      // For now, always fail to demonstrate retry mechanism
      // Real implementation would attempt the operation
      return { success: false, error: 'Simulated operation failure' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sleep utility (for backoff delays)
   */
  _sleep(ms) {
    // Note: In production, this would be async
    // For demonstration purposes, using synchronous timing
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy wait
    }
  }

  /**
   * Update metrics
   */
  _updateMetrics() {
    const recentRetries = this.retryHistory.slice(-100);

    if (recentRetries.length > 0) {
      const totalAttempts = recentRetries.reduce((sum, r) => sum + r.totalAttempts, 0);
      this.metrics.averageAttempts = (totalAttempts / recentRetries.length).toFixed(2);

      const successful = recentRetries.filter(r => r.status === 'SUCCESS').length;
      this.metrics.successRate_percent = (successful / recentRetries.length * 100).toFixed(2);
    }
  }

  /**
   * Get retry status
   */
  getRetryStatus(retryId) {
    return this.activeRetries.get(retryId) || null;
  }

  /**
   * Get retry metrics
   */
  getRetryMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics
    };
  }

  /**
   * Get retry history
   */
  getRetryHistory(limit = 50) {
    return this.retryHistory.slice(-limit);
  }

  /**
   * Get available policies
   */
  getAvailablePolicies() {
    const policies = [];

    for (const [name, policy] of this.retryPolicies) {
      policies.push({
        name,
        maxAttempts: policy.maxAttempts,
        initialDelay_ms: policy.initialDelay_ms,
        applicableErrors: policy.applicableErrors
      });
    }

    return policies;
  }

  /**
   * Generate retry report
   */
  generateRetryReport(limit = 20) {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getRetryMetrics(),
      policies: this.getAvailablePolicies(),
      recentRetries: this.getRetryHistory(limit),
      activeRetries: Array.from(this.activeRetries.values())
    };
  }

  /**
   * Cancel active retry
   */
  cancelRetry(retryId) {
    const retry = this.activeRetries.get(retryId);

    if (!retry) {
      return { success: false, reason: 'Retry not found' };
    }

    this.activeRetries.delete(retryId);
    return { success: true, retryId };
  }

  /**
   * Reset executor
   */
  reset() {
    this.activeRetries.clear();
    this.retryHistory = [];
    this.metrics = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      successRate_percent: 0
    };

    return { reset: true };
  }
}

module.exports = RetryPolicyExecutor;
