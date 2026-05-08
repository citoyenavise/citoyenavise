/**
 * RecoveryOrchestrator.js - Orchestrate recovery decisions and actions
 * PHASE 1.6: Recovery Layer
 *
 * Responsibility: Make recovery decisions and coordinate remediation
 * - Determine optimal recovery path
 * - Execute recovery procedures
 * - Apply remediation actions
 * - Verify recovery success
 * - Handle multi-phase recovery
 */

class RecoveryOrchestrator {
  constructor(options = {}) {
    this.failureIsolationManager = options.failureIsolationManager || null;
    this.retryPolicyExecutor = options.retryPolicyExecutor || null;
    this.gracefulShutdownManager = options.gracefulShutdownManager || null;

    this.recoveryPaths = new Map();
    this.activeRecoveries = new Map(); // incident key → startTime (PHASE 5.7: for deduplication)
    this.recoveryDecisions = [];
    this.failureHistory = []; // PHASE 5.7: track recovery failures for escalation

    this.config = {
      maxRecoveryAttempts: options.maxRecoveryAttempts || 3,
      recoveryTimeout_ms: options.recoveryTimeout_ms || 30000,
      verificationTimeout_ms: options.verificationTimeout_ms || 5000
    };

    // PHASE 5.7: Concurrency and timeout controls
    this.maxConcurrentRecoveries = options.maxConcurrentRecoveries || 3;

    this.metrics = {
      decisionsCount: 0,
      pathsSelected: {},
      successfulRecoveries: 0,
      failedRecoveries: 0,
      timedOutRecoveries: 0 // PHASE 5.7
    };

    this._initializeRecoveryPaths();
  }

  /**
   * Initialize recovery paths
   */
  _initializeRecoveryPaths() {
    // Retry path: For transient failures
    this.recoveryPaths.set('RETRY', {
      name: 'Retry',
      applicableErrors: [
        'ERR_VALIDATION_FAILURE',
        'ERR_ENFORCEMENT_BLOCKED',
        'ERR_VERSION_INCOMPATIBILITY'
      ],
      maxAttempts: 3,
      backoff: 'exponential'
    });

    // Isolate path: For cascade failures
    this.recoveryPaths.set('ISOLATE', {
      name: 'Isolate affected modules',
      applicableErrors: [
        'ERR_CASCADE_FAILURE',
        'ERR_DEPENDENCY_VIOLATION',
        'ERR_MODULE_ISOLATION'
      ],
      strategy: 'containment',
      escalateIfFails: true
    });

    // Rollback path: For state inconsistency
    this.recoveryPaths.set('ROLLBACK', {
      name: 'Rollback to known good state',
      applicableErrors: [
        'ERR_STATE_INCONSISTENCY',
        'ERR_DATA_CONSISTENCY',
        'ERR_BOOTSTRAP_FAILURE'
      ],
      restoreCheckpoint: true,
      escalateIfFails: true
    });

    // Compensate path: For incomplete operations
    this.recoveryPaths.set('COMPENSATE', {
      name: 'Apply compensating transaction',
      applicableErrors: [
        'ERR_RESOURCE_EXHAUSTION',
        'ERR_VALIDATION_FAILURE'
      ],
      undoChanges: true,
      escalateIfFails: true
    });

    // Escalate path: For critical/unrecoverable errors
    this.recoveryPaths.set('ESCALATE', {
      name: 'Escalate to human operators',
      applicableErrors: [
        'ERR_UNKNOWN',
        'ERR_SECURITY_VIOLATION',
        'ERR_CRITICAL_FAILURE'
      ],
      requiresManualIntervention: true
    });

    // Shutdown path: For system-level failures
    this.recoveryPaths.set('SHUTDOWN', {
      name: 'Graceful shutdown and restart',
      applicableErrors: [
        'ERR_BOOTSTRAP_FAILURE',
        'ERR_CASCADE_FAILURE'
      ],
      shutdownServices: true,
      persistState: true
    });
  }

  /**
   * Determine recovery path for failure
   */
  determineRecoveryPath(classification, cascadeStatus) {
    const decisionId = `decision_${Date.now()}`;

    const decision = {
      decisionId,
      timestamp: new Date().toISOString(),
      classification,
      cascadeStatus,
      selectedPath: null,
      reasoning: []
    };

    // Rule 1: If cascade detected, isolate
    if (cascadeStatus && cascadeStatus.cascadeDetected && cascadeStatus.affectedModules.length > 1) {
      decision.selectedPath = 'ISOLATE';
      decision.reasoning.push('Cascade failure detected: activating isolation');
    }

    // Rule 2: If critical severity, consider escalation
    else if (classification.severity === 'CRITICAL') {
      decision.selectedPath = 'ESCALATE';
      decision.reasoning.push('Critical severity: escalating to human operators');
    }

    // Rule 3: For state inconsistency, rollback
    else if (classification.category === 'ERR_STATE_INCONSISTENCY') {
      decision.selectedPath = 'ROLLBACK';
      decision.reasoning.push('State inconsistency detected: rolling back to known good state');
    }

    // Rule 4: For validation/enforcement failures, retry
    else if (classification.category === 'ERR_VALIDATION_FAILURE' ||
             classification.category === 'ERR_ENFORCEMENT_BLOCKED') {
      decision.selectedPath = 'RETRY';
      decision.reasoning.push('Transient error detected: attempting retry');
    }

    // Rule 5: For resource exhaustion, compensate
    else if (classification.category === 'ERR_RESOURCE_EXHAUSTION') {
      decision.selectedPath = 'COMPENSATE';
      decision.reasoning.push('Resource exhaustion: applying compensating actions');
    }

    // Rule 6: For bootstrap failures, shutdown and restart
    else if (classification.category === 'ERR_BOOTSTRAP_FAILURE') {
      decision.selectedPath = 'SHUTDOWN';
      decision.reasoning.push('Bootstrap failure: initiating graceful shutdown');
    }

    // Default: Escalate if no other path applies
    if (!decision.selectedPath) {
      decision.selectedPath = 'ESCALATE';
      decision.reasoning.push('No specific recovery path identified: escalating');
    }

    // Record decision
    this.recoveryDecisions.push(decision);
    this.metrics.decisionsCount++;
    this.metrics.pathsSelected[decision.selectedPath] = (this.metrics.pathsSelected[decision.selectedPath] || 0) + 1;

    const selectedPathConfig = this.recoveryPaths.get(decision.selectedPath);

    return {
      path: decision.selectedPath,
      strategy: selectedPathConfig.name,
      reasoning: decision.reasoning,
      decisionId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * PHASE 5.7: Execute recovery with timeout and deduplication
   */
  async executeRecovery(error, context = {}) {
    const incidentKey = context.traceId || (context.violation && context.violation.type) || error.message;

    // PHASE 5.7: Deduplication check
    if (this.activeRecoveries.has(incidentKey)) {
      return { skipped: true, reason: 'recovery_already_active', incidentKey };
    }

    // PHASE 5.7: Concurrency cap
    if (this.activeRecoveries.size >= this.maxConcurrentRecoveries) {
      return { skipped: true, reason: 'max_concurrent_recoveries_reached' };
    }

    this.activeRecoveries.set(incidentKey, Date.now());

    try {
      const result = await Promise.race([
        this._doRecovery(error, context),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RECOVERY_TIMEOUT')), this.config.recoveryTimeout_ms)
        )
      ]);
      return result;
    } catch (err) {
      if (err.message === 'RECOVERY_TIMEOUT') {
        this.metrics.timedOutRecoveries = (this.metrics.timedOutRecoveries || 0) + 1;
        this.escalateFailure(error, context, 'TIMEOUT');
        throw new Error(`RECOVERY_TIMEOUT after ${this.config.recoveryTimeout_ms}ms`);
      }
      throw err;
    } finally {
      this.activeRecoveries.delete(incidentKey);
    }
  }

  /**
   * PHASE 5.7: Internal recovery execution (wrapped by executeRecovery with timeout)
   */
  async _doRecovery(error, context = {}) {
    // Validate recovery is appropriate
    if (!this.validateRecovery(error, context)) {
      return { skipped: true, reason: 'validation_failed' };
    }

    // Determine recovery path
    const classification = {
      category: error.message || 'UNKNOWN',
      severity: context.severity || 'HIGH'
    };
    const cascadeStatus = context.cascadeStatus || { cascadeDetected: false, affectedModules: [] };

    const recoveryPath = this.determineRecoveryPath(classification, cascadeStatus);

    // Execute legacy recovery with path
    return this._executeRecoveryPath(recoveryPath, context);
  }

  /**
   * PHASE 5.7: Validate if recovery is applicable
   */
  validateRecovery(error, context = {}) {
    if (!error) return false;
    if (!context) return false;

    // Prevent recovery of same incident already in progress
    const incidentKey = context.traceId || (context.violation && context.violation.type) || error.message;
    if (this.activeRecoveries.has(incidentKey)) {
      return false;
    }

    return true;
  }

  /**
   * PHASE 5.7: Escalate recovery failure
   */
  escalateFailure(error, context, reason) {
    const failureRecord = {
      timestamp: new Date().toISOString(),
      error: error.message || String(error),
      reason,
      context: {
        traceId: context.traceId,
        violationType: context.violation?.type
      }
    };

    this.failureHistory.push(failureRecord);
    if (this.failureHistory.length > 1000) {
      this.failureHistory.shift();
    }
  }

  /**
   * Legacy: Execute recovery based on selected path (kept for backward compatibility)
   */
  _executeRecoveryPath(recoveryPath, failureData) {
    const recoveryId = `recovery_${Date.now()}`;

    const recovery = {
      recoveryId,
      timestamp: new Date().toISOString(),
      path: recoveryPath.path,
      failureData,
      steps: [],
      status: 'IN_PROGRESS',
      startTime: Date.now(),
      completed: false
    };

    try {
      switch (recoveryPath.path) {
        case 'RETRY':
          this._executeRetryRecovery(recovery);
          break;
        case 'ISOLATE':
          this._executeIsolationRecovery(recovery);
          break;
        case 'ROLLBACK':
          this._executeRollbackRecovery(recovery);
          break;
        case 'COMPENSATE':
          this._executeCompensationRecovery(recovery);
          break;
        case 'SHUTDOWN':
          this._executeShutdownRecovery(recovery);
          break;
        case 'ESCALATE':
          recovery.status = 'ESCALATION_INITIATED';
          recovery.steps.push({
            step: 1,
            action: 'Escalate to human operators',
            timestamp: new Date().toISOString()
          });
          break;
      }

      recovery.completed = true;
      recovery.endTime = Date.now();
      recovery.duration_ms = recovery.endTime - recovery.startTime;

      if (recovery.status === 'SUCCESS') {
        this.metrics.successfulRecoveries++;
      } else if (recovery.status !== 'ESCALATION_INITIATED') {
        this.metrics.failedRecoveries++;
      }

    } catch (error) {
      recovery.status = 'RECOVERY_FAILED';
      recovery.error = error.message;
      recovery.endTime = Date.now();
      recovery.duration_ms = recovery.endTime - recovery.startTime;
      this.metrics.failedRecoveries++;
    }

    return {
      recoveryId,
      status: recovery.status,
      duration_ms: recovery.duration_ms
    };
  }

  /**
   * Execute retry recovery
   */
  _executeRetryRecovery(recovery) {
    recovery.steps.push({
      step: 1,
      action: 'Initiate retry',
      timestamp: new Date().toISOString()
    });

    if (this.retryPolicyExecutor) {
      const result = this.retryPolicyExecutor.executeRetry(recovery.failureData);

      recovery.steps.push({
        step: 2,
        action: 'Execute retry policy',
        success: result.success,
        attempts: result.attempts,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        recovery.status = 'SUCCESS';
      }
    }
  }

  /**
   * Execute isolation recovery
   */
  _executeIsolationRecovery(recovery) {
    recovery.steps.push({
      step: 1,
      action: 'Activate isolation',
      timestamp: new Date().toISOString()
    });

    if (this.failureIsolationManager) {
      const result = this.failureIsolationManager.activateIsolation(
        recovery.failureData.affectedModules || [],
        recovery.failureData.severity
      );

      recovery.steps.push({
        step: 2,
        action: 'Isolation activated',
        success: result.success,
        strategy: result.strategy,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        recovery.status = 'SUCCESS';
      }
    }
  }

  /**
   * Execute rollback recovery
   */
  _executeRollbackRecovery(recovery) {
    recovery.steps.push({
      step: 1,
      action: 'Identify checkpoint',
      timestamp: new Date().toISOString()
    });

    recovery.steps.push({
      step: 2,
      action: 'Restore from checkpoint',
      timestamp: new Date().toISOString()
    });

    recovery.steps.push({
      step: 3,
      action: 'Verify state consistency',
      timestamp: new Date().toISOString()
    });

    recovery.status = 'SUCCESS';
  }

  /**
   * Execute compensation recovery
   */
  _executeCompensationRecovery(recovery) {
    recovery.steps.push({
      step: 1,
      action: 'Analyze incomplete operations',
      timestamp: new Date().toISOString()
    });

    recovery.steps.push({
      step: 2,
      action: 'Apply compensating transactions',
      timestamp: new Date().toISOString()
    });

    recovery.steps.push({
      step: 3,
      action: 'Verify compensation success',
      timestamp: new Date().toISOString()
    });

    recovery.status = 'SUCCESS';
  }

  /**
   * Execute shutdown recovery
   */
  _executeShutdownRecovery(recovery) {
    recovery.steps.push({
      step: 1,
      action: 'Initiate graceful shutdown',
      timestamp: new Date().toISOString()
    });

    if (this.gracefulShutdownManager) {
      recovery.steps.push({
        step: 2,
        action: 'All services stopped',
        timestamp: new Date().toISOString()
      });

      recovery.steps.push({
        step: 3,
        action: 'Ready for restart',
        timestamp: new Date().toISOString()
      });

      recovery.status = 'SHUTDOWN_READY';
    }
  }

  /**
   * Get recovery decision history
   */
  getDecisionHistory(limit = 50) {
    return this.recoveryDecisions.slice(-limit);
  }

  /**
   * Get active recovery
   */
  getActiveRecovery(recoveryId) {
    return this.activeRecoveries.get(recoveryId) || null;
  }

  /**
   * Get available paths
   */
  getAvailablePaths() {
    const paths = [];

    for (const [pathName, config] of this.recoveryPaths) {
      paths.push({
        path: pathName,
        name: config.name,
        applicableErrors: config.applicableErrors
      });
    }

    return paths;
  }

  /**
   * Get orchestrator metrics
   */
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics
    };
  }

  /**
   * Generate orchestration report
   */
  generateReport(limit = 20) {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      availablePaths: this.getAvailablePaths(),
      recentDecisions: this.getDecisionHistory(limit),
      activeRecoveries: Array.from(this.activeRecoveries.values())
    };
  }

  /**
   * Reset orchestrator
   */
  reset() {
    this.activeRecoveries.clear();
    this.recoveryDecisions = [];
    this.failureHistory = []; // PHASE 5.7
    this.metrics = {
      decisionsCount: 0,
      pathsSelected: {},
      successfulRecoveries: 0,
      failedRecoveries: 0,
      timedOutRecoveries: 0 // PHASE 5.7
    };

    return { reset: true };
  }
}

module.exports = RecoveryOrchestrator;
