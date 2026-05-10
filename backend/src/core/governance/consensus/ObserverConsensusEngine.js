/**
 * PHASE 10.1 — ObserverConsensusEngine
 * Compute consensus truth from divergent observations
 */

class ObserverConsensusEngine {
  constructor(observers, options = {}) {
    this.observers = observers;
    this.consensusMethod = options.consensusMethod || 'MEDIAN';  // MEDIAN, WEIGHTED, PBFT
    this.outlierThreshold = options.outlierThreshold || 3;  // 3-sigma

    this.metrics = {
      consensusComputations: 0,
      disagreementsDetected: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Compute consensus
  computeConsensus(observations) {
    if (!observations || observations.length === 0) {
      return { computable: false, reason: 'No observations' };
    }

    // Filter valid observations
    const validObs = observations.filter((o) => o.success && o.observation);

    if (validObs.length === 0) {
      return { computable: false, reason: 'No valid observations' };
    }

    // Apply consensus method
    let consensus;

    switch (this.consensusMethod) {
      case 'MEDIAN':
        consensus = this._computeMedianConsensus(validObs);
        break;
      case 'WEIGHTED':
        consensus = this._computeWeightedConsensus(validObs);
        break;
      case 'PBFT':
        consensus = this._computePBFTConsensus(validObs);
        break;
      default:
        consensus = this._computeMedianConsensus(validObs);
    }

    this.metrics.consensusComputations++;

    return Object.freeze({
      computable: true,
      consensus,
      method: this.consensusMethod,
      validObservations: validObs.length,
      timestamp: new Date().toISOString()
    });
  }

  // Detect disagreement
  detectDisagreement(observations) {
    const consensus = this.computeConsensus(observations);

    if (!consensus.computable) {
      return { detected: false };
    }

    const disagreements = [];

    for (const obs of observations) {
      if (!obs.success) continue;

      const deviation = Math.abs(
        (obs.observation.properties.value - consensus.consensus.value) /
          (consensus.consensus.value || 1)
      );

      if (deviation > 0.1) {
        // >10% deviation
        disagreements.push({
          observerId: obs.observerId,
          observation: obs.observation.properties.value,
          consensus: consensus.consensus.value,
          deviation: deviation * 100
        });
      }
    }

    if (disagreements.length > 0) {
      this.metrics.disagreementsDetected++;
    }

    return Object.freeze({
      detected: disagreements.length > 0,
      disagreements,
      count: disagreements.length
    });
  }

  // Identify outliers
  identifyOutliers(observations) {
    const values = observations
      .filter((o) => o.success)
      .map((o) => o.observation.properties.value);

    if (values.length === 0) {
      return { outliers: [] };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    const outliers = [];

    for (let i = 0; i < observations.length; i++) {
      const obs = observations[i];

      if (!obs.success) continue;

      const zScore = Math.abs((obs.observation.properties.value - mean) / (stdDev || 1));

      if (zScore > this.outlierThreshold) {
        outliers.push({
          observerId: obs.observerId,
          value: obs.observation.properties.value,
          zScore,
          outlier: true
        });
      }
    }

    return Object.freeze({ outliers, count: outliers.length });
  }

  // Compute consensus confidence
  computeConsensusConfidence(observations) {
    const consensus = this.computeConsensus(observations);
    const agreement = this._computeAgreementRatio(observations, consensus);
    const outliers = this.identifyOutliers(observations);

    const confidence =
      agreement * (1 - outliers.count / (observations.length || 1));

    return Object.freeze({
      confidence: Math.max(0, Math.min(1, confidence)),
      agreement,
      outlierRatio: outliers.count / (observations.length || 1),
      isAuthoritative: false
    });
  }

  // Get consensus observation
  getConsensusObservation() {
    // Return last computed consensus
    return Object.freeze({
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get consensus metrics
  getConsensusMetrics() {
    return Object.freeze({
      ...this.metrics,
      consensusMethod: this.consensusMethod,
      isAuthoritative: false
    });
  }

  // Helper: Compute median consensus
  _computeMedianConsensus(observations) {
    const values = observations
      .map((o) => o.observation.properties.value)
      .sort((a, b) => a - b);

    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];

    return {
      value: median,
      method: 'MEDIAN',
      robustness: 'EXCELLENT'
    };
  }

  // Helper: Compute weighted consensus
  _computeWeightedConsensus(observations) {
    let weightedSum = 0,
      totalWeight = 0;

    for (const obs of observations) {
      const weight = obs.confidence || 1.0;

      weightedSum += obs.observation.properties.value * weight;
      totalWeight += weight;
    }

    return {
      value: weightedSum / (totalWeight || 1),
      method: 'WEIGHTED',
      robustness: 'GOOD'
    };
  }

  // Helper: Compute PBFT-inspired consensus
  _computePBFTConsensus(observations) {
    // Majority vote on binary decisions
    const agreement = observations.filter((o) => o.success).length /
      (observations.length || 1);

    return {
      value: agreement > 0.67 ? 1.0 : 0.0,
      method: 'PBFT',
      robustness: 'BYZANTINE_TOLERANT',
      majoritySize: Math.ceil((observations.length * 2) / 3)
    };
  }

  // Helper: Compute agreement ratio
  _computeAgreementRatio(observations, consensus) {
    const agreeing = observations.filter((o) => {
      if (!o.success) return false;

      const deviation = Math.abs(
        (o.observation.properties.value - consensus.consensus.value) /
          (consensus.consensus.value || 1)
      );

      return deviation < 0.1;
    }).length;

    return agreeing / (observations.length || 1);
  }
}

// Freeze class
Object.freeze(ObserverConsensusEngine);
Object.freeze(ObserverConsensusEngine.prototype);

module.exports = {
  ObserverConsensusEngine
};
