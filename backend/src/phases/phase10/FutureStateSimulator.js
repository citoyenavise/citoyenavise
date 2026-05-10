/**
 * PHASE 10.3 — FutureStateSimulator
 * Trajectory Simulation Without Reality Modification
 * ~360 LOC
 */

'use strict';

const SeededPRNG = require('./DeterministicSeedManager');

class FutureStateSimulator {
  constructor(initialState = {}, dynamicsModel = null, options = {}) {
    this.initialState = Object.freeze({ ...initialState });
    this.dynamicsModel = dynamicsModel;

    this.maxSteps = options.maxSteps || 100;
    this.stateSpace = options.stateSpace || { min: 0, max: 1 };
    this.noiseLevel = options.noiseLevel || 0.1;
    this.deterministicSeed = options.deterministicSeed || 42;

    this._rng = new SeededPRNG(this.deterministicSeed);
    this._baseTime = options.baseTime || 0;

    this.simulationMetrics = {
      simulationsRun: 0,
      branchesGenerated: 0,
      samplesDrawn: 0,
      createdAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // Main API: simulateStateEvolution
  // ============================================================================

  simulateStateEvolution(steps) {
    const startTime = Date.now();

    try {
      if (!steps || steps < 1) {
        return Object.freeze({
          steps: steps,
          trajectory: [],
          finalState: this.initialState,
          stateDistribution: [],
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const trajectory = [this.initialState];
      let currentState = { ...this.initialState };

      for (let i = 0; i < steps; i++) {
        currentState = this._evolveState(currentState, i);
        trajectory.push(Object.freeze({ ...currentState }));
      }

      this.simulationMetrics.simulationsRun++;

      return Object.freeze({
        steps: steps,
        trajectory: Object.freeze([...trajectory]),
        finalState: currentState,
        stateDistribution: this._computeDistribution(trajectory),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        steps: steps,
        trajectory: [],
        finalState: this.initialState,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: runCounterfactualScenario
  // ============================================================================

  runCounterfactualScenario(intervention = null) {
    const startTime = Date.now();

    try {
      if (!intervention) {
        return Object.freeze({
          baseline: this._runSimulation(this.maxSteps, null),
          counterfactual: this._runSimulation(this.maxSteps, null),
          divergence: 0.0,
          effect: 'NONE',
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // Run baseline (no intervention)
      const baseline = this._runSimulation(this.maxSteps, null);

      // Run with intervention
      const counterfactual = this._runSimulation(this.maxSteps, intervention);

      // Measure divergence
      const divergence = this._computeDivergence(baseline, counterfactual);
      const effect = divergence > 0.3 ? 'SIGNIFICANT' : divergence > 0.1 ? 'MODERATE' : 'MINIMAL';

      this.simulationMetrics.simulationsRun += 2;

      return Object.freeze({
        baseline: baseline,
        counterfactual: counterfactual,
        divergence: Math.min(divergence, 1.0),
        effect: effect,
        interventionApplied: intervention,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        baseline: null,
        counterfactual: null,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: generateMultipleBranches
  // ============================================================================

  generateMultipleBranches(branchCount = 10) {
    const startTime = Date.now();

    try {
      if (!branchCount || branchCount < 1) {
        return Object.freeze({
          branchCount: 0,
          branches: [],
          divergenceMatrix: [],
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const branches = [];
      for (let i = 0; i < branchCount; i++) {
        branches.push(this._runSimulation(this.maxSteps, { noise: this._rng.nextFloat() * 0.5 }));
      }

      // Compute pairwise divergences
      const divergenceMatrix = this._computeDivergenceMatrix(branches);

      this.simulationMetrics.branchesGenerated += branchCount;

      return Object.freeze({
        branchCount: branchCount,
        branches: Object.freeze([...branches]),
        divergenceMatrix: Object.freeze([...divergenceMatrix]),
        averageDivergence: this._computeAverageDivergence(divergenceMatrix),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        branchCount: 0,
        branches: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeStateDistribution
  // ============================================================================

  computeStateDistribution(horizon) {
    const startTime = Date.now();

    try {
      if (!horizon || horizon < 1) {
        return Object.freeze({
          horizon: horizon,
          distribution: {},
          quantiles: {},
          mean: 0.5,
          std: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const samples = [];
      for (let i = 0; i < 100; i++) {
        const traj = this._runSimulation(horizon, null);
        if (traj && traj.finalState) {
          samples.push(traj.finalState.value || 0.5);
        }
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / samples.length;
      const std = Math.sqrt(variance);

      // Compute quantiles
      const sorted = [...samples].sort((a, b) => a - b);
      const quantiles = {
        '0.05': sorted[Math.floor(sorted.length * 0.05)],
        '0.25': sorted[Math.floor(sorted.length * 0.25)],
        '0.50': sorted[Math.floor(sorted.length * 0.50)],
        '0.75': sorted[Math.floor(sorted.length * 0.75)],
        '0.95': sorted[Math.floor(sorted.length * 0.95)]
      };

      this.simulationMetrics.samplesDrawn += samples.length;

      return Object.freeze({
        horizon: horizon,
        distribution: this._buildHistogram(samples),
        quantiles: quantiles,
        mean: mean,
        std: std,
        min: Math.min(...samples),
        max: Math.max(...samples),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        horizon: horizon,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: sampleTrajectory
  // ============================================================================

  sampleTrajectory(count = 10) {
    try {
      if (!count || count < 1) {
        return Object.freeze({
          trajectories: [],
          count: 0,
          isAuthoritative: false
        });
      }

      const trajectories = [];
      for (let i = 0; i < count; i++) {
        trajectories.push(this._runSimulation(this.maxSteps, null));
      }

      this.simulationMetrics.samplesDrawn += count;

      return Object.freeze({
        trajectories: Object.freeze([...trajectories]),
        count: count,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        trajectories: [],
        count: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeQuantiles
  // ============================================================================

  computeQuantiles(quantiles = [0.05, 0.25, 0.50, 0.75, 0.95]) {
    try {
      if (!Array.isArray(quantiles) || quantiles.length === 0) {
        return Object.freeze({
          quantiles: {},
          isAuthoritative: false
        });
      }

      // Run samples
      const samples = [];
      for (let i = 0; i < 100; i++) {
        const traj = this._runSimulation(this.maxSteps, null);
        if (traj && traj.finalState) {
          samples.push(traj.finalState.value || 0.5);
        }
      }

      // Compute requested quantiles
      const sorted = [...samples].sort((a, b) => a - b);
      const result = {};

      for (const q of quantiles) {
        const index = Math.floor(sorted.length * q);
        result[q.toFixed(2)] = sorted[Math.min(index, sorted.length - 1)];
      }

      return Object.freeze({
        quantiles: result,
        sampleSize: samples.length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        quantiles: {},
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _evolveState(state, step) {
    const noise = this._rng.nextNormal() * this.noiseLevel * 2;
    const driftFactor = this.dynamicsModel ? (this.dynamicsModel.trend || 0) * 0.01 : 0;
    const newValue = Math.max(
      this.stateSpace.min,
      Math.min(this.stateSpace.max, (state.value || 0.5) + driftFactor + noise)
    );

    return Object.freeze({
      ...state,
      value: newValue,
      step: step + 1,
      timestamp: new Date(this._baseTime + step * 3600000)
    });
  }

  _runSimulation(steps, intervention = null) {
    const trajectory = [this.initialState];
    let currentState = { ...this.initialState };

    for (let i = 0; i < steps; i++) {
      if (intervention && i === Math.floor(steps / 2)) {
        currentState = { ...currentState, ...intervention };
      }
      currentState = this._evolveState(currentState, i);
      trajectory.push(Object.freeze({ ...currentState }));
    }

    return Object.freeze({
      trajectory: trajectory,
      finalState: currentState,
      steps: steps
    });
  }

  _computeDistribution(trajectory) {
    const values = trajectory.map(t => t.value || 0.5);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    };
  }

  _computeDivergence(traj1, traj2) {
    if (!traj1 || !traj2) return 0;
    const states1 = traj1.trajectory || [];
    const states2 = traj2.trajectory || [];
    const minLen = Math.min(states1.length, states2.length);

    let divergence = 0;
    for (let i = 0; i < minLen; i++) {
      const v1 = states1[i].value || 0;
      const v2 = states2[i].value || 0;
      divergence += Math.abs(v1 - v2);
    }
    return minLen > 0 ? divergence / minLen : 0;
  }

  _computeDivergenceMatrix(branches) {
    const matrix = [];
    for (let i = 0; i < branches.length; i++) {
      const row = [];
      for (let j = 0; j < branches.length; j++) {
        row.push(this._computeDivergence(branches[i], branches[j]));
      }
      matrix.push(row);
    }
    return matrix;
  }

  _computeAverageDivergence(matrix) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        sum += matrix[i][j];
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  _buildHistogram(samples, bins = 10) {
    const hist = {};
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const binSize = (max - min + 0.001) / bins;

    for (let i = 0; i < bins; i++) {
      hist[i] = 0;
    }

    for (const sample of samples) {
      const bin = Math.min(bins - 1, Math.floor((sample - min) / binSize));
      hist[bin]++;
    }

    return hist;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.simulationMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = FutureStateSimulator;
