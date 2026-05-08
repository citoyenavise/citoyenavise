/**
 * ValidationDecisionPipeline.js - Unified validation decision engine
 * PHASE 3B: Optimization - Eliminate validation/enforcement duplication
 *
 * Responsibility: Centralize validation logic to prevent duplication
 * - Single source of truth for all validation decisions
 * - Both RuntimeValidationEngine and RuntimeEnforcementEngine consume decisions
 * - No re-validation of identical conditions
 * - Structured decision output for deterministic routing
 */

const BootstrapInvariantValidator = require('./BootstrapInvariantValidator');
const DependencyValidator = require('./DependencyValidator');
const EventSchemaValidator = require('./EventSchemaValidator');
const CapabilityValidator = require('./CapabilityValidator');
const VersionCompatibilityValidator = require('./VersionCompatibilityValidator');

class ValidationDecisionPipeline {
  constructor(constitutionManager) {
    if (!constitutionManager) {
      throw new Error('constitutionManager required');
    }

    this.constitutionManager = constitutionManager;
    this.validators = {
      bootstrap: new BootstrapInvariantValidator(constitutionManager),
      dependency: new DependencyValidator(constitutionManager),
      eventSchema: new EventSchemaValidator(constitutionManager),
      capability: new CapabilityValidator(constitutionManager),
      versionCompatibility: new VersionCompatibilityValidator(constitutionManager)
    };

    // Decision cache to avoid re-evaluation
    this.decisionCache = new Map();
    this.decisionMetrics = {
      totalDecisions: 0,
      cachedDecisions: 0,
      violations: 0,
      allowedOperations: 0
    };
  }

  /**
   * Evaluate all validators and return unified decision
   * Used by both ValidationEngine (batch) and EnforcementEngine (on-demand)
   */
  async evaluateDecision(evaluationContext) {
    const cacheKey = this._generateCacheKey(evaluationContext);
    const cachedDecision = this.decisionCache.get(cacheKey);

    if (cachedDecision && !this._isExpired(cachedDecision)) {
      this.decisionMetrics.cachedDecisions++;
      return cachedDecision;
    }

    this.decisionMetrics.totalDecisions++;
    const decision = await this._computeDecision(evaluationContext);

    // Cache decision (5 second TTL for batch validation compatibility)
    this.decisionCache.set(cacheKey, {
      ...decision,
      cachedAt: Date.now(),
      ttl_ms: 5000
    });

    return decision;
  }

  /**
   * Evaluate operation-specific decision
   * Called by RuntimeEnforcementEngine.checkOperation()
   * Returns immediate decision without cache
   */
  async evaluateOperationDecision(operation, context) {
    const evaluationContext = {
      type: 'operation',
      operation,
      context,
      evaluatedAt: Date.now()
    };

    const decision = await this._computeDecision(evaluationContext);

    if (!decision.allowed) {
      this.decisionMetrics.violations++;
    } else {
      this.decisionMetrics.allowedOperations++;
    }

    return decision;
  }

  /**
   * Compute unified decision from all validators
   * Private method - actual validation logic
   */
  async _computeDecision(evaluationContext) {
    const violations = [];
    const checks = [];

    try {
      // Run all validators
      const [
        bootstrapResult,
        dependencyResult,
        eventSchemaResult,
        capabilityResult,
        versionResult
      ] = await Promise.all([
        this.validators.bootstrap.validate(),
        this.validators.dependency.validate(),
        this.validators.eventSchema.validate(),
        this.validators.capability.validate(),
        this.validators.versionCompatibility.validate()
      ]);

      // Collect all violations
      if (!bootstrapResult.valid) {
        violations.push(...bootstrapResult.violations);
        checks.push({ validator: 'bootstrap', valid: false, violations: bootstrapResult.violations });
      } else {
        checks.push({ validator: 'bootstrap', valid: true });
      }

      if (!dependencyResult.valid) {
        violations.push(...dependencyResult.violations);
        checks.push({ validator: 'dependency', valid: false, violations: dependencyResult.violations });
      } else {
        checks.push({ validator: 'dependency', valid: true });
      }

      if (!eventSchemaResult.valid) {
        violations.push(...eventSchemaResult.violations);
        checks.push({ validator: 'eventSchema', valid: false, violations: eventSchemaResult.violations });
      } else {
        checks.push({ validator: 'eventSchema', valid: true });
      }

      if (!capabilityResult.valid) {
        violations.push(...capabilityResult.violations);
        checks.push({ validator: 'capability', valid: false, violations: capabilityResult.violations });
      } else {
        checks.push({ validator: 'capability', valid: true });
      }

      if (!versionResult.valid) {
        violations.push(...versionResult.violations);
        checks.push({ validator: 'versionCompatibility', valid: false, violations: versionResult.violations });
      } else {
        checks.push({ validator: 'versionCompatibility', valid: true });
      }

      // Determine decision severity (highest violation severity wins)
      const highestSeverity = this._determineHighestSeverity(violations);

      const decision = {
        allowed: violations.length === 0,
        severity: highestSeverity || 'NONE',
        violationCount: violations.length,
        violations,
        checks,
        decision_id: this._generateDecisionId(),
        evaluated_at: new Date().toISOString(),
        reason: violations.length === 0 ? 'all_validators_passed' : `${violations.length} violation(s) found`
      };

      return decision;

    } catch (error) {
      return {
        allowed: false,
        severity: 'CRITICAL',
        violationCount: 1,
        violations: [{
          rule: 'PIPELINE_ERROR',
          severity: 'CRITICAL',
          message: `ValidationDecisionPipeline error: ${error.message}`,
          error: error.message
        }],
        checks: [],
        decision_id: this._generateDecisionId(),
        evaluated_at: new Date().toISOString(),
        reason: 'pipeline_execution_error'
      };
    }
  }

  /**
   * Determine highest severity from violations
   * CRITICAL > HIGH > MEDIUM > LOW
   */
  _determineHighestSeverity(violations) {
    if (violations.length === 0) return null;

    const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    let highest = null;
    let highestRank = 0;

    for (const violation of violations) {
      const rank = severityOrder[violation.severity] || 0;
      if (rank > highestRank) {
        highest = violation.severity;
        highestRank = rank;
      }
    }

    return highest;
  }

  /**
   * Generate cache key from evaluation context
   */
  _generateCacheKey(context) {
    if (context.type === 'operation' && context.operation) {
      return `op_${context.operation.id}_${context.context?.traceId || 'default'}`;
    }
    return `batch_${Date.now() % 5000}`;
  }

  /**
   * Check if cached decision is expired
   */
  _isExpired(decision) {
    const age = Date.now() - decision.cachedAt;
    return age > decision.ttl_ms;
  }

  /**
   * Generate unique decision ID
   */
  _generateDecisionId() {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pipeline metrics
   */
  getMetrics() {
    return {
      ...this.decisionMetrics,
      cacheSize: this.decisionCache.size,
      cacheHitRate: this.decisionMetrics.totalDecisions > 0
        ? (this.decisionMetrics.cachedDecisions / this.decisionMetrics.totalDecisions * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Clear decision cache
   */
  clearCache() {
    this.decisionCache.clear();
    return { cleared: true, previousSize: this.decisionCache.size };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.decisionMetrics = {
      totalDecisions: 0,
      cachedDecisions: 0,
      violations: 0,
      allowedOperations: 0
    };
    return { reset: true };
  }
}

module.exports = ValidationDecisionPipeline;
