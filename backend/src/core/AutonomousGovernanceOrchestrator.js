/**
 * AutonomousGovernanceOrchestrator
 * PHASE 1.3 — Complete the Autonomous Governance Loop
 *
 * Orchestrates the 4 CAAGS layers:
 * 1. RuntimeValidationEngine (5s cycles) → violations
 * 2. SelfHealingOrchestrator (6s polling) → auto-correction
 * 3. RecoveryOrchestrator (resilience) → recovery for CRITICAL
 * 4. DegradationMonitor → health tracking
 *
 * Closed-loop: violations → healing → recovery → health → next cycle
 * No human intervention except for HIGH/CRITICAL escalations.
 *
 * Responsibilities:
 * - Initialize all 4 governance layers
 * - Run autonomous governance loop (6s ticks)
 * - Extract and route violations
 * - Handle critical escalations
 * - Maintain audit trail and metrics
 */

const { ConstitutionLoaderManager } = require('./loaders');
const SelfHealingOrchestrator = require('./self-healing/SelfHealingOrchestrator');
const logger = require('./utils/logger');

class AutonomousGovernanceOrchestrator {
  constructor(options = {}) {
    this.constitutionManager = null;
    this.validationEngine = null;
    this.healingOrchestrator = null;
    this.recoveryOrchestrator = null;

    this.loopActive = false;
    this.loopInterval = null;
    this.loopInterval_ms = options.loopInterval_ms || 6000;

    // Circular buffer: keep last 200 entries
    this.governanceLog = [];
    this.maxLogEntries = 200;

    this.metrics = {
      loopTicks: 0,
      totalViolationsProcessed: 0,
      escalationsTriggered: 0,
      autonomousCorrections: 0,
      loopStartedAt: null
    };
  }

  /**
   * Initialize all governance layers
   */
  async initialize(options = {}) {
    try {
      // Step 1: Load Constitution
      this.constitutionManager = new ConstitutionLoaderManager();
      try {
        await this.constitutionManager.loadConstitution();
        logger.info('✅ Constitution loaded for CAAGS');
      } catch (err) {
        logger.warn('⚠️  Constitution load failed, continuing with limited governance', {
          meta: { error: err.message }
        });
        // Continue without constitution — governance still runs
      }

      // Step 2: Create Recovery Orchestrator (resilience layer)
      try {
        const ResilienceRecovery = require('./resilience/RecoveryOrchestrator');
        this.recoveryOrchestrator = new ResilienceRecovery({});
        logger.info('✅ RecoveryOrchestrator initialized');
      } catch (err) {
        logger.warn('⚠️  RecoveryOrchestrator init failed', { meta: { error: err.message } });
        this.recoveryOrchestrator = null;
      }

      // Step 3: Create Self-Healing Orchestrator
      this.healingOrchestrator = new SelfHealingOrchestrator({
        healingEnabled: true,
        recoveryOrchestrator: this.recoveryOrchestrator,
        escalationCallback: (violation) => this._handleCritical(violation)
      });
      logger.info('✅ SelfHealingOrchestrator initialized');

      // Step 4: Wire RuntimeValidationEngine with critical handler
      try {
        const { RuntimeValidationEngine } = require('./validators');
        // Only create validation engine if constitution is loaded
        if (this.constitutionManager) {
          this.validationEngine = new RuntimeValidationEngine(
            this.constitutionManager,
            {
              criticalViolationHandler: (violations) => this._handleCritical(violations),
              eventBus: options.eventBus || null // PHASE 5.5: Event-driven mode
            }
          );
          logger.info('✅ RuntimeValidationEngine initialized with critical handler');
        } else {
          logger.warn('⚠️  Skipping RuntimeValidationEngine (constitution not available)');
          this.validationEngine = null;
        }
      } catch (err) {
        logger.warn('⚠️  RuntimeValidationEngine init failed, continuing without validation', {
          meta: { error: err.message }
        });
        this.validationEngine = null;
      }

      return {
        initialized: true,
        phase: 'CAAGS',
        layers: {
          constitution: !!this.constitutionManager,
          validation: !!this.validationEngine,
          healing: !!this.healingOrchestrator,
          recovery: !!this.recoveryOrchestrator
        }
      };
    } catch (error) {
      logger.error('❌ CAAGS initialization failed', { meta: { error: error.message } });
      throw error;
    }
  }

  /**
   * Start event-driven governance (no polling)
   * PHASE 5.5: Pure event-driven mode
   */
  start(eventBus = null) {
    if (this.loopActive) {
      return { started: false, reason: 'already_running' };
    }

    try {
      // Wire to event bus for event-driven reactions (PHASE 5.5)
      if (eventBus) {
        this._wireEventSubscriptions(eventBus);

        // Also wire validation engine to emit events (PHASE 5.5)
        if (this.validationEngine) {
          this.validationEngine.setEventBus(eventBus);
        }

        logger.info('✅ CAAGS wired to event bus (event-driven mode)', {
          meta: { mode: 'event-driven', pollingDisabled: true }
        });
      }

      // Connect healing to recovery and start monitoring
      if (this.healingOrchestrator && this.recoveryOrchestrator) {
        this.healingOrchestrator.connectToSystem({
          recoveryOrchestrator: this.recoveryOrchestrator
        });
      }

      // Mark as active (event-driven, no polling)
      this.loopActive = true;
      this.metrics.loopStartedAt = new Date().toISOString();

      logger.info('✅ CAAGS governance started (pure event-driven, no polling)', {
        meta: { mode: 'event-driven' }
      });

      return { started: true, mode: 'event-driven', pollingDisabled: true };
    } catch (error) {
      logger.error('❌ CAAGS start failed', { meta: { error: error.message } });
      return { started: false, error: error.message };
    }
  }

  /**
   * Wire event subscriptions (PHASE 5.5)
   * Subscribe to all event types and react accordingly
   */
  _wireEventSubscriptions(eventBus) {
    // Subscribe to all VIOLATION events
    eventBus.subscribe('VIOLATION', (event) => {
      this._handleViolationEvent(event);
    });

    // Subscribe to all HEALING events
    eventBus.subscribe('HEALING', (event) => {
      this._handleHealingEvent(event);
    });

    // Subscribe to all RECOVERY events
    eventBus.subscribe('RECOVERY', (event) => {
      this._handleRecoveryEvent(event);
    });

    // Subscribe to all HEALTH events
    eventBus.subscribe('HEALTH', (event) => {
      this._handleHealthEvent(event);
    });

    return { subscribed: true };
  }

  /**
   * Handle violation event (PHASE 5.5)
   * Routes LOW/MEDIUM violations to healing, HIGH/CRITICAL to recovery
   */
  async _handleViolationEvent(event) {
    this.metrics.totalViolationsProcessed += 1;

    // Normalize event to violation object
    const violation = {
      type: event.payload?.type || 'unknown_violation',
      severity: event.severity,
      message: event.payload?.message || 'Violation detected',
      validator: event.payload?.validator || event.source,
      timestamp: event.timestamp,
      traceId: event.traceId,
      eventId: event.id
    };

    // Route by severity
    if (['HIGH', 'CRITICAL'].includes(event.severity)) {
      // Route to recovery orchestrator
      await this._handleCritical(violation);
      this._logTick({
        eventId: event.id,
        eventType: 'VIOLATION',
        severity: event.severity,
        action: 'routed_to_recovery',
        traceId: event.traceId
      });
    } else {
      // LOW/MEDIUM: route to healing orchestrator
      if (this.healingOrchestrator) {
        try {
          const healingResult = await this.healingOrchestrator.runHealingCycle([violation]);
          const corrected = healingResult.processed?.filter(p => p.action === 'CORRECTED').length || 0;
          this.metrics.autonomousCorrections += corrected;

          this._logTick({
            eventId: event.id,
            eventType: 'VIOLATION',
            severity: event.severity,
            action: 'healed',
            corrected,
            traceId: event.traceId
          });
        } catch (error) {
          this._logTick({
            eventId: event.id,
            eventType: 'VIOLATION',
            severity: event.severity,
            action: 'healing_failed',
            error: error.message,
            traceId: event.traceId
          });
        }
      } else {
        this._logTick({
          eventId: event.id,
          eventType: 'VIOLATION',
          severity: event.severity,
          action: 'logged_for_monitoring',
          traceId: event.traceId
        });
      }
    }
  }

  /**
   * Handle healing event (PHASE 5.5)
   */
  async _handleHealingEvent(event) {
    if (event.payload?.applied) {
      this.metrics.autonomousCorrections += 1;
    }

    this._logTick({
      eventId: event.id,
      eventType: 'HEALING',
      action: 'correction_applied',
      applied: event.payload?.applied,
      traceId: event.traceId
    });
  }

  /**
   * Handle recovery event (PHASE 5.5)
   */
  async _handleRecoveryEvent(event) {
    this.metrics.escalationsTriggered += 1;

    this._logTick({
      eventId: event.id,
      eventType: 'RECOVERY',
      action: 'recovery_initiated',
      status: event.payload?.status,
      traceId: event.traceId
    });
  }

  /**
   * Handle health event (PHASE 5.5)
   */
  async _handleHealthEvent(event) {
    this._logTick({
      eventId: event.id,
      eventType: 'HEALTH',
      action: 'health_update',
      healthScore: event.payload?.healthScore,
      traceId: event.traceId
    });
  }

  /**
   * Stop the autonomous governance loop
   */
  stop() {
    if (!this.loopActive) {
      return { stopped: false, reason: 'not_running' };
    }

    try {
      // Stop governance loop
      if (this.loopInterval) {
        clearInterval(this.loopInterval);
      }

      // Stop validation engine
      if (this.validationEngine) {
        try {
          this.validationEngine.stopValidation();
        } catch (e) {
          // Already stopped or not running
        }
      }

      // Stop healing monitoring
      if (this.healingOrchestrator) {
        try {
          this.healingOrchestrator.stopMonitoring();
        } catch (e) {
          // Already stopped
        }
      }

      this.loopActive = false;

      logger.info('✅ CAAGS governance loop stopped', {
        meta: { metrics: this.metrics }
      });

      return { stopped: true, metrics: this.metrics };
    } catch (error) {
      logger.error('❌ CAAGS stop failed', { meta: { error: error.message } });
      return { stopped: false, error: error.message };
    }
  }

  /**
   * Core governance tick (6s cycle)
   * Polls validation results, extracts violations, feeds to healing
   */
  async _governanceTick() {
    this.metrics.loopTicks += 1;

    try {
      // Get latest validation results
      if (!this.validationEngine) {
        return;
      }

      const latest = this.validationEngine.getLatestResults();
      if (!latest) {
        return;
      }

      // Extract violations from cycle result
      const violations = this._extractViolations(latest);
      if (violations.length === 0) {
        return;
      }

      // Feed to healing orchestrator
      const result = await this.healingOrchestrator.runHealingCycle(violations);

      this.metrics.totalViolationsProcessed += violations.length;
      this.metrics.autonomousCorrections += result.processed
        .filter(p => p.action === 'CORRECTED').length;

      this._logTick({
        tick: this.metrics.loopTicks,
        violationsProcessed: violations.length,
        corrections: result.processed.filter(p => p.action === 'CORRECTED').length,
        escalations: result.processed.filter(p => p.action === 'ESCALATED').length
      });
    } catch (error) {
      this._logTick({
        tick: this.metrics.loopTicks,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle critical violations (escalation to recovery)
   * Called by RuntimeValidationEngine or SelfHealingOrchestrator
   */
  async _handleCritical(violations) {
    if (!Array.isArray(violations)) {
      violations = [violations];
    }

    this.metrics.escalationsTriggered += violations.length;

    for (const violation of violations) {
      try {
        if (this.recoveryOrchestrator) {
          // Route to recovery orchestrator
          await this.recoveryOrchestrator.executeRecovery(
            new Error(violation.message || violation.type || 'CRITICAL_VIOLATION'),
            {
              violation,
              source: 'caags_governance_loop',
              timestamp: new Date().toISOString()
            }
          );
        } else {
          // No recovery orchestrator — just log escalation
          logger.error('🚨 CRITICAL violation escalated (no recovery orchestrator)', {
            meta: { violation }
          });
        }
      } catch (recoveryError) {
        // Recovery itself failed — log but don't exit
        logger.error('❌ Recovery failed for critical violation', {
          meta: {
            violation,
            recoveryError: recoveryError.message
          }
        });

        this._logTick({
          tick: this.metrics.loopTicks,
          criticalUnhandled: violation,
          recoveryError: recoveryError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Extract violations from validation cycle result
   * Normalizes violations across all validators
   */
  _extractViolations(cycleResult) {
    const violations = [];

    if (!cycleResult.validators) {
      return violations;
    }

    // Iterate over each validator result
    for (const [validatorName, result] of Object.entries(cycleResult.validators)) {
      if (result && result.violations && Array.isArray(result.violations)) {
        for (const violation of result.violations) {
          // Normalize severity if missing
          const normalized = {
            type: violation.type || `${validatorName}_violation`,
            severity: violation.severity || 'MEDIUM',
            message: violation.message,
            validator: validatorName,
            timestamp: cycleResult.timestamp
          };
          violations.push(normalized);
        }
      }
    }

    return violations;
  }

  /**
   * Log governance tick event (circular buffer)
   */
  _logTick(entry) {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    };

    this.governanceLog.push(logEntry);

    // Keep only last N entries
    if (this.governanceLog.length > this.maxLogEntries) {
      this.governanceLog.shift();
    }
  }

  /**
   * Get current governance status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      loopActive: this.loopActive,
      loopInterval_ms: this.loopInterval_ms,
      metrics: { ...this.metrics },
      validationEngine: this.validationEngine ? this.validationEngine.getStatus() : null,
      healingOrchestrator: this.healingOrchestrator ? {
        cyclesRun: this.healingOrchestrator.metrics.cyclesRun,
        violationsReceived: this.healingOrchestrator.metrics.violationsReceived,
        corrected: this.healingOrchestrator.metrics.violationsCorrected,
        escalated: this.healingOrchestrator.metrics.violationsEscalated
      } : null,
      recoveryOrchestrator: this.recoveryOrchestrator ? { connected: true } : { connected: false },
      systemConnected: !!(this.recoveryOrchestrator || this.validationEngine)
    };
  }

  /**
   * Generate comprehensive governance report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      phase: 'CAAGS',
      loopActive: this.loopActive,
      uptime_ms: this.metrics.loopStartedAt
        ? Date.now() - new Date(this.metrics.loopStartedAt).getTime()
        : 0,
      metrics: { ...this.metrics },
      validationStatus: this.validationEngine ? this.validationEngine.getDetailedReport() : null,
      healingStatus: this.healingOrchestrator ? this.healingOrchestrator.getHealingReport() : null,
      recentActivity: this.governanceLog.slice(-20),
      systemHealth: {
        validationRunning: this.validationEngine ? this.validationEngine.running : false,
        healingCyclesRun: this.healingOrchestrator ? this.healingOrchestrator.metrics.cyclesRun : 0,
        correctionsApplied: this.metrics.autonomousCorrections,
        escalationsHandled: this.metrics.escalationsTriggered
      }
    };
  }

  /**
   * Get last N log entries
   */
  getRecentLogs(n = 50) {
    return this.governanceLog.slice(-n);
  }

  /**
   * Reset governance state
   */
  reset() {
    if (this.loopActive) {
      this.stop();
    }

    this.governanceLog = [];
    this.metrics = {
      loopTicks: 0,
      totalViolationsProcessed: 0,
      escalationsTriggered: 0,
      autonomousCorrections: 0,
      loopStartedAt: null
    };

    if (this.validationEngine) {
      try {
        this.validationEngine.reset?.();
      } catch (e) {
        // Ignore
      }
    }

    if (this.healingOrchestrator) {
      try {
        this.healingOrchestrator.reset?.();
      } catch (e) {
        // Ignore
      }
    }

    return { reset: true };
  }
}

module.exports = AutonomousGovernanceOrchestrator;
