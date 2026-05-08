/**
 * SelfHealingOrchestrator
 * PHASE 1.3 — Self-Healing Governance
 *
 * Main orchestrator for self-healing governance cycle.
 * Integrates ViolationPatternAnalyzer, AutoCorrectionEngine, DegradationMonitor, SelfHealingAuditTrail.
 * Coordinates with RecoveryOrchestrator (Phase 1.6) for HIGH/CRITICAL violations.
 * Mandatory: Log to audit trail BEFORE any action.
 *
 * Responsibilities:
 * - Process individual violations with guard checking
 * - Run healing cycles on violation batches
 * - Coordinate with Recovery Layer
 * - Monitor system health proactively
 * - Generate healing reports
 */

const ViolationPatternAnalyzer = require('./ViolationPatternAnalyzer');
const AutoCorrectionEngine = require('./AutoCorrectionEngine');
const DegradationMonitor = require('./DegradationMonitor');
const SelfHealingAuditTrail = require('./SelfHealingAuditTrail');

class SelfHealingOrchestrator {
  constructor(options = {}) {
    if (!options) throw new Error('options required');

    this.patternAnalyzer = new ViolationPatternAnalyzer(options);
    this.correctionEngine = new AutoCorrectionEngine(options);
    this.degradationMonitor = new DegradationMonitor(options);
    this.auditTrail = new SelfHealingAuditTrail(options);

    // Optional injection from Phase 1.6
    this.recoveryOrchestrator = options.recoveryOrchestrator || null;

    this.healingCycleHistory = [];
    this.activeHealings = new Map();

    // PHASE 5.7: Throttling and history bounds
    this.minHealingInterval_ms = options.minHealingInterval_ms || 2000;
    this.lastHealingCycleAt = 0;
    this.maxHealingCycleHistory = options.maxHealingCycleHistory || 200;

    this.config = {
      healingEnabled: options.healingEnabled !== false,
      escalationCallback: options.escalationCallback || null,
      degradationMonitoringEnabled: options.degradationMonitoringEnabled !== false
    };

    this.metrics = {
      cyclesRun: 0,
      violationsReceived: 0,
      violationsCorrected: 0,
      violationsEscalated: 0,
      patternAnalysesRun: 0,
      healingCyclesThrottled: 0 // PHASE 5.7
    };
  }

  /**
   * CORE METHOD — Process a single violation
   * MANDATORY SEQUENCE:
   * 1. Log decision to audit trail BEFORE any action
   * 2. Check if violation can be corrected
   * 3. If HIGH/CRITICAL: escalate via recovery orchestrator
   * 4. If LOW/MEDIUM: attempt correction
   *
   * PHASE 5.7: Check idempotency via activeHealings, wrap escalation with timeout
   */
  async processViolation(violation) {
    if (!violation) throw new Error('violation required');

    // PHASE 5.7: Idempotency check (prevent re-healing same violation)
    const violationKey = violation.id || `${violation.type}:${violation.validator}`;
    if (this.activeHealings.has(violationKey)) {
      return { action: 'SKIPPED', reason: 'already_healing', violationKey };
    }
    this.activeHealings.set(violationKey, Date.now());

    try {
      this.metrics.violationsReceived += 1;

      // STEP 1: LOG TO AUDIT TRAIL — MANDATORY FIRST
      const auditEntry = this.auditTrail.logDecision('VIOLATION_RECEIVED', {
        violation,
        receivedAt: new Date().toISOString()
      });

      // STEP 2: Record in pattern analyzer
      this.patternAnalyzer.recordViolation(violation);

      // STEP 3: Check if violation can be auto-corrected
      const canCorrect = this.correctionEngine.canCorrect(violation);

      if (!canCorrect.canCorrect) {
        // HIGH/CRITICAL or unknown — escalate
        if (canCorrect.mustEscalate) {
          this.auditTrail.logEscalation(violation, canCorrect.reason);
          this.metrics.violationsEscalated += 1;

          // Delegate to Recovery Orchestrator if available
          if (this.recoveryOrchestrator && this.config.escalationCallback) {
            // PHASE 5.7: Wrap escalation with timeout
            const ESCALATION_TIMEOUT_MS = 5000;
            const escalationResult = await Promise.race([
              Promise.resolve(this.config.escalationCallback(violation)),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('ESCALATION_TIMEOUT')), ESCALATION_TIMEOUT_MS)
              )
            ]).catch(err => ({
              timedOut: err.message === 'ESCALATION_TIMEOUT',
              error: err.message
            }));

            return {
              action: 'ESCALATED',
              escalationResult,
              auditEntryId: auditEntry.id
            };
          }

          return {
            action: 'ESCALATED',
            reason: canCorrect.reason,
            auditEntryId: auditEntry.id
          };
        }

        // Unknown severity — log but don't escalate
        return {
          action: 'SKIPPED',
          reason: 'cannot_correct',
          auditEntryId: auditEntry.id
        };
      }

      // STEP 4: Attempt correction for LOW/MEDIUM
      if (!this.config.healingEnabled) {
        return {
          action: 'SKIPPED',
          reason: 'healing_disabled',
          auditEntryId: auditEntry.id
        };
      }

      try {
        const correctionAttempt = this.auditTrail.logCorrectionAttempt(
          violation,
          `strategy_for_${violation.type}`,
          'auto_correction_attempt'
        );

        const correctionResult = await this.correctionEngine.applyCorrection(violation);

        this.auditTrail.logCorrectionOutcome(correctionResult.correctionId, correctionResult.applied, {
          reason: correctionResult.reason,
          description: correctionResult.description
        });

        if (correctionResult.applied) {
          this.metrics.violationsCorrected += 1;
          return {
            action: 'CORRECTED',
            correctionId: correctionResult.correctionId,
            auditEntryId: auditEntry.id
          };
        } else {
          return {
            action: 'CORRECTION_FAILED',
            reason: correctionResult.reason,
            auditEntryId: auditEntry.id
          };
        }
      } catch (error) {
        return {
          action: 'ERROR',
          error: error.message,
          auditEntryId: auditEntry.id
        };
      }
    } finally {
      // PHASE 5.7: Remove from activeHealings when done
      this.activeHealings.delete(violationKey);
    }
  }

  /**
   * Run a complete healing cycle on a batch of violations
   * PHASE 5.7: Throttle minimum interval between cycles, cap history
   */
  async runHealingCycle(violations) {
    if (!Array.isArray(violations)) throw new Error('violations must be array');

    // PHASE 5.7: Throttle check
    const now = Date.now();
    if (now - this.lastHealingCycleAt < this.minHealingInterval_ms) {
      this.metrics.healingCyclesThrottled = (this.metrics.healingCyclesThrottled || 0) + 1;
      return { skipped: true, reason: 'throttled', violations: violations.length };
    }
    this.lastHealingCycleAt = now;

    const startTime = Date.now();
    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const processed = [];
    for (const violation of violations) {
      const result = await this.processViolation(violation);
      processed.push(result);
    }

    // Analyze patterns and generate predictions
    this.metrics.patternAnalysesRun += 1;
    const analysis = this.patternAnalyzer.analyzePatterns();
    const predictions = this.patternAnalyzer.predictNextViolation();

    const cycleResult = {
      cycleId,
      timestamp: new Date().toISOString(),
      processed,
      analysis,
      predictions,
      duration_ms: Date.now() - startTime
    };

    this.healingCycleHistory.push(cycleResult);

    // PHASE 5.7: Cap history to prevent unbounded growth
    if (this.healingCycleHistory.length > this.maxHealingCycleHistory) {
      this.healingCycleHistory.shift();
    }

    this.metrics.cyclesRun += 1;

    return cycleResult;
  }

  /**
   * Start degradation monitoring
   */
  startMonitoring(healthDataProvider) {
    if (!healthDataProvider) throw new Error('healthDataProvider required');
    if (!this.config.degradationMonitoringEnabled) {
      return { started: false, reason: 'degradation_monitoring_disabled' };
    }

    return this.degradationMonitor.start(healthDataProvider);
  }

  /**
   * Stop degradation monitoring
   */
  stopMonitoring() {
    return this.degradationMonitor.stop();
  }

  /**
   * Connect to external system components (RecoveryOrchestrator, ValidationEngine)
   * Enables auto-observation by wiring up health data and violation streams
   */
  connectToSystem({ recoveryOrchestrator = null, validationEngine = null } = {}) {
    if (recoveryOrchestrator) {
      this.recoveryOrchestrator = recoveryOrchestrator;
      // Automatically start monitoring if enabled
      if (this.config.degradationMonitoringEnabled) {
        const result = this.degradationMonitor.start(() => recoveryOrchestrator.getSystemHealth());
        if (!result.started) {
          this.auditTrail.logDecision('MONITORING_SETUP_FAILED', {
            reason: result.reason,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    if (validationEngine) {
      this._validationEngine = validationEngine;
    }

    return {
      connected: true,
      recoveryOrchestratorInjected: !!recoveryOrchestrator,
      validationEngineInjected: !!validationEngine,
      monitoringStarted: !!recoveryOrchestrator && this.config.degradationMonitoringEnabled
    };
  }

  /**
   * Get current degradation status
   */
  getDegradationStatus() {
    return this.degradationMonitor.getDegradationReport();
  }

  /**
   * Get comprehensive healing report
   */
  getHealingReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      cyclesRun: this.metrics.cyclesRun,
      violationRate: this.metrics.violationsReceived > 0
        ? Math.round((this.metrics.violationsEscalated / this.metrics.violationsReceived) * 100)
        : 0,
      correctionRate: this.metrics.violationsReceived > 0
        ? Math.round((this.metrics.violationsCorrected / this.metrics.violationsReceived) * 100)
        : 0,
      recentCycles: this.healingCycleHistory.slice(-5),
      patterns: this.patternAnalyzer.generateAnalysisReport(),
      degradation: this.degradationMonitor.getDegradationReport(),
      auditTrail: this.auditTrail.getStatistics()
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      healingEnabled: this.config.healingEnabled,
      monitoringActive: this.degradationMonitor.monitoringActive,
      recoveryOrchestratorInjected: !!this.recoveryOrchestrator,
      validationEngineInjected: !!this._validationEngine,
      systemConnected: !!(this.recoveryOrchestrator || this._validationEngine)
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.patternAnalyzer.reset();
    this.correctionEngine.reset();
    this.degradationMonitor.reset();
    this.auditTrail.reset();

    this.healingCycleHistory = [];
    this.activeHealings.clear();
    this.lastHealingCycleAt = 0; // PHASE 5.7

    this.metrics = {
      cyclesRun: 0,
      violationsReceived: 0,
      violationsCorrected: 0,
      violationsEscalated: 0,
      patternAnalysesRun: 0,
      healingCyclesThrottled: 0 // PHASE 5.7
    };

    return { reset: true };
  }
}

module.exports = SelfHealingOrchestrator;
