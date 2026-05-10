/**
 * PHASE 10.3 — PredictiveEvolutionEngine
 * Future State Extrapolation & Trajectory Projection
 * ~380 LOC
 */

'use strict';

const SeededPRNG = require('./DeterministicSeedManager');

class PredictiveEvolutionEngine {
  constructor(observations = [], causalModel = null, options = {}) {
    this.observations = Object.freeze([...observations]);
    this.causalModel = causalModel;

    this.horizon = options.horizon || 86400000; // 24 hours default
    this.scenarioCount = options.scenarioCount || 100;
    this.confidenceLevel = options.confidenceLevel || 0.95;
    this.deterministicSeed = options.deterministicSeed || 42;

    this._rng = new SeededPRNG(this.deterministicSeed);
    this._baseTime = options.baseTime || 0;
    this._idCounter = 0;

    this.predictionMetrics = {
      projectionsComputed: 0,
      scenariosGenerated: 0,
      dynamicsExtracted: 0,
      createdAt: new Date().toISOString()
    };

    this.predictions = [];
  }

  // ============================================================================
  // Main API: projectSystemEvolution
  // ============================================================================

  projectSystemEvolution(horizon = null) {
    const actualHorizon = horizon || this.horizon;
    const startTime = Date.now();

    try {
      if (!Array.isArray(this.observations) || this.observations.length === 0) {
        return Object.freeze({
          horizon: actualHorizon,
          trajectories: [],
          projectionCount: 0,
          aggregateUncertainty: 1.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // 1. Extract temporal dynamics from observations
      const dynamics = this._extractTemporalDynamics(this.observations);

      // 2. Generate evolution scenarios
      const trajectories = this._generateTrajectories(
        actualHorizon,
        dynamics,
        this.scenarioCount
      );

      // 3. Compute trajectory probabilities
      const probabilities = this._computeTrajectoryProbabilities(trajectories);

      // 4. Combine results
      const result = {
        horizon: actualHorizon,
        trajectories: trajectories.map((t, idx) => ({
          ...t,
          probability: probabilities[idx] || 0.0,
          evolutionPath: t.states.map(s => s.value),
          uncertaintyBound: this._computeUncertaintyBound(t)
        })),
        projectionCount: trajectories.length,
        aggregateUncertainty: this._computeAggregateUncertainty(probabilities),
        confidenceLevel: this.confidenceLevel,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      };

      this.predictionMetrics.projectionsComputed++;
      return Object.freeze(result);

    } catch (err) {
      return Object.freeze({
        horizon: actualHorizon,
        trajectories: [],
        projectionCount: 0,
        aggregateUncertainty: 1.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: extractEvolutionDynamics
  // ============================================================================

  extractEvolutionDynamics() {
    const startTime = Date.now();

    try {
      const dynamics = this._extractTemporalDynamics(this.observations);

      this.predictionMetrics.dynamicsExtracted++;

      return Object.freeze({
        trend: dynamics.trend,
        volatility: dynamics.volatility,
        pattern: dynamics.pattern,
        momentum: dynamics.momentum,
        periodicity: dynamics.periodicity,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        trend: 0.0,
        volatility: 0.0,
        pattern: 'UNKNOWN',
        momentum: 0.0,
        periodicity: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: generateEvolutionScenarios
  // ============================================================================

  generateEvolutionScenarios(count = null) {
    const scenarioCount = count || this.scenarioCount;
    const startTime = Date.now();

    try {
      const dynamics = this._extractTemporalDynamics(this.observations);
      const scenarios = [];

      for (let i = 0; i < scenarioCount; i++) {
        const scenario = {
          id: `scenario_${i}`,
          trajectory: this._generateSingleTrajectory(dynamics),
          variance: this._rng.nextFloat() * 0.5,
          likelihood: 0.0,
          description: this._describeScenario(dynamics, i)
        };
        scenarios.push(scenario);
      }

      // Normalize likelihoods
      const total = scenarios.length;
      for (const scenario of scenarios) {
        scenario.likelihood = (1.0 / total) * (1.0 - scenario.variance * 0.1);
      }

      this.predictionMetrics.scenariosGenerated++;

      return Object.freeze({
        scenarios: Object.freeze([...scenarios]),
        count: scenarios.length,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        scenarios: [],
        count: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeTrajectoryProbabilities
  // ============================================================================

  computeTrajectoryProbabilities() {
    try {
      const dynamics = this._extractTemporalDynamics(this.observations);
      const trajectories = this._generateTrajectories(
        this.horizon,
        dynamics,
        this.scenarioCount
      );

      const probabilities = this._computeTrajectoryProbabilities(trajectories);

      return Object.freeze({
        trajectoryProbabilities: Object.freeze([...probabilities]),
        meanProbability: probabilities.reduce((a, b) => a + b, 0) / probabilities.length,
        maxProbability: Math.max(...probabilities),
        minProbability: Math.min(...probabilities),
        distribution: this._describeDistribution(probabilities),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        trajectoryProbabilities: [],
        meanProbability: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: forecastDriftRate
  // ============================================================================

  forecastDriftRate(futureHorizonMs = null) {
    try {
      const horizon = futureHorizonMs || this.horizon;
      const dynamics = this._extractTemporalDynamics(this.observations);

      // Extrapolate drift into future
      const currentDrift = dynamics.trend;
      const acceleration = (dynamics.momentum || 0) * 0.1;
      const futureDrift = currentDrift + (acceleration * (horizon / 3600000));

      return Object.freeze({
        currentDriftRate: currentDrift,
        projectedDriftRate: futureDrift,
        acceleration: acceleration,
        horizon: horizon,
        direction: futureDrift > 0 ? 'INCREASING' : 'DECREASING',
        stability: 1.0 - Math.abs(acceleration),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        currentDriftRate: 0.0,
        projectedDriftRate: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: predictAnomalyProbability
  // ============================================================================

  predictAnomalyProbability(futureHorizonMs = null) {
    try {
      const horizon = futureHorizonMs || this.horizon;
      const dynamics = this._extractTemporalDynamics(this.observations);

      // Estimate anomaly risk from volatility
      const baseAnomalyRate = 0.05; // 5% baseline
      const volatilityFactor = Math.min(dynamics.volatility * 2, 0.5);
      const projectedProbability = baseAnomalyRate + volatilityFactor;

      const expectedTimeToAnomaly = projectedProbability > 0 ?
        3600000 / projectedProbability : Infinity; // ms to next anomaly

      return Object.freeze({
        baseAnomalyProbability: baseAnomalyRate,
        futureAnomalyProbability: Math.min(projectedProbability, 1.0),
        volatilityContribution: volatilityFactor,
        expectedTimeToAnomaly: expectedTimeToAnomaly,
        horizon: horizon,
        riskLevel: projectedProbability > 0.3 ? 'HIGH' : projectedProbability > 0.1 ? 'MEDIUM' : 'LOW',
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        baseAnomalyProbability: 0.0,
        futureAnomalyProbability: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: estimateSystemCollapse
  // ============================================================================

  estimateSystemCollapse(timeHorizonMs = null) {
    try {
      const horizon = timeHorizonMs || this.horizon;
      const dynamics = this._extractTemporalDynamics(this.observations);

      // Collapse risk from volatility and drift
      const volatilityRisk = Math.min(dynamics.volatility * 0.2, 0.3);
      const driftRisk = dynamics.trend < -0.5 ? 0.4 : 0.0;
      const collapseBaseProbability = volatilityRisk + driftRisk;

      return Object.freeze({
        collapseProbability: Math.min(collapseBaseProbability, 1.0),
        volatilityContribution: volatilityRisk,
        driftContribution: driftRisk,
        timeToCollapse: collapseBaseProbability > 0 ? horizon / collapseBaseProbability : Infinity,
        riskLevel: collapseBaseProbability > 0.5 ? 'CRITICAL' : collapseBaseProbability > 0.2 ? 'HIGH' : 'LOW',
        horizon: horizon,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        collapseProbability: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _extractTemporalDynamics(observations) {
    if (!observations || observations.length < 2) {
      return { trend: 0, volatility: 0, pattern: 'INSUFFICIENT', momentum: 0, periodicity: 0 };
    }

    const values = observations.map(o => o.value || 0);
    const n = values.length;

    // Trend: linear regression slope
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }
    const trend = denominator > 0 ? numerator / denominator : 0;

    // Volatility: standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - yMean, 2), 0) / n;
    const volatility = Math.sqrt(Math.max(variance, 0));

    // Momentum: rate of change
    const momentum = n > 1 ? (values[n - 1] - values[0]) / (n - 1) : 0;

    return {
      trend: Math.max(-1, Math.min(1, trend / 10)),
      volatility: Math.max(0, Math.min(1, volatility / 10)),
      pattern: volatility > 0.5 ? 'CHAOTIC' : trend > 0.3 ? 'INCREASING' : trend < -0.3 ? 'DECREASING' : 'STABLE',
      momentum: Math.max(-1, Math.min(1, momentum / 10)),
      periodicity: Math.floor(n / 4)
    };
  }

  _generateTrajectories(horizon, dynamics, count) {
    const trajectories = [];
    for (let i = 0; i < count; i++) {
      trajectories.push(this._generateSingleTrajectory(dynamics, horizon));
    }
    return trajectories;
  }

  _generateSingleTrajectory(dynamics, horizon = null) {
    const h = horizon || this.horizon;
    const steps = Math.min(Math.floor(h / 3600000), 24);
    const states = [];

    let currentValue = 0.5; // Start at neutral
    for (let i = 0; i < steps; i++) {
      const noise = this._rng.nextNormal() * dynamics.volatility;
      currentValue = Math.max(0, Math.min(1, currentValue + dynamics.trend * 0.01 + noise));
      states.push({
        step: i,
        value: currentValue,
        timestamp: new Date(this._baseTime + Math.floor(i * (h / steps)))
      });
    }

    return {
      id: `traj_${String(this._idCounter++).padStart(8, '0')}`,
      states: states,
      finalValue: currentValue,
      variance: dynamics.volatility
    };
  }

  _computeTrajectoryProbabilities(trajectories) {
    if (!trajectories || trajectories.length === 0) return [];

    const probabilities = trajectories.map(t => {
      const variance = t.variance || 0.5;
      const finalDeviation = Math.abs(t.finalValue - 0.5);
      return Math.exp(-variance - finalDeviation * 0.5) / Math.E;
    });

    const sum = probabilities.reduce((a, b) => a + b, 0);
    return probabilities.map(p => sum > 0 ? p / sum : 1.0 / trajectories.length);
  }

  _computeUncertaintyBound(trajectory) {
    return trajectory.variance || 0.5;
  }

  _computeAggregateUncertainty(probabilities) {
    if (!probabilities || probabilities.length === 0) return 1.0;
    return 1.0 - (probabilities.reduce((a, b) => a + b, 0) / probabilities.length);
  }

  _describeScenario(dynamics, index) {
    const patterns = {
      'INCREASING': `Escalating scenario ${index}`,
      'DECREASING': `Declining scenario ${index}`,
      'STABLE': `Stable scenario ${index}`,
      'CHAOTIC': `Chaotic scenario ${index}`
    };
    return patterns[dynamics.pattern] || `Unknown scenario ${index}`;
  }

  _describeDistribution(probabilities) {
    const sorted = [...probabilities].sort((a, b) => b - a);
    return {
      max: sorted[0],
      min: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      concentration: (sorted[0] / (1.0 / sorted.length))
    };
  }

  // ============================================================================
  // Public API: getMetrics
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.predictionMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = PredictiveEvolutionEngine;
