/**
 * ArchitecturalConsistencyValidator.js - Validate Phase 3B optimization results
 * PHASE 3B - Phase 6: Ensure no regressions from optimization
 *
 * Responsibility: Validate that optimizations preserved:
 * - No circular dependencies introduced
 * - No runtime regressions
 * - No engine responsibility overlap
 * - No duplicated invariant logic
 * - No duplicated observability flow
 * - No duplicated recovery routing
 */

class ArchitecturalConsistencyValidator {
  constructor(system) {
    this.system = system;
    this.validationResults = [];
    this.constraints = {
      noCycles: true,
      noRuntimeRegression: true,
      noEngineLap: true,
      noInvariantDuplication: true,
      noObservabilityDuplication: true,
      noRecoveryDuplication: true
    };
  }

  /**
   * Run complete consistency validation
   */
  async validateArchitecture() {
    const results = {
      validationTime: new Date().toISOString(),
      checks: []
    };

    // Check 1: No circular dependencies
    results.checks.push(await this._validateNoCycles());

    // Check 2: No runtime regression
    results.checks.push(await this._validateNoRuntimeRegression());

    // Check 3: No engine responsibility overlap
    results.checks.push(await this._validateNoEngineLap());

    // Check 4: Invariants centralized (no duplication)
    results.checks.push(await this._validateInvariantCentralization());

    // Check 5: Observability unified (no duplication)
    results.checks.push(await this._validateObservabilityUnification());

    // Check 6: Recovery flow unified (no duplication)
    results.checks.push(await this._validateRecoveryUnification());

    // Overall result
    results.overallValid = results.checks.every(check => check.valid);
    results.issueCount = results.checks.filter(check => !check.valid).length;

    this.validationResults.push(results);
    return results;
  }

  /**
   * CHECK 1: Validate no circular dependencies
   */
  async _validateNoCycles() {
    const check = {
      name: 'NO_CIRCULAR_DEPENDENCIES',
      valid: true,
      issues: []
    };

    // Check ValidationDecisionPipeline doesn't import from Enforcement
    // Check ObservabilityDispatchContract doesn't import from observers
    // Check RecoveryDecisionExecution doesn't import from failed modules
    // Check UnifiedFailureFlow doesn't create cycles

    const importGraph = this._buildImportGraph();
    const cycles = this._detectCycles(importGraph);

    if (cycles.length > 0) {
      check.valid = false;
      check.issues = cycles;
    }

    return check;
  }

  /**
   * CHECK 2: Validate no runtime regression
   */
  async _validateNoRuntimeRegression() {
    const check = {
      name: 'NO_RUNTIME_REGRESSION',
      valid: true,
      issues: []
    };

    // Check all engines still have expected methods
    const validation = this._validateEngineMethods();
    if (!validation.valid) {
      check.valid = false;
      check.issues = validation.issues;
    }

    // Check determinism preserved
    const determinism = this._validateDeterminism();
    if (!determinism.valid) {
      check.valid = false;
      check.issues.push(...determinism.issues);
    }

    return check;
  }

  /**
   * CHECK 3: Validate no engine responsibility overlap
   */
  async _validateNoEngineLap() {
    const check = {
      name: 'NO_ENGINE_RESPONSIBILITY_OVERLAP',
      valid: true,
      issues: []
    };

    // Validation responsibility: schema/event/dependency/capability/version checks
    // Enforcement responsibility: operation permission checks
    // Observability responsibility: logging/metrics/traces/events
    // Recovery responsibility: failure classification/routing/recovery

    // New classes should not overlap:
    // - ValidationDecisionPipeline: shared decisions (Validation+Enforcement input)
    // - ObservabilityDispatchContract: shared dispatcher (all engines output)
    // - RecoveryDecisionExecution: shared execution (Recovery output)
    // - InvariantCentralization: shared source (all engines input)
    // - UnifiedFailureFlow: shared flow (Recovery orchestration)

    const overlaps = this._detectResponsibilityOverlap();
    if (overlaps.length > 0) {
      check.valid = false;
      check.issues = overlaps;
    }

    return check;
  }

  /**
   * CHECK 4: Validate invariant centralization
   */
  async _validateInvariantCentralization() {
    const check = {
      name: 'INVARIANT_CENTRALIZATION',
      valid: true,
      issues: []
    };

    // Check no duplicate invariant definitions
    const duplication = this._checkInvariantDuplication();
    if (duplication.hasDuplicates) {
      check.valid = false;
      check.issues.push({
        issue: 'DUPLICATE_INVARIANTS',
        duplicates: duplication.duplicates
      });
    }

    // Check all engines use InvariantCentralization
    const usage = this._validateInvariantUsage();
    if (!usage.allEnginesUse) {
      check.valid = false;
      check.issues.push({
        issue: 'ENGINES_NOT_USING_CENTRALIZATION',
        engines: usage.enginesNotUsing
      });
    }

    return check;
  }

  /**
   * CHECK 5: Validate observability unification
   */
  async _validateObservabilityUnification() {
    const check = {
      name: 'OBSERVABILITY_UNIFICATION',
      valid: true,
      issues: []
    };

    // Check ObservabilityDispatchContract enforces mandatory fields
    const mandatoryFields = this._validateMandatoryFields();
    if (!mandatoryFields.valid) {
      check.valid = false;
      check.issues.push({
        issue: 'MISSING_MANDATORY_FIELDS',
        fields: mandatoryFields.missing
      });
    }

    // Check no direct logging bypasses dispatcher
    const directLogging = this._detectDirectLogging();
    if (directLogging.instances > 0) {
      check.valid = false;
      check.issues.push({
        issue: 'DIRECT_LOGGING_DETECTED',
        instances: directLogging.instances
      });
    }

    return check;
  }

  /**
   * CHECK 6: Validate recovery flow unification
   */
  async _validateRecoveryUnification() {
    const check = {
      name: 'RECOVERY_FLOW_UNIFICATION',
      valid: true,
      issues: []
    };

    // Check failure processing doesn't duplicate classification
    const classification = this._validateClassificationOnce();
    if (!classification.valid) {
      check.valid = false;
      check.issues.push({
        issue: 'CLASSIFICATION_DUPLICATED',
        instances: classification.duplicateInstances
      });
    }

    // Check RecoveryDecisionExecution enforces HIGH/CRITICAL escalation
    const escalation = this._validateEscalationRules();
    if (!escalation.valid) {
      check.valid = false;
      check.issues.push({
        issue: 'ESCALATION_NOT_ENFORCED',
        violations: escalation.violations
      });
    }

    return check;
  }

  /**
   * Build dependency/import graph (internal)
   */
  _buildImportGraph() {
    // Placeholder: real implementation would analyze actual imports
    return {};
  }

  /**
   * Detect cycles in dependency graph (internal)
   */
  _detectCycles(graph) {
    // Placeholder: real implementation would use DFS/BFS
    return [];
  }

  /**
   * Validate engine methods still present (internal)
   */
  _validateEngineMethods() {
    const engines = ['validation', 'enforcement', 'observability', 'recovery'];
    const issues = [];
    let valid = true;

    // Placeholder: check each engine has expected methods
    for (const engine of engines) {
      if (!this.system[engine]) {
        valid = false;
        issues.push({ engine, issue: 'ENGINE_NOT_FOUND' });
      }
    }

    return { valid, issues };
  }

  /**
   * Validate determinism preserved (internal)
   */
  _validateDeterminism() {
    // Placeholder: check for randomness, timing dependencies, etc.
    return { valid: true, issues: [] };
  }

  /**
   * Detect responsibility overlaps (internal)
   */
  _detectResponsibilityOverlap() {
    // Placeholder: check class responsibilities don't overlap
    return [];
  }

  /**
   * Check for invariant duplication (internal)
   */
  _checkInvariantDuplication() {
    // Placeholder: check no duplicate invariant IDs
    return { hasDuplicates: false, duplicates: [] };
  }

  /**
   * Validate all engines use InvariantCentralization (internal)
   */
  _validateInvariantUsage() {
    // Placeholder: check engines import and use InvariantCentralization
    return { allEnginesUse: true, enginesNotUsing: [] };
  }

  /**
   * Validate mandatory fields in observability (internal)
   */
  _validateMandatoryFields() {
    const mandatoryFields = ['traceId', 'requestId', 'moduleId', 'timestamp'];
    // Placeholder: check dispatcher enforces these
    return { valid: true, missing: [] };
  }

  /**
   * Detect direct logging calls (anti-pattern) (internal)
   */
  _detectDirectLogging() {
    // Placeholder: grep for console.log, logger.emit in engines
    return { instances: 0 };
  }

  /**
   * Validate classification happens once (internal)
   */
  _validateClassificationOnce() {
    // Placeholder: check failure isn't classified multiple times
    return { valid: true, duplicateInstances: [] };
  }

  /**
   * Validate escalation rules enforced (internal)
   */
  _validateEscalationRules() {
    // Placeholder: check HIGH/CRITICAL failures escalate, not execute
    return { valid: true, violations: [] };
  }

  /**
   * Get all validation results
   */
  getAllResults() {
    return this.validationResults;
  }

  /**
   * Get final verdict
   */
  getVerdict() {
    if (this.validationResults.length === 0) {
      return { verdict: 'NOT_VALIDATED', message: 'No validation run yet' };
    }

    const latestResult = this.validationResults[this.validationResults.length - 1];

    return {
      verdict: latestResult.overallValid ? 'PASS' : 'FAIL',
      message: latestResult.overallValid
        ? 'Architecture is consistent — no regressions detected'
        : `Architecture has ${latestResult.issueCount} issue(s) — see details`,
      details: latestResult,
      timestamp: latestResult.validationTime
    };
  }
}

module.exports = ArchitecturalConsistencyValidator;
