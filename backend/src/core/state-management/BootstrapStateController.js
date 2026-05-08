/**
 * BootstrapStateController.js - Control bootstrap phases and state
 * State Management Layer
 *
 * Responsibility: Manage bootstrap lifecycle and phase transitions
 * - Track bootstrap progress
 * - Control phase execution
 * - Enforce phase ordering
 * - Manage state during initialization
 * - Validate phase completion
 */

class BootstrapStateController {
  constructor(options = {}) {
    this.bootstrapState = 'NOT_STARTED';
    this.currentPhase = null;
    this.phases = new Map();
    this.phaseHistory = [];
    this.bootstrapMetadata = {};

    this.phaseDefinitions = {
      PHASE_0_CONSTITUTION: {
        phase: 0,
        name: 'Load Constitution',
        description: 'Load and validate constitutional declarations',
        timeoutMs: 5000,
        dependencies: [],
        critical: true
      },
      PHASE_1_LOADERS: {
        phase: 1,
        name: 'Initialize Loaders',
        description: 'Load all constitutional loaders',
        timeoutMs: 10000,
        dependencies: ['PHASE_0_CONSTITUTION'],
        critical: true
      },
      PHASE_2_VALIDATION: {
        phase: 2,
        name: 'Start Validation',
        description: 'Initialize validation engine',
        timeoutMs: 5000,
        dependencies: ['PHASE_1_LOADERS'],
        critical: true
      },
      PHASE_3_ENFORCEMENT: {
        phase: 3,
        name: 'Start Enforcement',
        description: 'Initialize enforcement engine',
        timeoutMs: 5000,
        dependencies: ['PHASE_2_VALIDATION'],
        critical: true
      },
      PHASE_4_OBSERVABILITY: {
        phase: 4,
        name: 'Start Observability',
        description: 'Initialize observability layer',
        timeoutMs: 5000,
        dependencies: ['PHASE_3_ENFORCEMENT'],
        critical: false
      },
      PHASE_5_RECOVERY: {
        phase: 5,
        name: 'Start Recovery',
        description: 'Initialize recovery layer',
        timeoutMs: 5000,
        dependencies: ['PHASE_4_OBSERVABILITY'],
        critical: false
      },
      PHASE_6_APPLICATION: {
        phase: 6,
        name: 'Start Application',
        description: 'Initialize application code',
        timeoutMs: 10000,
        dependencies: ['PHASE_5_RECOVERY'],
        critical: true
      }
    };

    this.config = {
      maxBootstrapTimeout_ms: options.maxBootstrapTimeout_ms || 60000,
      allowFailureRecovery: options.allowFailureRecovery !== false,
      validatePhaseOrder: options.validatePhaseOrder !== false
    };

    this.metrics = {
      bootstrapAttempts: 0,
      successfulBootstraps: 0,
      failedBootstraps: 0,
      averageBootstrapTime_ms: 0,
      averagePhaseTime_ms: {}
    };

    this._initializePhases();
  }

  /**
   * Initialize phase tracking
   */
  _initializePhases() {
    for (const [key, phaseDef] of Object.entries(this.phaseDefinitions)) {
      this.phases.set(key, {
        ...phaseDef,
        status: 'PENDING',
        startTime: null,
        endTime: null,
        duration_ms: 0,
        errors: [],
        completed: false
      });
    }
  }

  /**
   * Start bootstrap sequence
   */
  startBootstrap() {
    if (this.bootstrapState !== 'NOT_STARTED' && this.bootstrapState !== 'FAILED') {
      return {
        success: false,
        reason: `Cannot start bootstrap while in state: ${this.bootstrapState}`
      };
    }

    this.bootstrapState = 'RUNNING';
    this.bootstrapMetadata = {
      startTime: Date.now(),
      startedAt: new Date().toISOString(),
      bootstrapId: `bootstrap_${Date.now()}`
    };

    this.metrics.bootstrapAttempts++;

    return {
      success: true,
      bootstrapId: this.bootstrapMetadata.bootstrapId,
      startedAt: this.bootstrapMetadata.startedAt
    };
  }

  /**
   * Transition to phase
   */
  transitionToPhase(phaseName) {
    const phaseDef = this.phaseDefinitions[phaseName];

    if (!phaseDef) {
      return {
        success: false,
        reason: `Unknown phase: ${phaseName}`
      };
    }

    // Check if current phase is complete
    if (this.currentPhase) {
      const currentPhase = this.phases.get(this.currentPhase);
      if (!currentPhase.completed) {
        return {
          success: false,
          reason: `Current phase ${this.currentPhase} not completed`
        };
      }
    }

    // Validate dependencies
    for (const dependency of phaseDef.dependencies) {
      const depPhase = this.phases.get(dependency);
      if (!depPhase || !depPhase.completed) {
        return {
          success: false,
          reason: `Dependency ${dependency} not completed`
        };
      }
    }

    // Start phase
    const phase = this.phases.get(phaseName);
    phase.status = 'RUNNING';
    phase.startTime = Date.now();

    this.currentPhase = phaseName;

    return {
      success: true,
      phase: phaseName,
      phaseName: phaseDef.name,
      description: phaseDef.description,
      timeout_ms: phaseDef.timeoutMs,
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Complete current phase
   */
  completePhase(phaseName, metadata = {}) {
    const phase = this.phases.get(phaseName);

    if (!phase) {
      return {
        success: false,
        reason: `Unknown phase: ${phaseName}`
      };
    }

    if (phase.status !== 'RUNNING') {
      return {
        success: false,
        reason: `Phase not running: ${phaseName}`
      };
    }

    phase.endTime = Date.now();
    phase.duration_ms = phase.endTime - phase.startTime;
    phase.status = 'COMPLETED';
    phase.completed = true;
    phase.metadata = metadata;

    // Update metrics
    if (!this.metrics.averagePhaseTime_ms[phaseName]) {
      this.metrics.averagePhaseTime_ms[phaseName] = phase.duration_ms;
    } else {
      const avg = this.metrics.averagePhaseTime_ms[phaseName];
      this.metrics.averagePhaseTime_ms[phaseName] = Math.round((avg + phase.duration_ms) / 2);
    }

    return {
      success: true,
      phaseName,
      duration_ms: phase.duration_ms,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Record phase error
   */
  recordPhaseError(phaseName, error, severity = 'ERROR') {
    const phase = this.phases.get(phaseName);

    if (!phase) {
      return { success: false, reason: `Unknown phase: ${phaseName}` };
    }

    const errorRecord = {
      timestamp: new Date().toISOString(),
      error: error.message || String(error),
      severity,
      stack: error.stack
    };

    phase.errors.push(errorRecord);

    // If critical phase, mark as failed
    if (this.phaseDefinitions[phaseName].critical) {
      phase.status = 'FAILED';
      phase.completed = false;
    }

    return { recorded: true, errorCount: phase.errors.length };
  }

  /**
   * Complete bootstrap successfully
   */
  completeBootstrap() {
    // Verify all phases completed
    const incompletePhases = [];

    for (const [name, phase] of this.phases) {
      if (phase.critical && !phase.completed) {
        incompletePhases.push(name);
      }
    }

    if (incompletePhases.length > 0) {
      return {
        success: false,
        reason: `Incomplete critical phases: ${incompletePhases.join(', ')}`
      };
    }

    this.bootstrapState = 'COMPLETED';
    this.bootstrapMetadata.endTime = Date.now();
    this.bootstrapMetadata.endedAt = new Date().toISOString();
    this.bootstrapMetadata.totalDuration_ms = this.bootstrapMetadata.endTime - this.bootstrapMetadata.startTime;

    this.metrics.successfulBootstraps++;
    this.phaseHistory.push({
      bootstrapId: this.bootstrapMetadata.bootstrapId,
      status: 'SUCCESS',
      duration_ms: this.bootstrapMetadata.totalDuration_ms,
      timestamp: this.bootstrapMetadata.startedAt
    });

    // Update average
    const recentBootstraps = this.phaseHistory.slice(-10);
    if (recentBootstraps.length > 0) {
      const totalTime = recentBootstraps.reduce((sum, b) => sum + b.duration_ms, 0);
      this.metrics.averageBootstrapTime_ms = Math.round(totalTime / recentBootstraps.length);
    }

    return {
      success: true,
      bootstrapId: this.bootstrapMetadata.bootstrapId,
      totalDuration_ms: this.bootstrapMetadata.totalDuration_ms,
      completedAt: this.bootstrapMetadata.endedAt
    };
  }

  /**
   * Fail bootstrap
   */
  failBootstrap(reason) {
    this.bootstrapState = 'FAILED';
    this.bootstrapMetadata.failureReason = reason;
    this.bootstrapMetadata.failedAt = new Date().toISOString();

    this.metrics.failedBootstraps++;
    this.phaseHistory.push({
      bootstrapId: this.bootstrapMetadata.bootstrapId,
      status: 'FAILED',
      reason,
      timestamp: this.bootstrapMetadata.startedAt
    });

    return {
      success: false,
      bootstrapId: this.bootstrapMetadata.bootstrapId,
      reason,
      failedAt: this.bootstrapMetadata.failedAt
    };
  }

  /**
   * Get bootstrap status
   */
  getBootstrapStatus() {
    const phases = [];

    for (const [name, phase] of this.phases) {
      phases.push({
        phaseName: name,
        status: phase.status,
        completed: phase.completed,
        duration_ms: phase.duration_ms,
        errors: phase.errors.length
      });
    }

    return {
      timestamp: new Date().toISOString(),
      bootstrapState: this.bootstrapState,
      bootstrapId: this.bootstrapMetadata.bootstrapId,
      currentPhase: this.currentPhase,
      phases,
      totalElapsedTime_ms: this.bootstrapMetadata.startTime
        ? Date.now() - this.bootstrapMetadata.startTime
        : 0
    };
  }

  /**
   * Get phase status
   */
  getPhaseStatus(phaseName) {
    const phase = this.phases.get(phaseName);

    if (!phase) {
      return null;
    }

    return {
      phaseName,
      status: phase.status,
      name: this.phaseDefinitions[phaseName].name,
      description: this.phaseDefinitions[phaseName].description,
      completed: phase.completed,
      duration_ms: phase.duration_ms,
      errors: phase.errors,
      critical: this.phaseDefinitions[phaseName].critical,
      dependencies: this.phaseDefinitions[phaseName].dependencies
    };
  }

  /**
   * Get all phases
   */
  getAllPhases() {
    const phases = [];

    for (const [name, phaseDef] of Object.entries(this.phaseDefinitions)) {
      const phase = this.phases.get(name);
      phases.push({
        phaseName: name,
        phaseNumber: phaseDef.phase,
        name: phaseDef.name,
        description: phaseDef.description,
        status: phase.status,
        completed: phase.completed,
        duration_ms: phase.duration_ms,
        critical: phaseDef.critical,
        dependencies: phaseDef.dependencies
      });
    }

    return phases.sort((a, b) => a.phaseNumber - b.phaseNumber);
  }

  /**
   * Get bootstrap metrics
   */
  getBootstrapMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics
    };
  }

  /**
   * Generate bootstrap report
   */
  generateBootstrapReport() {
    return {
      timestamp: new Date().toISOString(),
      bootstrapStatus: this.getBootstrapStatus(),
      phases: this.getAllPhases(),
      metrics: this.getBootstrapMetrics(),
      history: this.phaseHistory.slice(-10)
    };
  }

  /**
   * Can bootstrap proceed
   */
  canBootstrapProceed() {
    return this.bootstrapState === 'RUNNING' || this.bootstrapState === 'NOT_STARTED';
  }

  /**
   * Reset controller
   */
  reset() {
    this.bootstrapState = 'NOT_STARTED';
    this.currentPhase = null;
    this.bootstrapMetadata = {};
    this._initializePhases();

    return { reset: true };
  }
}

module.exports = BootstrapStateController;
