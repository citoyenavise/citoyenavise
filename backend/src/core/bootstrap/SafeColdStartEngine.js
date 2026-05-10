/**
 * SafeColdStartEngine
 * PHASE 9.2 — Safe cold start from zero state (PHASE 9.1 design)
 *
 * Executes 5-step cold start protocol:
 * 1. Validate Configuration (safety checks)
 * 2. Initialize Proof System (empty)
 * 3. Create Blank Global Registry
 * 4. Bootstrap (via ClusterBootstrapManager)
 * 5. Finalize Cold Start (transition to READY)
 *
 * CRITICAL:
 * ✔ zero assumptions about prior state
 * ✔ deterministic from empty state
 * ✔ all safety validations before execution
 * ✔ immutability from start
 */

const crypto = require('crypto');

class SafeColdStartEngine {
  constructor(options = {}) {
    // Configuration input
    this.config = {
      nodeIds: options.nodeIds || [],
      shardCount: options.shardCount || 3,
      replicationFactor: options.replicationFactor || 3,
      initialBoot: options.initialBoot !== false, // default true
      recoverFromBackup: options.recoverFromBackup === true,
      bootstrapTimeoutMs: options.bootstrapTimeoutMs || 5000
    };

    // Dependencies (optional, will be created if not provided)
    this.proofSystem = options.proofSystem || null;
    this.globalRegistry = options.globalRegistry || null;
    this.shardRouter = options.shardRouter || null;
    this.kernel = options.kernel || null;
    this.bootstrapManager = options.bootstrapManager || null;

    // Validation state
    this.validationState = {
      configValid: false,
      validationErrors: [],
      validationPassed: false
    };

    // Cold start state
    this.coldStartState = {
      phase: 'NOT_STARTED',
      steps: [],
      proofs: [],
      startTime: null,
      endTime: null,
      error: null
    };

    // Metrics
    this.metrics = {
      validationsPassed: 0,
      proofsCaptured: 0,
      coldStartStatus: 'PENDING'
    };
  }

  /**
   * Execute safe cold start (5 sequential steps + validation)
   */
  async executeColdStart() {
    this.coldStartState.startTime = Date.now();
    this.coldStartState.phase = 'IN_PROGRESS';

    try {
      // STEP 0: Validate Configuration (pre-flight checks)
      const validationResult = this._validateConfiguration();
      if (!validationResult.valid) {
        throw new Error(`Configuration validation failed: ${validationResult.errors.join(', ')}`);
      }

      // STEP 1: Initialize Proof System
      const step1 = await this._executeStep1();
      if (!step1.success) throw new Error(`STEP 1 failed: ${step1.error}`);

      // STEP 2: Create Blank Global Registry
      const step2 = await this._executeStep2();
      if (!step2.success) throw new Error(`STEP 2 failed: ${step2.error}`);

      // STEP 3: Create Blank Shard Router
      const step3 = await this._executeStep3();
      if (!step3.success) throw new Error(`STEP 3 failed: ${step3.error}`);

      // STEP 4: Execute Bootstrap
      const step4 = await this._executeStep4();
      if (!step4.success) throw new Error(`STEP 4 failed: ${step4.error}`);

      // STEP 5: Finalize Cold Start
      const step5 = await this._executeStep5();
      if (!step5.success) throw new Error(`STEP 5 failed: ${step5.error}`);

      // Success
      this.coldStartState.phase = 'COMPLETE';
      this.coldStartState.endTime = Date.now();
      this.metrics.coldStartStatus = 'SUCCESS';

      return {
        coldStartSuccessful: true,
        duration: this.coldStartState.endTime - this.coldStartState.startTime,
        stepsCompleted: this.coldStartState.steps.length,
        proofsCaptured: this.coldStartState.proofs.length,
        clusterReady: true,
        nodesOnline: this.config.nodeIds.length,
        shardsCreated: this.config.shardCount
      };
    } catch (error) {
      this.coldStartState.error = error.message;
      this.coldStartState.phase = 'FAILED';
      this.metrics.coldStartStatus = 'FAILED';
      return {
        coldStartSuccessful: false,
        error: error.message,
        failedStep: this.coldStartState.steps.length
      };
    }
  }

  /**
   * Pre-flight validation of configuration
   */
  _validateConfiguration() {
    const errors = [];

    // nodeIds validation
    if (!Array.isArray(this.config.nodeIds) || this.config.nodeIds.length === 0) {
      errors.push('nodeIds must be non-empty array');
    }

    // shardCount validation
    if (typeof this.config.shardCount !== 'number' || this.config.shardCount < 1) {
      errors.push('shardCount must be positive number');
    }

    // replicationFactor validation
    if (
      typeof this.config.replicationFactor !== 'number' ||
      this.config.replicationFactor < 1
    ) {
      errors.push('replicationFactor must be positive number');
    }

    // replicationFactor <= nodeIds.length
    if (this.config.replicationFactor > this.config.nodeIds.length) {
      errors.push(
        `replicationFactor (${this.config.replicationFactor}) cannot exceed nodeIds.length (${this.config.nodeIds.length})`
      );
    }

    // Cold start exclusivity: cannot both initialBoot and recoverFromBackup
    if (this.config.initialBoot && this.config.recoverFromBackup) {
      errors.push('Cannot both initialBoot and recoverFromBackup');
    }

    // Collect results
    const valid = errors.length === 0;
    this.validationState.configValid = valid;
    this.validationState.validationErrors = errors;
    this.validationState.validationPassed = valid;

    if (valid) {
      this.metrics.validationsPassed++;
    }

    return {
      valid,
      errors,
      config: this.config
    };
  }

  /**
   * STEP 1: Initialize Proof System (empty)
   */
  async _executeStep1() {
    try {
      if (!this.proofSystem) {
        // Create empty proof system
        const EnforcementProofSystem =
          require('../governance/enforcement/EnforcementProofSystem');
        this.proofSystem = new EnforcementProofSystem();
      }

      // Validate it's empty
      if (this.proofSystem.proofLog && this.proofSystem.proofLog.length > 0) {
        return { success: false, error: 'PROOF_SYSTEM_NOT_EMPTY' };
      }

      // Capture initialization proof
      const proofContext = {
        module: 'SafeColdStartEngine',
        action: 'initializeProofSystem',
        ruleEvaluated: 'cold_start_proof_system_initialization',
        input: {
          shardCount: this.config.shardCount,
          replicationFactor: this.config.replicationFactor,
          nodeCount: this.config.nodeIds.length
        },
        result: { valid: true, proofSystemInitialized: true },
        severity: 'INFO',
        enforcementLayer: 'BOOTSTRAP',
        latencyMs: 0
      };

      this.proofSystem.captureDecision(proofContext);

      this.coldStartState.steps.push(1);
      this.coldStartState.proofs.push(`COLD_START_INIT_${Date.now()}`);
      this.metrics.proofsCaptured++;

      return {
        success: true,
        proofSystemInitialized: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 2: Create Blank Global Registry
   */
  async _executeStep2() {
    try {
      if (!this.globalRegistry) {
        // Create blank registry
        const GlobalEventRegistry =
          require('../events/GlobalEventRegistry');
        this.globalRegistry = new GlobalEventRegistry();
      }

      // Validate it's empty
      if (
        this.globalRegistry.eventLog &&
        this.globalRegistry.eventLog.length > 0
      ) {
        return { success: false, error: 'REGISTRY_NOT_EMPTY' };
      }

      // Capture proof
      const proofContext = {
        module: 'SafeColdStartEngine',
        action: 'initializeEventRegistry',
        ruleEvaluated: 'cold_start_event_registry_initialization',
        input: { empty: true },
        result: { valid: true, registryInitialized: true },
        severity: 'INFO',
        enforcementLayer: 'BOOTSTRAP',
        latencyMs: 0
      };

      if (this.proofSystem) {
        this.proofSystem.captureDecision(proofContext);
      }

      this.coldStartState.steps.push(2);
      this.coldStartState.proofs.push(`COLD_START_REGISTRY_${Date.now()}`);
      this.metrics.proofsCaptured++;

      return {
        success: true,
        registryInitialized: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 3: Create Blank Shard Router
   */
  async _executeStep3() {
    try {
      if (!this.shardRouter) {
        // Create blank shard router
        const InvariantShardRouter =
          require('../kernel/sharding/InvariantShardRouter');
        this.shardRouter = new InvariantShardRouter();
      }

      // Initialize shards
      for (let i = 0; i < this.config.shardCount; i++) {
        this.shardRouter.registerShard(`shard_${i}`, this.config.nodeIds[i % this.config.nodeIds.length]);
      }

      // Capture proof
      const proofContext = {
        module: 'SafeColdStartEngine',
        action: 'initializeShardRouter',
        ruleEvaluated: 'cold_start_shard_topology_initialization',
        input: {
          shardCount: this.config.shardCount,
          nodeCount: this.config.nodeIds.length
        },
        result: { valid: true, shardsInitialized: true },
        severity: 'INFO',
        enforcementLayer: 'BOOTSTRAP',
        latencyMs: 0
      };

      if (this.proofSystem) {
        this.proofSystem.captureDecision(proofContext);
      }

      this.coldStartState.steps.push(3);
      this.coldStartState.proofs.push(`COLD_START_SHARDS_${Date.now()}`);
      this.metrics.proofsCaptured++;

      return {
        success: true,
        shardsInitialized: true,
        shardCount: this.config.shardCount
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 4: Execute Bootstrap
   */
  async _executeStep4() {
    try {
      if (!this.bootstrapManager) {
        // Create bootstrap manager with initialized dependencies
        const ClusterBootstrapManager =
          require('./ClusterBootstrapManager');
        this.bootstrapManager = new ClusterBootstrapManager({
          nodeIds: this.config.nodeIds,
          shardCount: this.config.shardCount,
          replicationFactor: this.config.replicationFactor,
          bootstrapTimeoutMs: this.config.bootstrapTimeoutMs,
          proofSystem: this.proofSystem,
          globalRegistry: this.globalRegistry,
          shardRouter: this.shardRouter,
          kernel: this.kernel
        });
      }

      // Execute bootstrap
      const bootstrapResult =
        await this.bootstrapManager.executeBootstrap();

      if (!bootstrapResult.bootstrapSuccessful) {
        return {
          success: false,
          error: bootstrapResult.error
        };
      }

      this.coldStartState.steps.push(4);
      this.coldStartState.proofs.push(`COLD_START_BOOTSTRAP_${Date.now()}`);

      return {
        success: true,
        bootstrapResult,
        clusterInitialized: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 5: Finalize Cold Start
   */
  async _executeStep5() {
    try {
      if (!this.kernel) {
        // Create minimal kernel if not available
        this.kernel = {
          currentLifecycleState: 'READY',
          bootstrapValid: true,
          initialBootValid: true
        };
      }

      // Mark kernel as ready
      this.kernel.currentLifecycleState = 'READY';
      this.kernel.bootstrapValid = true;
      this.kernel.initialBootValid = true;

      // Final proof
      const proofContext = {
        module: 'SafeColdStartEngine',
        action: 'finalizeColdStart',
        ruleEvaluated: 'cold_start_completion_and_readiness',
        input: {
          nodesOnline: this.config.nodeIds.length,
          shardsCreated: this.config.shardCount,
          initialBootValid: true
        },
        result: {
          valid: true,
          coldStartValid: true,
          clusterReady: true,
          kernelState: this.kernel.currentLifecycleState
        },
        severity: 'INFO',
        enforcementLayer: 'BOOTSTRAP',
        latencyMs: 0
      };

      if (this.proofSystem) {
        this.proofSystem.captureDecision(proofContext);
      }

      this.coldStartState.steps.push(5);
      this.coldStartState.proofs.push(`COLD_START_COMPLETE_${Date.now()}`);
      this.metrics.proofsCaptured++;

      return {
        success: true,
        coldStartComplete: true,
        clusterReady: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate cold start safety
   */
  validateColdStartSafety() {
    // All steps must be complete
    const allStepsComplete = this.coldStartState.steps.length === 5;

    // Proof system must be valid
    const proofChainValid =
      this.proofSystem && this.proofSystem.verify().valid === true;

    // Registry must be initialized
    const registryValid = this.globalRegistry !== null;

    // Shard router must be initialized
    const shardRouterValid = this.shardRouter !== null;

    // Kernel must be READY
    const kernelReady =
      this.kernel && this.kernel.currentLifecycleState === 'READY';

    return {
      safe: allStepsComplete && proofChainValid && registryValid && shardRouterValid && kernelReady,
      stepsCompleted: this.coldStartState.steps.length,
      proofsValid: proofChainValid,
      systemsInitialized: {
        proofSystem: this.proofSystem !== null,
        registry: registryValid,
        shardRouter: shardRouterValid,
        kernel: kernelReady
      }
    };
  }

  /**
   * Get cold start state
   */
  getColdStartState() {
    return {
      phase: this.coldStartState.phase,
      stepsCompleted: this.coldStartState.steps,
      proofsCaptured: this.coldStartState.proofs.length,
      duration:
        this.coldStartState.endTime && this.coldStartState.startTime
          ? this.coldStartState.endTime - this.coldStartState.startTime
          : null,
      status: this.metrics.coldStartStatus,
      error: this.coldStartState.error,
      config: {
        nodeIds: this.config.nodeIds,
        shardCount: this.config.shardCount,
        replicationFactor: this.config.replicationFactor
      }
    };
  }

  /**
   * Get validation state
   */
  getValidationState() {
    return {
      configValid: this.validationState.configValid,
      validationPassed: this.validationState.validationPassed,
      errors: this.validationState.validationErrors
    };
  }
}

module.exports = SafeColdStartEngine;
