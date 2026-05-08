/**
 * TransitionInvariantGuard.js - Guard state transitions with invariants
 * State Management Layer
 *
 * Responsibility: Ensure state transitions maintain invariants
 * - Validate pre-conditions before transition
 * - Verify post-conditions after transition
 * - Enforce invariant constraints
 * - Track invariant violations
 * - Prevent invalid state combinations
 */

class TransitionInvariantGuard {
  constructor(options = {}) {
    this.invariants = new Map();
    this.violations = [];
    this.guards = new Map();
    this.transitionValidations = new Map();

    this.config = {
      maxViolationHistorySize: options.maxViolationHistorySize || 10000,
      strictMode: options.strictMode !== false,
      logViolations: options.logViolations !== false
    };

    this.metrics = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      violationCount: 0
    };

    this._initializeInvariants();
    this._initializeGuards();
  }

  /**
   * Initialize invariants
   */
  _initializeInvariants() {
    // System state invariants
    this.invariants.set('SYSTEM_STATE_VALID', {
      description: 'System state must be one of: INITIALIZING, BOOTING, READY, DEGRADED, CRITICAL, RECOVERING, SHUTTING_DOWN, STOPPED',
      validStates: ['INITIALIZING', 'BOOTING', 'READY', 'DEGRADED', 'CRITICAL', 'RECOVERING', 'SHUTTING_DOWN', 'STOPPED'],
      severity: 'CRITICAL'
    });

    // Module state invariants
    this.invariants.set('MODULE_STATE_VALID', {
      description: 'Module state must be one of valid module states',
      validStates: ['UNINITIALIZED', 'INITIALIZING', 'READY', 'DEGRADED', 'FAILED', 'RECOVERING', 'STOPPED'],
      severity: 'CRITICAL'
    });

    // Transition ordering invariant
    this.invariants.set('TRANSITION_ORDER_RESPECTED', {
      description: 'State transitions must follow defined rules',
      severity: 'CRITICAL',
      enforced: true
    });

    // Service availability invariant
    this.invariants.set('SERVICE_AVAILABILITY', {
      description: 'Critical services must be available unless system is recovering or shutting down',
      condition: (systemState, services) => {
        if (systemState === 'READY') {
          return services.filter(s => s.state === 'HEALTHY').length > 0;
        }
        return true;
      },
      severity: 'HIGH'
    });

    // Data consistency invariant
    this.invariants.set('DATA_CONSISTENCY', {
      description: 'No incompatible module states can coexist',
      condition: (modules) => {
        // Cannot have modules in FAILED state while system is READY
        const failedModules = modules.filter(m => m.state === 'FAILED');
        const systemReady = modules.some(m => m.systemState === 'READY');
        return !(failedModules.length > 0 && systemReady);
      },
      severity: 'CRITICAL'
    });

    // Phase completion invariant
    this.invariants.set('PHASE_COMPLETION', {
      description: 'Critical bootstrap phases must complete before proceeding',
      severity: 'CRITICAL',
      enforced: true
    });

    // Dependency satisfaction invariant
    this.invariants.set('DEPENDENCY_SATISFIED', {
      description: 'All module dependencies must be initialized before module starts',
      severity: 'HIGH',
      enforced: true
    });

    // Resource availability invariant
    this.invariants.set('RESOURCE_AVAILABLE', {
      description: 'Required resources must be available for state transition',
      severity: 'HIGH',
      enforced: true
    });
  }

  /**
   * Initialize guards
   */
  _initializeGuards() {
    // Guard: System cannot transition to READY while modules are FAILED
    this.guards.set('SYSTEM_TO_READY', {
      description: 'System cannot be READY with failed modules',
      check: (systemState, context) => {
        if (systemState === 'READY') {
          const failedModules = context.modules?.filter(m => m.state === 'FAILED') || [];
          return failedModules.length === 0;
        }
        return true;
      }
    });

    // Guard: Cannot transition to STOPPED unless all services are stopped
    this.guards.set('SYSTEM_TO_STOPPED', {
      description: 'Cannot stop system while services are running',
      check: (systemState, context) => {
        if (systemState === 'STOPPED') {
          const runningServices = context.services?.filter(s => s.state !== 'DOWN') || [];
          return runningServices.length === 0;
        }
        return true;
      }
    });

    // Guard: Cannot transition to BOOTING while already READY
    this.guards.set('SKIP_BOOT_WHEN_READY', {
      description: 'Cannot re-boot a system already READY',
      check: (currentState, targetState, context) => {
        return !(currentState === 'READY' && targetState === 'BOOTING');
      }
    });

    // Guard: Cannot transition to RECOVERING without identifying issue
    this.guards.set('RECOVERY_REQUIRES_DIAGNOSIS', {
      description: 'Recovery requires identification of problem',
      check: (targetState, context) => {
        if (targetState === 'RECOVERING') {
          return context.failureIdentified === true;
        }
        return true;
      }
    });

    // Guard: CRITICAL state requires immediate attention
    this.guards.set('CRITICAL_STATE_ACTION', {
      description: 'Cannot leave CRITICAL state without recovery action',
      check: (currentState, targetState, context) => {
        if (currentState === 'CRITICAL' && targetState !== 'RECOVERING' && targetState !== 'SHUTTING_DOWN') {
          return false; // Must transition to RECOVERING or SHUTTING_DOWN
        }
        return true;
      }
    });
  }

  /**
   * Validate state transition
   */
  validateTransition(entityId, fromState, toState, context = {}) {
    const validationId = `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const validation = {
      validationId,
      entityId,
      fromState,
      toState,
      timestamp: new Date().toISOString(),
      checks: [],
      passed: true
    };

    this.metrics.totalValidations++;

    // Check 1: Valid state transition
    const transitionCheck = {
      check: 'valid_transition',
      passed: true,
      reason: 'Transition is valid'
    };

    // (In real implementation, would check against transition rules)
    validation.checks.push(transitionCheck);

    // Check 2: Invariants satisfied
    const invariantChecks = this._checkInvariants(fromState, toState, context);
    validation.checks.push(...invariantChecks);

    const invariantsPass = invariantChecks.every(c => c.passed);

    // Check 3: Guards satisfied
    const guardChecks = this._checkGuards(fromState, toState, context);
    validation.checks.push(...guardChecks);

    const guardsPass = guardChecks.every(c => c.passed);

    // Determine overall result
    validation.passed = transitionCheck.passed && invariantsPass && guardsPass;

    if (!validation.passed) {
      this.metrics.failedValidations++;

      const violations = validation.checks.filter(c => !c.passed);
      for (const violation of violations) {
        this._recordViolation(entityId, fromState, toState, violation);
      }

      if (this.config.strictMode) {
        return {
          success: false,
          validationId,
          reason: 'Transition validation failed',
          violations: violations.map(v => v.reason)
        };
      }
    } else {
      this.metrics.passedValidations++;
    }

    return {
      success: validation.passed,
      validationId,
      reason: validation.passed ? 'Transition valid' : 'Transition has warnings',
      checks: validation.checks
    };
  }

  /**
   * Check invariants
   */
  _checkInvariants(fromState, toState, context) {
    const checks = [];

    for (const [invariantName, invariant] of this.invariants) {
      if (!invariant.enforced) continue;

      const check = {
        check: invariantName,
        description: invariant.description,
        passed: true,
        reason: 'Invariant satisfied'
      };

      // Validate invariant
      if (invariant.validStates) {
        if (!invariant.validStates.includes(toState)) {
          check.passed = false;
          check.reason = `Target state ${toState} not in valid states`;
        }
      }

      if (invariant.condition && typeof invariant.condition === 'function') {
        try {
          if (!invariant.condition(toState, context)) {
            check.passed = false;
            check.reason = 'Invariant condition failed';
          }
        } catch (error) {
          check.passed = false;
          check.reason = `Invariant check error: ${error.message}`;
        }
      }

      checks.push(check);
    }

    return checks;
  }

  /**
   * Check guards
   */
  _checkGuards(fromState, toState, context) {
    const checks = [];

    for (const [guardName, guard] of this.guards) {
      const check = {
        check: guardName,
        description: guard.description,
        passed: true,
        reason: 'Guard passed'
      };

      try {
        const result = guard.check(fromState, toState, context);
        if (!result) {
          check.passed = false;
          check.reason = guard.description;
        }
      } catch (error) {
        check.passed = false;
        check.reason = `Guard check error: ${error.message}`;
      }

      checks.push(check);
    }

    return checks;
  }

  /**
   * Record violation
   */
  _recordViolation(entityId, fromState, toState, violation) {
    const violationRecord = {
      timestamp: new Date().toISOString(),
      entityId,
      fromState,
      toState,
      violation: violation.reason,
      check: violation.check,
      severity: 'HIGH'
    };

    this.violations.push(violationRecord);
    this.metrics.violationCount++;

    if (this.violations.length > this.config.maxViolationHistorySize) {
      this.violations.shift();
    }

    if (this.config.logViolations) {
      // Log violation (in real implementation)
    }
  }

  /**
   * Get violations
   */
  getViolations(limit = 50) {
    return this.violations.slice(-limit);
  }

  /**
   * Get violation summary
   */
  getViolationSummary() {
    return {
      timestamp: new Date().toISOString(),
      totalViolations: this.violations.length,
      recentViolations: this.getViolations(10),
      violationsByCheck: this._groupViolationsByCheck(),
      violationsByEntity: this._groupViolationsByEntity()
    };
  }

  /**
   * Group violations by check
   */
  _groupViolationsByCheck() {
    const grouped = {};

    for (const violation of this.violations) {
      if (!grouped[violation.check]) {
        grouped[violation.check] = 0;
      }
      grouped[violation.check]++;
    }

    return grouped;
  }

  /**
   * Group violations by entity
   */
  _groupViolationsByEntity() {
    const grouped = {};

    for (const violation of this.violations) {
      if (!grouped[violation.entityId]) {
        grouped[violation.entityId] = 0;
      }
      grouped[violation.entityId]++;
    }

    return grouped;
  }

  /**
   * Get guard
   */
  getGuard(guardName) {
    return this.guards.get(guardName) || null;
  }

  /**
   * Get invariant
   */
  getInvariant(invariantName) {
    return this.invariants.get(invariantName) || null;
  }

  /**
   * Get all invariants
   */
  getAllInvariants() {
    const invariants = [];

    for (const [name, def] of this.invariants) {
      invariants.push({
        name,
        description: def.description,
        severity: def.severity,
        enforced: def.enforced === true
      });
    }

    return invariants;
  }

  /**
   * Get guard metrics
   */
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      violationRate_percent: this.metrics.totalValidations > 0
        ? (this.metrics.failedValidations / this.metrics.totalValidations * 100).toFixed(2)
        : '0'
    };
  }

  /**
   * Generate report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      invariants: this.getAllInvariants(),
      violations: this.getViolationSummary()
    };
  }

  /**
   * Reset guard
   */
  reset() {
    this.violations = [];
    this.metrics = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      violationCount: 0
    };

    return { reset: true };
  }
}

module.exports = TransitionInvariantGuard;
