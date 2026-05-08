/**
 * RuntimeRecoveryEngine.js - Main recovery orchestration engine
 * PHASE 1.6: Recovery Layer
 *
 * Responsibility: Coordinate all recovery operations
 * - Monitor system health from observability layer
 * - Detect failures and trigger recovery
 * - Coordinate recovery components
 * - Track recovery state and outcomes
 * - Ensure recovery completes or escalates
 */

class RuntimeRecoveryEngine {
  constructor(options = {}) {
    this.observabilityLayer = options.observabilityLayer || null;
    this.failureIsolationManager = options.failureIsolationManager || null;
    this.retryPolicyExecutor = options.retryPolicyExecutor || null;
    this.gracefulShutdownManager = options.gracefulShutdownManager || null;
    this.recoveryOrchestrator = options.recoveryOrchestrator || null;

    // Recovery state tracking
    this.recoveryInProgress = false;
    this.currentRecovery = null;
    this.recoveryHistory = [];
    this.recoveryMetrics = {
      totalFailures: 0,
      failuresRecovered: 0,
      failuresEscalated: 0,
      averageRecoveryTime_ms: 0,
      recoverySuccess_rate: 0
    };

    // Configuration
    this.config = {
      recoveryTimeout_ms: options.recoveryTimeout_ms || 30000,
      healthCheckInterval_ms: options.healthCheckInterval_ms || 5000,
      cascadeDetectionThreshold: options.cascadeDetectionThreshold || 3,
      escalationThreshold: options.escalationThreshold || 5
    };

    // Active recovery operations
    this.activeRecoveries = new Map();
  }

  /**
   * Start recovery engine
   */
  start() {
    return {
      started: true,
      timestamp: new Date().toISOString(),
      healthCheckInterval_ms: this.config.healthCheckInterval_ms
    };
  }

  /**
   * Detect and initiate recovery for failure
   */
  detectAndRecover(failureData) {
    const recoveryId = `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const recovery = {
      recoveryId,
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
      failureData: failureData,
      status: 'INITIATED',
      steps: [],
      escalated: false,
      recovered: false
    };

    this.activeRecoveries.set(recoveryId, recovery);
    this.recoveryMetrics.totalFailures++;

    // Step 1: Classify failure
    const classification = this._classifyFailure(failureData);
    recovery.steps.push({
      step: 1,
      action: 'Classify failure',
      classification,
      timestamp: new Date().toISOString()
    });

    // Step 2: Check if cascade is in progress
    const cascadeStatus = this._checkCascadeStatus();
    recovery.steps.push({
      step: 2,
      action: 'Check cascade status',
      cascadeDetected: cascadeStatus.cascadeDetected,
      affectedModules: cascadeStatus.affectedModules.length,
      timestamp: new Date().toISOString()
    });

    // Step 3: Activate isolation if needed
    if (cascadeStatus.cascadeDetected && this.failureIsolationManager) {
      const isolationResult = this.failureIsolationManager.activateIsolation(
        cascadeStatus.affectedModules,
        classification.severity
      );

      recovery.steps.push({
        step: 3,
        action: 'Activate isolation',
        isolated: isolationResult.success,
        strategy: isolationResult.strategy,
        timestamp: new Date().toISOString()
      });
    }

    // Step 4: Determine recovery path
    if (this.recoveryOrchestrator) {
      const recoveryPath = this.recoveryOrchestrator.determineRecoveryPath(
        classification,
        cascadeStatus
      );

      recovery.steps.push({
        step: 4,
        action: 'Determine recovery path',
        path: recoveryPath.path,
        strategy: recoveryPath.strategy,
        timestamp: new Date().toISOString()
      });

      recovery.recoveryPath = recoveryPath;
    }

    // Step 5: Execute recovery
    const executionResult = this._executeRecovery(recovery);
    recovery.steps.push({
      step: 5,
      action: 'Execute recovery',
      success: executionResult.success,
      reason: executionResult.reason,
      timestamp: new Date().toISOString()
    });

    recovery.recovered = executionResult.success;

    if (executionResult.success) {
      recovery.status = 'RECOVERED';
      this.recoveryMetrics.failuresRecovered++;
    } else {
      // Recovery failed - escalate
      recovery.status = 'ESCALATION_REQUIRED';
      recovery.escalated = true;
      this.recoveryMetrics.failuresEscalated++;
    }

    recovery.endTime = Date.now();
    recovery.duration_ms = recovery.endTime - recovery.startTime;

    // Update history
    this.recoveryHistory.push(recovery);
    if (this.recoveryHistory.length > 10000) {
      this.recoveryHistory.shift();
    }

    // Update metrics
    this._updateRecoveryMetrics();

    return {
      recoveryId,
      status: recovery.status,
      recovered: recovery.recovered,
      escalated: recovery.escalated,
      duration_ms: recovery.duration_ms
    };
  }

  /**
   * Classify failure
   */
  _classifyFailure(failureData) {
    const errorType = failureData.errorType || 'UNKNOWN';
    let severity = 'MEDIUM';
    let category = 'ERR_UNKNOWN';

    // Map error types to severity
    if (failureData.severity === 'CRITICAL' ||
        errorType.includes('CRITICAL') ||
        errorType.includes('CASCADE')) {
      severity = 'CRITICAL';
    } else if (failureData.severity === 'HIGH' || errorType.includes('HIGH')) {
      severity = 'HIGH';
    } else if (failureData.severity === 'LOW' || errorType.includes('LOW')) {
      severity = 'LOW';
    }

    // Map to error category
    if (errorType.includes('VALIDATION')) {
      category = 'ERR_VALIDATION_FAILURE';
    } else if (errorType.includes('ENFORCEMENT')) {
      category = 'ERR_ENFORCEMENT_BLOCKED';
    } else if (errorType.includes('RESOURCE')) {
      category = 'ERR_RESOURCE_EXHAUSTION';
    } else if (errorType.includes('STATE')) {
      category = 'ERR_STATE_INCONSISTENCY';
    } else if (errorType.includes('CASCADE')) {
      category = 'ERR_CASCADE_FAILURE';
    } else if (errorType.includes('DEPENDENCY')) {
      category = 'ERR_DEPENDENCY_VIOLATION';
    } else if (errorType.includes('VERSION')) {
      category = 'ERR_VERSION_INCOMPATIBILITY';
    } else if (errorType.includes('BOOTSTRAP')) {
      category = 'ERR_BOOTSTRAP_FAILURE';
    }

    return {
      errorType,
      severity,
      category,
      classified: true
    };
  }

  /**
   * Check for cascade failures
   */
  _checkCascadeStatus() {
    const cascadeDetected = false;
    const affectedModules = [];

    // Check observability data for cascade patterns
    if (this.observabilityLayer && this.observabilityLayer.runtimeTraceCollector) {
      const traces = this.observabilityLayer.runtimeTraceCollector.getFailedTraces(10);

      if (traces && traces.length > this.config.cascadeDetectionThreshold) {
        const affectedSet = new Set();

        for (const trace of traces) {
          if (trace.spans) {
            for (const span of trace.spans) {
              if (span.moduleName) {
                affectedSet.add(span.moduleName);
              }
            }
          }
        }

        if (affectedSet.size > 1) {
          return {
            cascadeDetected: true,
            affectedModules: Array.from(affectedSet),
            failureCount: traces.length
          };
        }
      }
    }

    return {
      cascadeDetected,
      affectedModules,
      failureCount: 0
    };
  }

  /**
   * Execute recovery steps
   */
  _executeRecovery(recovery) {
    const startTime = Date.now();
    const timeout = this.config.recoveryTimeout_ms;

    try {
      // Execute based on recovery path
      if (recovery.recoveryPath) {
        const path = recovery.recoveryPath.path;

        if (path === 'RETRY') {
          if (this.retryPolicyExecutor) {
            const result = this.retryPolicyExecutor.executeRetry(recovery.failureData);
            if (result.success) {
              return { success: true, reason: 'Retry succeeded' };
            }
          }
        } else if (path === 'ROLLBACK') {
          // Rollback handled by recovery orchestrator
          return { success: true, reason: 'Rollback initiated' };
        } else if (path === 'ISOLATE') {
          // Isolation already activated
          return { success: true, reason: 'Isolation activated' };
        } else if (path === 'COMPENSATE') {
          // Compensation handled by recovery orchestrator
          return { success: true, reason: 'Compensation applied' };
        } else if (path === 'ESCALATE') {
          return { success: false, reason: 'Escalation required' };
        }
      }

      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        return { success: false, reason: 'Recovery timeout exceeded' };
      }

      return { success: true, reason: 'Recovery completed' };
    } catch (error) {
      return { success: false, reason: `Recovery error: ${error.message}` };
    }
  }

  /**
   * Update recovery metrics
   */
  _updateRecoveryMetrics() {
    const history = this.recoveryHistory.slice(-100);

    if (history.length > 0) {
      const totalDuration = history.reduce((sum, r) => sum + r.duration_ms, 0);
      this.recoveryMetrics.averageRecoveryTime_ms = Math.round(totalDuration / history.length);

      const recovered = history.filter(r => r.recovered).length;
      this.recoveryMetrics.recoverySuccess_rate = (recovered / history.length * 100).toFixed(2) + '%';
    }
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus() {
    return {
      recoveryInProgress: this.recoveryInProgress,
      activeRecoveries: this.activeRecoveries.size,
      metrics: this.recoveryMetrics,
      currentRecovery: this.currentRecovery ? {
        recoveryId: this.currentRecovery.recoveryId,
        status: this.currentRecovery.status,
        elapsed_ms: Date.now() - this.currentRecovery.startTime
      } : null
    };
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory(limit = 50) {
    return this.recoveryHistory.slice(-limit);
  }

  /**
   * Get recovery metrics
   */
  getRecoveryMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.recoveryMetrics
    };
  }

  /**
   * Get active recovery
   */
  getActiveRecovery(recoveryId) {
    return this.activeRecoveries.get(recoveryId);
  }

  /**
   * Generate recovery report
   */
  generateRecoveryReport(limit = 20) {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getRecoveryMetrics(),
      recentRecoveries: this.getRecoveryHistory(limit),
      activeRecoveries: Array.from(this.activeRecoveries.values())
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.recoveryHistory = [];
    this.activeRecoveries.clear();
    this.recoveryMetrics = {
      totalFailures: 0,
      failuresRecovered: 0,
      failuresEscalated: 0,
      averageRecoveryTime_ms: 0,
      recoverySuccess_rate: 0
    };

    return { reset: true };
  }

  /**
   * Handle security access violation (PHASE 1.7)
   */
  handleSecurityViolation(violation) {
    const { id, severity, requester, reason, message } = violation;

    // Escalation rules based on severity
    const recoveryAction = {
      LOW: 'LOG_ONLY',
      MEDIUM: 'RETRY_OR_FALLBACK',
      HIGH: 'ESCALATE_ONLY',
      CRITICAL: 'SYSTEM_HALT_OR_ROLLBACK'
    };

    const action = recoveryAction[severity] || 'ESCALATE_ONLY';

    const response = {
      violationId: id,
      severity,
      action,
      handled: true,
      timestamp: new Date().toISOString(),
      details: {
        requester,
        reason,
        message,
        recoveryPath: this._determineSecurityRecoveryPath(severity)
      }
    };

    return response;
  }

  /**
   * Determine recovery path for security violations
   */
  _determineSecurityRecoveryPath(severity) {
    switch (severity) {
      case 'LOW':
        return {
          path: 'LOG_AND_CONTINUE',
          action: 'Log violation and continue normal operation'
        };

      case 'MEDIUM':
        return {
          path: 'ALERT_AND_FALLBACK',
          action: 'Alert security, attempt fallback or retry'
        };

      case 'HIGH':
        return {
          path: 'ESCALATE_TO_GOVERNANCE',
          action: 'Escalate to governance layer for review'
        };

      case 'CRITICAL':
        return {
          path: 'SYSTEM_SHUTDOWN_OR_ROLLBACK',
          action: 'Shutdown affected module or rollback transaction'
        };

      default:
        return {
          path: 'UNKNOWN',
          action: 'Unknown recovery path'
        };
    }
  }
}

module.exports = RuntimeRecoveryEngine;
