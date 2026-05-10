/**
 * PHASE 10.0 — EntropyMeasurementEngine
 * Measure structural entropy and information content
 * Pure observation, no interaction
 */

const ENTROPY_TRENDS = {
  STABLE: 'STABLE',
  GROWING: 'GROWING',
  COLLAPSING: 'COLLAPSING'
};

class EntropyMeasurementEngine {
  constructor(observer, options = {}) {
    this.observer = observer;

    this.entropyHistory = [];
    this.entropyWindow = options.entropyWindow || 100;

    this.metrics = {
      entropyMeasurements: 0,
      degradationDetections: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Compute Shannon entropy
  computeShannon() {
    const observations = this.observer.getObservationHistory(100);

    if (observations.length === 0) {
      return { computable: false };
    }

    // Extract values
    const values = observations.map((o) => o.properties?.value || 0);

    // Compute frequency distribution
    const distribution = this._computeDistribution(values);

    // Shannon entropy: H = -Σ(p_i * log2(p_i))
    let entropy = 0;

    for (const freq of Object.values(distribution)) {
      const p = freq / values.length;

      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    this._recordEntropy(entropy);

    return {
      computable: true,
      shannon: entropy,
      distribution,
      bitsPerValue: entropy
    };
  }

  // Compute structural entropy
  computeStructuralEntropy() {
    const observations = this.observer.getObservationHistory(50);

    if (observations.length < 2) {
      return { computable: false };
    }

    // Measure complexity of transitions between states
    const transitions = [];

    for (let i = 1; i < observations.length; i++) {
      const prev = observations[i - 1];
      const current = observations[i];

      const change = Math.abs(
        (current.properties?.value || 0) - (prev.properties?.value || 0)
      );

      transitions.push(change);
    }

    // Entropy of transitions
    const distribution = this._computeDistribution(transitions.map((t) => Math.round(t * 100)));

    let entropy = 0;

    for (const freq of Object.values(distribution)) {
      const p = freq / transitions.length;

      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return {
      computable: true,
      structuralEntropy: entropy,
      transitionCount: transitions.length,
      complexity: entropy
    };
  }

  // Compute time-series entropy
  computeTimeSeriesEntropy() {
    const observations = this.observer.getObservationHistory(200);

    if (observations.length < 10) {
      return { computable: false };
    }

    // Embed time series
    const embedDimension = 5;
    const embeddings = [];

    for (let i = 0; i <= observations.length - embedDimension; i++) {
      const embedding = observations
        .slice(i, i + embedDimension)
        .map((o) => o.properties?.value || 0);

      embeddings.push(JSON.stringify(embedding));
    }

    // Count occurrences
    const distribution = this._computeDistribution(embeddings);

    let entropy = 0;

    for (const freq of Object.values(distribution)) {
      const p = freq / embeddings.length;

      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return {
      computable: true,
      timeSeriesEntropy: entropy,
      embedDimension,
      uniquePatterns: Object.keys(distribution).length
    };
  }

  // Track entropy growth
  trackEntropyGrowth() {
    const current = this.computeShannon();

    if (!current.computable) {
      return { trackable: false };
    }

    this.entropyHistory.push({
      timestamp: new Date().toISOString(),
      entropy: current.shannon
    });

    // Keep rolling window
    if (this.entropyHistory.length > 1000) {
      this.entropyHistory.shift();
    }

    this.metrics.entropyMeasurements++;

    // Compute rate
    if (this.entropyHistory.length < 2) {
      return { trackable: true, rate: 0 };
    }

    const recent = this.entropyHistory.slice(-10);
    const oldEntropy = recent[0].entropy;
    const newEntropy = recent[recent.length - 1].entropy;
    const rate = (newEntropy - oldEntropy) / recent.length;

    return {
      trackable: true,
      currentEntropy: current.shannon,
      rate,
      direction: rate > 0 ? 'INCREASING' : 'DECREASING'
    };
  }

  // Detect order→chaos transition
  detectOrderChaosTransition() {
    if (this.entropyHistory.length < 2) {
      return { detected: false };
    }

    const recent = this.entropyHistory.slice(-20);

    // Check for sudden entropy spike
    const max = Math.max(...recent.map((e) => e.entropy));
    const min = Math.min(...recent.map((e) => e.entropy));
    const range = max - min;
    const latest = recent[recent.length - 1].entropy;

    const percentageChange = (latest - recent[0].entropy) / recent[0].entropy;

    const transition = {
      detected: percentageChange > 0.2,  // >20% increase
      percentageChange,
      magnitude: latest - recent[0].entropy
    };

    if (transition.detected) {
      this.metrics.degradationDetections++;
    }

    return transition;
  }

  // Measure degradation
  measureDegradation() {
    const transition = this.detectOrderChaosTransition();
    const growth = this.trackEntropyGrowth();

    return {
      degrading: transition.detected || (growth.trackable && growth.rate > 0.01),
      entropyGrowth: growth.rate,
      transitionDetected: transition.detected,
      degradationSeverity: transition.percentageChange * 100  // Percentage
    };
  }

  // Predict collapse risk
  predictCollapseRisk() {
    const degradation = this.measureDegradation();
    const growth = this.trackEntropyGrowth();

    if (!growth.trackable) {
      return { predictable: false };
    }

    // Estimate time to max entropy
    const maxEntropy = Math.log2(100);  // Assuming max of 100 possible states
    const currentEntropy = growth.currentEntropy;

    if (growth.rate <= 0 || currentEntropy >= maxEntropy) {
      return {
        predictable: true,
        collapseRisk: 0.0,
        timeToCollapse: 'N/A'
      };
    }

    const timeToCollapse = (maxEntropy - currentEntropy) / growth.rate;

    return {
      predictable: true,
      collapseRisk: Math.min(1.0, degradation.degradationSeverity / 100),
      timeToCollapse,
      estimatedCollapseTime: new Date(
        Date.now() + timeToCollapse * 1000
      ).toISOString()
    };
  }

  // Get entropy metrics
  getEntropyMetrics() {
    const shannon = this.computeShannon();
    const structural = this.computeStructuralEntropy();
    const timeSeries = this.computeTimeSeriesEntropy();
    const growth = this.trackEntropyGrowth();
    const degradation = this.measureDegradation();
    const collapseRisk = this.predictCollapseRisk();

    return Object.freeze({
      shannon: shannon.computable ? shannon.shannon : null,
      structural: structural.computable ? structural.structuralEntropy : null,
      timeSeries: timeSeries.computable ? timeSeries.timeSeriesEntropy : null,
      growth: growth.rate,
      trend: growth.direction,
      degrading: degradation.degrading,
      collapseRisk: collapseRisk.predictable ? collapseRisk.collapseRisk : null,
      metrics: {
        measurements: this.metrics.entropyMeasurements,
        degradations: this.metrics.degradationDetections,
        createdAt: this.metrics.createdAt
      },
      isAuthoritative: false
    });
  }

  // Helper: Compute value distribution
  _computeDistribution(values) {
    const distribution = {};

    for (const value of values) {
      const key = String(value);

      distribution[key] = (distribution[key] || 0) + 1;
    }

    return distribution;
  }

  // Helper: Record entropy measurement
  _recordEntropy(entropy) {
    // For tracking over time
    this.entropyHistory.push({
      timestamp: new Date().toISOString(),
      entropy
    });

    if (this.entropyHistory.length > 1000) {
      this.entropyHistory.shift();
    }
  }
}

// Freeze class
Object.freeze(EntropyMeasurementEngine);
Object.freeze(EntropyMeasurementEngine.prototype);

module.exports = {
  EntropyMeasurementEngine,
  ENTROPY_TRENDS
};
