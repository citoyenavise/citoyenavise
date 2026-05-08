/**
 * RuntimeEnforcementEngine.js - Main enforcement orchestrator
 * PHASE 1.4: Enforcement Layer
 * PHASE 3B: Optimization - Use ValidationDecisionPipeline to avoid re-validation
 *
 * Responsibility: Orchestrate rule enforcement at runtime
 * - Check operations against constitutional rules (via ValidationDecisionPipeline)
 * - Block invalid operations
 * - Log enforcement actions
 * - Generate audit trail
 * - Support permission verification
 */

const DependencyEnforcer = require('./DependencyEnforcer');
const CapabilityEnforcer = require('./CapabilityEnforcer');
const StateTransitionEnforcer = require('./StateTransitionEnforcer');
const AccessBoundaryEnforcer = require('./AccessBoundaryEnforcer');
const SecurityGuard = require('./SecurityGuard');
const ValidationDecisionPipeline = require('../validators/ValidationDecisionPipeline');

class RuntimeEnforcementEngine {
  constructor(constitutionManager, validationEngine) {
    if (!constitutionManager) {
      throw new Error('constitutionManager required');
    }

    this.constitutionManager = constitutionManager;
    this.validationEngine = validationEngine;
    // PHASE 3B: Create shared decision pipeline to eliminate duplication
    this.decisionPipeline = new ValidationDecisionPipeline(constitutionManager);

    this.enforcers = {
      dependency: new DependencyEnforcer(constitutionManager),
      capability: new CapabilityEnforcer(constitutionManager),
      stateTransition: new StateTransitionEnforcer(constitutionManager),
      accessBoundary: new AccessBoundaryEnforcer(constitutionManager),
      security: new SecurityGuard(constitutionManager)
    };

    this.auditTrail = [];
    this.enforcementMetrics = {
      operationsChecked: 0,
      operationsBlocked: 0,
      operationsAllowed: 0,
      rulesEnforced: 0,
      violations: 0
    };

    this.enabled = true;
  }

  /**
   * Check if operation is allowed
   */
  checkOperation(operation) {
    if (!this.enabled) {
      return { allowed: true, reason: 'enforcement_disabled' };
    }

    this.enforcementMetrics.operationsChecked++;

    try {
      // Check dependency constraints
      const depResult = this.enforcers.dependency.enforce(operation);
      if (!depResult.allowed) {
        this._blockOperation(operation, depResult);
        return depResult;
      }

      // Check capability limits
      const capResult = this.enforcers.capability.enforce(operation);
      if (!capResult.allowed) {
        this._blockOperation(operation, capResult);
        return capResult;
      }

      // Check state transitions
      const stateResult = this.enforcers.stateTransition.enforce(operation);
      if (!stateResult.allowed) {
        this._blockOperation(operation, stateResult);
        return stateResult;
      }

      // Check access boundaries
      const accessResult = this.enforcers.accessBoundary.enforce(operation);
      if (!accessResult.allowed) {
        this._blockOperation(operation, accessResult);
        return accessResult;
      }

      // Check security rules (PHASE 1.7)
      const securityResult = this.enforcers.security.enforce(operation);
      if (!securityResult.allowed) {
        this._blockOperation(operation, securityResult);
        return securityResult;
      }

      // Operation allowed
      this.enforcementMetrics.operationsAllowed++;
      this._logAllowedOperation(operation);

      return {
        allowed: true,
        reason: 'all_checks_passed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // On error, deny operation for safety
      this._blockOperation(operation, {
        allowed: false,
        reason: 'enforcement_error',
        message: error.message
      });

      return {
        allowed: false,
        reason: 'enforcement_error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Block an operation
   */
  _blockOperation(operation, result) {
    this.enforcementMetrics.operationsBlocked++;
    this.enforcementMetrics.violations++;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'BLOCK',
      operation,
      reason: result.reason,
      severity: result.severity || 'HIGH',
      details: result
    };

    this.auditTrail.push(auditEntry);

    // Keep only last 1000 audit entries
    if (this.auditTrail.length > 1000) {
      this.auditTrail.shift();
    }

    // Log blocked operation
    console.warn(`[ENFORCEMENT] BLOCKED: ${operation.type} (${result.reason})`);
  }

  /**
   * Log allowed operation
   */
  _logAllowedOperation(operation) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'ALLOW',
      operation,
      reason: 'all_rules_satisfied'
    };

    this.auditTrail.push(auditEntry);

    // Keep only last 1000 audit entries
    if (this.auditTrail.length > 1000) {
      this.auditTrail.shift();
    }
  }

  /**
   * Verify service injection
   */
  async verifyServiceInjection(serviceName, requesterModule) {
    return this.enforcers.accessBoundary.verifyServiceInjection(serviceName, requesterModule);
  }

  /**
   * Verify permission
   */
  async verifyPermission(resource, action, principal) {
    return this.enforcers.accessBoundary.verifyPermission(resource, action, principal);
  }

  /**
   * Check state transition
   */
  async checkStateTransition(fromState, toState, context) {
    return this.enforcers.stateTransition.checkStateTransition(fromState, toState, context);
  }

  /**
   * Verify resource limits
   */
  async verifyResourceLimits(resourceType, quantity) {
    return this.enforcers.capability.verifyResourceLimits(resourceType, quantity);
  }

  /**
   * Enable/disable enforcement
   */
  setEnforcementEnabled(enabled) {
    this.enabled = enabled;
    return { enabled: this.enabled, timestamp: new Date().toISOString() };
  }

  /**
   * Get enforcement status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      operationsChecked: this.enforcementMetrics.operationsChecked,
      operationsBlocked: this.enforcementMetrics.operationsBlocked,
      operationsAllowed: this.enforcementMetrics.operationsAllowed,
      blockRate: this.enforcementMetrics.operationsChecked > 0
        ? (this.enforcementMetrics.operationsBlocked / this.enforcementMetrics.operationsChecked * 100).toFixed(2) + '%'
        : '0%',
      violations: this.enforcementMetrics.violations,
      auditTrailSize: this.auditTrail.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get enforcement metrics
   */
  getMetrics() {
    return {
      ...this.enforcementMetrics,
      blockRate: this.enforcementMetrics.operationsChecked > 0
        ? this.enforcementMetrics.operationsBlocked / this.enforcementMetrics.operationsChecked
        : 0,
      allowRate: this.enforcementMetrics.operationsChecked > 0
        ? this.enforcementMetrics.operationsAllowed / this.enforcementMetrics.operationsChecked
        : 0
    };
  }

  /**
   * Get audit trail
   */
  getAuditTrail(limit = 50) {
    return this.auditTrail.slice(-limit);
  }

  /**
   * Get violations from audit trail
   */
  getViolations(limit = 50) {
    return this.auditTrail
      .filter(entry => entry.action === 'BLOCK')
      .slice(-limit);
  }

  /**
   * Get enforcer by name
   */
  getEnforcer(name) {
    return this.enforcers[name];
  }

  /**
   * Get all enforcers
   */
  getAllEnforcers() {
    return this.enforcers;
  }

  /**
   * Get detailed enforcement report
   */
  getDetailedReport() {
    return {
      engine: {
        enabled: this.enabled,
        enforcers: Object.keys(this.enforcers)
      },
      metrics: this.getMetrics(),
      status: this.getStatus(),
      recentViolations: this.getViolations(10),
      recentAuditTrail: this.getAuditTrail(10),
      security: this.enforcers.security.getAccessControlReport()
    };
  }

  /**
   * Get security report (PHASE 1.7)
   */
  getSecurityReport() {
    return this.enforcers.security.getAccessControlReport();
  }

  /**
   * Get security violations
   */
  getSecurityViolations(limit = 50) {
    return this.enforcers.security.getViolations(limit);
  }
}

module.exports = RuntimeEnforcementEngine;
