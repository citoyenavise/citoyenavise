/**
 * InvariantCostAnalyzer
 * PHASE 8.5 — Compiled Invariant Execution Cost Analysis
 *
 * Analyzes bytecode execution costs for compiled invariants (8.2).
 *
 * CRITICAL:
 * ✔ deterministic cost modeling
 * ✔ per-invariant execution latency tracking
 * ✔ criticality-based execution prioritization
 * ✔ cost-aware scheduling
 */

class InvariantCostAnalyzer {
  constructor(options = {}) {
    // Invariant registry (dependency injection)
    this.invariantRegistry = options.invariantRegistry || null;

    // Invariant costs: invariantId → { bytecodeSize, estimatedCostMs, actualCosts[] }
    this.invariantCosts = new Map();

    // Criticality levels: invariantId → 'CRITICAL' | 'WARNING' | 'INFO'
    this.criticalityLevels = new Map();

    // Cost predictions based on bytecode analysis
    this.costPredictions = new Map(); // invariantId → { estimatedMs, confidence }

    // Execution history for cost tracking
    this.executionLog = [];
    this.maxLogSize = options.maxLogSize || 5000;

    // Metrics
    this.stats = {
      invariantsAnalyzed: 0,
      costEstimatesGenerated: 0,
      executionsTracked: 0,
      avgEstimationAccuracy: 100,
      lastAnalysis: null
    };
  }

  /**
   * Analyze invariant bytecode for cost
   */
  analyzeInvariant(invariantId) {
    if (!invariantId || !this.invariantRegistry) {
      return { analyzed: false, reason: 'INVALID_INPUT' };
    }

    try {
      const invariant = this.invariantRegistry.getInvariant(invariantId);
      if (!invariant.available) {
        return { analyzed: false, reason: 'INVARIANT_NOT_FOUND' };
      }

      // Analyze bytecode
      const bytecode = invariant.bytecode || [];
      const bytecodeSize = JSON.stringify(bytecode).length;

      // Estimate execution cost based on bytecode operations
      const estimatedCostMs = this._estimateCost(bytecode);

      // Get criticality from invariant level
      const criticality = invariant.level || 'INFO';
      this.criticalityLevels.set(invariantId, criticality);

      // Store analysis
      const analysis = Object.freeze({
        invariantId,
        bytecodeSize,
        operationCount: bytecode.length,
        estimatedCostMs,
        criticality,
        confidence: this._calculateConfidence(bytecode),
        analyzedAt: Date.now()
      });

      this.invariantCosts.set(invariantId, {
        ...analysis,
        actualCosts: []
      });

      this.costPredictions.set(invariantId, {
        estimatedMs: estimatedCostMs,
        confidence: analysis.confidence
      });

      this.stats.invariantsAnalyzed++;
      this.stats.costEstimatesGenerated++;
      this.stats.lastAnalysis = Date.now();

      return {
        analyzed: true,
        invariantId,
        estimatedCostMs,
        criticality,
        confidence: (analysis.confidence * 100).toFixed(1) + '%'
      };
    } catch (err) {
      return {
        analyzed: false,
        error: err.message
      };
    }
  }

  /**
   * Record actual execution cost
   */
  recordExecutionCost(invariantId, actualCostMs) {
    if (!invariantId || typeof actualCostMs !== 'number') {
      return { recorded: false, reason: 'INVALID_INPUT' };
    }

    try {
      const costData = this.invariantCosts.get(invariantId);
      if (!costData) {
        return { recorded: false, reason: 'INVARIANT_NOT_ANALYZED' };
      }

      // Add to actual costs
      costData.actualCosts.push(actualCostMs);

      // Keep only recent costs
      if (costData.actualCosts.length > 100) {
        costData.actualCosts.shift();
      }

      // Log execution
      this.executionLog.push({
        invariantId,
        actualCostMs,
        timestamp: Date.now(),
        sequence: this.executionLog.length
      });

      if (this.executionLog.length > this.maxLogSize) {
        this.executionLog.shift();
      }

      // Update estimation accuracy
      this._updateAccuracy();

      this.stats.executionsTracked++;

      return {
        recorded: true,
        invariantId,
        actualCostMs,
        avgActualCostMs: (
          costData.actualCosts.reduce((a, b) => a + b, 0) / costData.actualCosts.length
        ).toFixed(2)
      };
    } catch (err) {
      return {
        recorded: false,
        error: err.message
      };
    }
  }

  /**
   * Get cost-based execution plan (prioritized by criticality and cost)
   */
  generateExecutionPlan(invariantIds) {
    if (!Array.isArray(invariantIds)) {
      return { generated: false, reason: 'INVALID_INPUT' };
    }

    try {
      const plan = [];

      for (const invariantId of invariantIds) {
        const costData = this.invariantCosts.get(invariantId);
        if (!costData) {
          continue;
        }

        const criticality = this.criticalityLevels.get(invariantId) || 'INFO';
        const actualAvgCost =
          costData.actualCosts.length > 0
            ? costData.actualCosts.reduce((a, b) => a + b, 0) / costData.actualCosts.length
            : costData.estimatedCostMs;

        plan.push({
          invariantId,
          estimatedCostMs: costData.estimatedCostMs,
          actualAvgCostMs: actualAvgCost,
          criticality,
          priority: this._calculatePriority(criticality, actualAvgCost)
        });
      }

      // Sort by priority (CRITICAL first, then by cost)
      plan.sort((a, b) => {
        const criticalityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        const criticalityDiff =
          criticalityOrder[a.criticality] - criticalityOrder[b.criticality];
        if (criticalityDiff !== 0) return criticalityDiff;
        return a.actualAvgCostMs - b.actualAvgCostMs;
      });

      return {
        generated: true,
        planSize: plan.length,
        totalEstimatedMs: plan.reduce((sum, p) => sum + p.estimatedCostMs, 0),
        plan
      };
    } catch (err) {
      return {
        generated: false,
        error: err.message
      };
    }
  }

  /**
   * Get invariant cost information
   */
  getInvariantCost(invariantId) {
    const costData = this.invariantCosts.get(invariantId);
    if (!costData) {
      return { available: false, reason: 'INVARIANT_NOT_FOUND' };
    }

    return {
      available: true,
      invariantId,
      bytecodeSize: costData.bytecodeSize,
      estimatedCostMs: costData.estimatedCostMs,
      actualAvgCostMs:
        costData.actualCosts.length > 0
          ? (
              costData.actualCosts.reduce((a, b) => a + b, 0) / costData.actualCosts.length
            ).toFixed(2)
          : 'N/A',
      executionCount: costData.actualCosts.length,
      criticality: this.criticalityLevels.get(invariantId)
    };
  }

  /**
   * Internal: Estimate cost based on bytecode
   */
  _estimateCost(bytecode) {
    // Cost model: each operation costs ~1ms base + operation-specific cost
    let cost = 0;

    for (const op of bytecode) {
      switch (op.op) {
        case 'LOAD_CONTEXT':
          cost += 0.1;
          break;
        case 'EVALUATE_PREDICATE':
          cost += 0.5;
          break;
        case 'BRANCH_IF_FALSE':
          cost += 0.2;
          break;
        case 'RETURN':
          cost += 0.1;
          break;
        default:
          cost += 0.5;
      }
    }

    return Math.max(1, cost);
  }

  /**
   * Internal: Calculate confidence in cost estimate
   */
  _calculateConfidence(bytecode) {
    // More operations = more complex = lower confidence initially
    // Max confidence is 0.95
    const complexity = bytecode.length;
    const baseConfidence = 0.7;
    const reduction = Math.min(0.2, complexity * 0.01);
    return baseConfidence - reduction;
  }

  /**
   * Internal: Calculate execution priority
   */
  _calculatePriority(criticality, cost) {
    const criticalityScore = { CRITICAL: 100, WARNING: 50, INFO: 10 }[criticality] || 10;
    const costScore = Math.min(100, cost); // Normalize to 0-100
    return criticalityScore - costScore * 0.1; // Criticality dominates
  }

  /**
   * Internal: Update estimation accuracy
   */
  _updateAccuracy() {
    let totalError = 0;
    let count = 0;

    for (const [invariantId, costData] of this.invariantCosts) {
      if (costData.actualCosts.length === 0) continue;

      const actualAvg =
        costData.actualCosts.reduce((a, b) => a + b, 0) / costData.actualCosts.length;
      const estimated = costData.estimatedCostMs;

      const error = Math.abs(actualAvg - estimated) / estimated;
      totalError += error;
      count++;
    }

    if (count > 0) {
      const avgError = totalError / count;
      this.stats.avgEstimationAccuracy = Math.max(0, 100 - avgError * 100);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      invariantsAnalyzedCount: this.invariantCosts.size,
      executionLogSize: this.executionLog.length,
      avgEstimationAccuracy: this.stats.avgEstimationAccuracy.toFixed(1) + '%',
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.invariantCosts.clear();
    this.criticalityLevels.clear();
    this.costPredictions.clear();
    this.executionLog = [];
    this.stats = {
      invariantsAnalyzed: 0,
      costEstimatesGenerated: 0,
      executionsTracked: 0,
      avgEstimationAccuracy: 100,
      lastAnalysis: null
    };
  }
}

module.exports = InvariantCostAnalyzer;
