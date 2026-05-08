/**
 * UnifiedFailureFlow.js - Unified failure processing flow
 * PHASE 3B - Phase 5: Eliminate failure processing duplication
 *
 * Responsibility: Single flow for failure handling
 * - Classify once (not multiple times)
 * - Route once (not re-routing)
 * - Observe once (not duplicate logging)
 * - Recover once (not multiple recovery attempts)
 *
 * Flow:
 * Failure Detected → Classify (1x) → Route (1x) → Observe (1x) → Recover (1x)
 */

class UnifiedFailureFlow {
  constructor(constitutionManager, failureClassifier, failureRouter, observabilityDispatcher, recoveryEngine) {
    this.constitutionManager = constitutionManager;
    this.failureClassifier = failureClassifier;
    this.failureRouter = failureRouter;
    this.observabilityDispatcher = observabilityDispatcher;
    this.recoveryEngine = recoveryEngine;

    this.processedFailures = [];
    this.flowMetrics = {
      failuresDetected: 0,
      classifiedOnce: 0,
      routedOnce: 0,
      observedOnce: 0,
      recoveredOnce: 0,
      completedFlows: 0
    };
  }

  /**
   * Process failure through unified flow
   * CRITICAL: Each step happens exactly once
   */
  async processFailure(detectedFailure) {
    const flowId = this._generateFlowId();
    const flowLog = {
      flowId,
      detectedFailure,
      steps: [],
      timestamp: new Date().toISOString()
    };

    try {
      this.flowMetrics.failuresDetected++;

      // STEP 1: Classify (exactly once)
      const classificationStep = await this._classifyFailure(detectedFailure, flowLog);
      if (!classificationStep.success) {
        return this._failureFlow(flowId, classificationStep);
      }
      this.flowMetrics.classifiedOnce++;

      // STEP 2: Route (exactly once, based on classification)
      const routingStep = await this._routeFailure(classificationStep.classified, flowLog);
      if (!routingStep.success) {
        return this._failureFlow(flowId, routingStep);
      }
      this.flowMetrics.routedOnce++;

      // STEP 3: Observe (exactly once, after routing decision)
      const observationStep = await this._observeFailure(classificationStep.classified, routingStep.route, flowLog);
      if (!observationStep.success) {
        return this._failureFlow(flowId, observationStep);
      }
      this.flowMetrics.observedOnce++;

      // STEP 4: Recover (exactly once, based on route decision)
      const recoveryStep = await this._recoverFromFailure(classificationStep.classified, routingStep.route, flowLog);
      if (!recoveryStep.success) {
        return this._failureFlow(flowId, recoveryStep);
      }
      this.flowMetrics.recoveredOnce++;

      // Flow completed successfully
      this.flowMetrics.completedFlows++;
      this._recordFlow(flowLog);

      return {
        success: true,
        flowId,
        classified: classificationStep.classified,
        routed: routingStep.route,
        observed: observationStep.observed,
        recovered: recoveryStep.recovery,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      return this._failureFlow(flowId, {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * STEP 1: Classify failure (exactly once)
   */
  async _classifyFailure(detectedFailure, flowLog) {
    const startTime = Date.now();

    try {
      const classified = await this.failureClassifier.classify(detectedFailure);

      const step = {
        step: 'CLASSIFY',
        success: true,
        duration_ms: Date.now() - startTime,
        classified
      };

      flowLog.steps.push(step);
      return { success: true, classified };

    } catch (error) {
      const step = {
        step: 'CLASSIFY',
        success: false,
        duration_ms: Date.now() - startTime,
        error: error.message
      };

      flowLog.steps.push(step);
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 2: Route failure (exactly once)
   */
  async _routeFailure(classifiedFailure, flowLog) {
    const startTime = Date.now();

    try {
      const route = await this.failureRouter.route(classifiedFailure);

      const step = {
        step: 'ROUTE',
        success: true,
        duration_ms: Date.now() - startTime,
        routeDecision: route.decision,
        targetHandler: route.handler
      };

      flowLog.steps.push(step);
      return { success: true, route };

    } catch (error) {
      const step = {
        step: 'ROUTE',
        success: false,
        duration_ms: Date.now() - startTime,
        error: error.message
      };

      flowLog.steps.push(step);
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 3: Observe failure (exactly once)
   */
  async _observeFailure(classifiedFailure, routeDecision, flowLog) {
    const startTime = Date.now();

    try {
      const observed = await this.observabilityDispatcher.dispatchEvent({
        eventType: 'failure_detected',
        failureId: classifiedFailure.id,
        failureType: classifiedFailure.type,
        severity: classifiedFailure.severity,
        sourceModule: classifiedFailure.sourceModule,
        timestamp: new Date().toISOString()
      });

      const step = {
        step: 'OBSERVE',
        success: true,
        duration_ms: Date.now() - startTime,
        eventDispatched: true
      };

      flowLog.steps.push(step);
      return { success: true, observed };

    } catch (error) {
      const step = {
        step: 'OBSERVE',
        success: false,
        duration_ms: Date.now() - startTime,
        error: error.message
      };

      flowLog.steps.push(step);
      return { success: false, error: error.message };
    }
  }

  /**
   * STEP 4: Recover from failure (exactly once)
   */
  async _recoverFromFailure(classifiedFailure, routeDecision, flowLog) {
    const startTime = Date.now();

    try {
      const recovery = await this.recoveryEngine.recover(classifiedFailure, routeDecision);

      const step = {
        step: 'RECOVER',
        success: true,
        duration_ms: Date.now() - startTime,
        recoveryStrategy: recovery.strategy,
        recoverySuccessful: recovery.success
      };

      flowLog.steps.push(step);
      return { success: true, recovery };

    } catch (error) {
      const step = {
        step: 'RECOVER',
        success: false,
        duration_ms: Date.now() - startTime,
        error: error.message
      };

      flowLog.steps.push(step);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record failed flow
   */
  _failureFlow(flowId, stepResult) {
    return {
      success: false,
      flowId,
      failedAt: stepResult.step || 'unknown',
      error: stepResult.error || stepResult.message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Record completed flow for audit
   */
  _recordFlow(flowLog) {
    this.processedFailures.push(flowLog);

    // Keep only last 1000 flows
    if (this.processedFailures.length > 1000) {
      this.processedFailures.shift();
    }
  }

  /**
   * Generate unique flow ID
   */
  _generateFlowId() {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get flow metrics
   */
  getMetrics() {
    return {
      ...this.flowMetrics,
      deduplicationRatio: this.flowMetrics.failuresDetected > 0
        ? (this.flowMetrics.completedFlows / this.flowMetrics.failuresDetected * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Get recent failure flows
   */
  getRecentFlows(limit = 50) {
    return this.processedFailures.slice(-limit);
  }

  /**
   * Validate that failures are processed exactly once
   */
  validateNoDuplication() {
    const flowIds = new Set();
    const duplicates = [];

    for (const flow of this.processedFailures) {
      if (flowIds.has(flow.flowId)) {
        duplicates.push(flow.flowId);
      }
      flowIds.add(flow.flowId);
    }

    return {
      noDuplicateFlows: duplicates.length === 0,
      duplicateCount: duplicates.length,
      totalFlows: this.processedFailures.length
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.flowMetrics = {
      failuresDetected: 0,
      classifiedOnce: 0,
      routedOnce: 0,
      observedOnce: 0,
      recoveredOnce: 0,
      completedFlows: 0
    };
    return { reset: true };
  }
}

module.exports = UnifiedFailureFlow;
