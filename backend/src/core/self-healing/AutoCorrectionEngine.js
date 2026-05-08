/**
 * AutoCorrectionEngine
 * PHASE 1.3 — Self-Healing Governance
 *
 * Applies automatic corrections EXCLUSIVELY to LOW and MEDIUM severity violations.
 * HIGH and CRITICAL violations are never auto-corrected — they escalate.
 * Core guard: canCorrect() validates severity before any action.
 *
 * Responsibilities:
 * - Guard violations by severity
 * - Register correction strategies
 * - Execute corrections with timeout
 * - Track correction attempts and outcomes
 * - Manage rollback capability
 * - Enforce immutable allowedSeverities
 */

class AutoCorrectionEngine {
  constructor(options = {}) {
    if (!options) throw new Error('options required');

    this.correctionStrategies = new Map();
    this.correctionHistory = [];
    this.pendingCorrections = new Map();

    this.metrics = {
      correctionsAttempted: 0,
      correctionsSucceeded: 0,
      correctionsFailed: 0,
      escalationsTriggered: 0
    };

    // HARD CONSTRAINT — immuable
    this.config = {
      allowedSeverities: Object.freeze(['LOW', 'MEDIUM']),
      forbiddenSeverities: Object.freeze(['HIGH', 'CRITICAL']),
      maxCorrectionAttempts: options.maxCorrectionAttempts || 3,
      correctionTimeout_ms: options.correctionTimeout_ms || 5000
    };

    this._initializeDefaultStrategies();
  }

  /**
   * CORE GUARD FUNCTION — Check if violation can be auto-corrected
   * Called BEFORE any correction attempt
   * Returns false for HIGH/CRITICAL with mustEscalate flag
   */
  canCorrect(violation) {
    if (!violation) throw new Error('violation required');

    // Check severity — EXPLICIT enforcement
    if (!violation.severity) {
      return {
        canCorrect: false,
        reason: 'severity_missing',
        mustEscalate: false
      };
    }

    if (this.config.forbiddenSeverities.includes(violation.severity)) {
      return {
        canCorrect: false,
        reason: 'severity_not_allowed',
        severity: violation.severity,
        allowedSeverities: this.config.allowedSeverities,
        mustEscalate: true
      };
    }

    if (!this.config.allowedSeverities.includes(violation.severity)) {
      return {
        canCorrect: false,
        reason: 'severity_not_allowed',
        severity: violation.severity,
        allowedSeverities: this.config.allowedSeverities,
        mustEscalate: false
      };
    }

    // Severity is LOW or MEDIUM — OK to attempt correction
    return {
      canCorrect: true,
      severity: violation.severity
    };
  }

  /**
   * Register a correction strategy for a violation type
   */
  registerCorrectionStrategy(violationType, strategyFn) {
    if (!violationType || !strategyFn) throw new Error('violationType and strategyFn required');

    this.correctionStrategies.set(violationType, strategyFn);
    return { registered: true, violationType };
  }

  /**
   * Initialize default correction strategies
   * All default strategies are NON-DESTRUCTIVE (log-only)
   */
  _initializeDefaultStrategies() {
    // Strategy 1: NAMING_VIOLATION — log only
    this.registerCorrectionStrategy('NAMING_VIOLATION', (violation) => ({
      applied: false,
      reason: 'naming_violations_require_manual_fix',
      description: `Naming violation detected: ${violation.message}. Developer review required.`,
      rollbackFn: null
    }));

    // Strategy 2: MISSING_EXPORT_PATTERN — log only
    this.registerCorrectionStrategy('MISSING_EXPORT_PATTERN', (violation) => ({
      applied: false,
      reason: 'export_pattern_requires_manual_fix',
      description: `Export pattern error: ${violation.message}. File structure update required.`,
      rollbackFn: null
    }));

    // Strategy 3: LINE_COUNT_EXCEEDED — log only
    this.registerCorrectionStrategy('LINE_COUNT_EXCEEDED', (violation) => ({
      applied: false,
      reason: 'refactoring_required',
      description: `File too large: ${violation.message}. Refactoring suggested.`,
      rollbackFn: null
    }));

    // Strategy 4: UNDECLARED_DEPENDENCY — log only
    this.registerCorrectionStrategy('UNDECLARED_DEPENDENCY', (violation) => ({
      applied: false,
      reason: 'constitution_update_required',
      description: `Undeclared dependency: ${violation.message}. Constitution update needed.`,
      rollbackFn: null
    }));
  }

  /**
   * Apply a correction to a violation
   * GUARD: canCorrect() must return true before calling this
   */
  async applyCorrection(violation) {
    if (!violation) throw new Error('violation required');

    const startTime = Date.now();
    this.metrics.correctionsAttempted += 1;

    // Check if we can correct (guard must pass)
    const canCorrect = this.canCorrect(violation);
    if (!canCorrect.canCorrect) {
      return {
        correctionId: null,
        applied: false,
        reason: canCorrect.reason,
        mustEscalate: canCorrect.mustEscalate,
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Get strategy
      const strategy = this.correctionStrategies.get(violation.type);
      if (!strategy) {
        return {
          correctionId: null,
          applied: false,
          reason: 'no_strategy_registered',
          description: `No strategy for violation type: ${violation.type}`,
          timestamp: new Date().toISOString()
        };
      }

      // Execute with timeout
      let result;
      const correctionPromise = Promise.resolve(strategy(violation));
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ applied: false, reason: 'timeout' }), this.config.correctionTimeout_ms)
      );

      result = await Promise.race([correctionPromise, timeoutPromise]);

      const correctionId = `corr_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Track correction
      if (result.applied) {
        this.metrics.correctionsSucceeded += 1;
      } else {
        this.metrics.correctionsFailed += 1;
      }

      // Store in pending if rollback capable
      if (result.rollbackFn) {
        this.pendingCorrections.set(correctionId, {
          violation,
          result,
          rollbackFn: result.rollbackFn
        });
      }

      this.correctionHistory.push({
        correctionId,
        violation,
        result,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      });

      return {
        correctionId,
        applied: result.applied,
        reason: result.reason,
        description: result.description,
        rollbackAvailable: !!result.rollbackFn,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      };
    } catch (error) {
      this.metrics.correctionsFailed += 1;

      return {
        correctionId: null,
        applied: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Rollback a correction if possible
   */
  rollbackCorrection(correctionId) {
    if (!correctionId) throw new Error('correctionId required');

    const pending = this.pendingCorrections.get(correctionId);
    if (!pending) {
      return {
        rolledBack: false,
        reason: 'correction_not_found_or_not_rollbackable'
      };
    }

    try {
      if (pending.rollbackFn) {
        pending.rollbackFn();
        this.pendingCorrections.delete(correctionId);
        return {
          rolledBack: true,
          timestamp: new Date().toISOString()
        };
      }

      return {
        rolledBack: false,
        reason: 'rollback_function_not_available'
      };
    } catch (error) {
      return {
        rolledBack: false,
        error: error.message
      };
    }
  }

  /**
   * Get correction history
   */
  getCorrectionHistory(limit = 100) {
    return this.correctionHistory.slice(-limit);
  }

  /**
   * Get pending corrections
   */
  getPendingCorrections() {
    return Array.from(this.pendingCorrections.keys());
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      allowedSeverities: [...this.config.allowedSeverities],
      forbiddenSeverities: [...this.config.forbiddenSeverities],
      strategiesRegistered: this.correctionStrategies.size,
      pendingCorrections: this.pendingCorrections.size
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.correctionHistory = [];
    this.pendingCorrections.clear();
    this.metrics = {
      correctionsAttempted: 0,
      correctionsSucceeded: 0,
      correctionsFailed: 0,
      escalationsTriggered: 0
    };
    // Note: strategies preserved
    return { reset: true };
  }
}

module.exports = AutoCorrectionEngine;
