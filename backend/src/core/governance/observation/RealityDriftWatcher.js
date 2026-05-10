/**
 * PHASE 10.0 — RealityDriftWatcher
 * Track behavioral divergence from baseline
 * Pure external observation, no interaction
 */

const DRIFT_CLASSIFICATIONS = {
  NORMAL: 'NORMAL',
  SLOW_DRIFT: 'SLOW_DRIFT',
  RAPID_CHANGE: 'RAPID_CHANGE',
  ANOMALY: 'ANOMALY'
};

class RealityDriftWatcher {
  constructor(observer, options = {}) {
    this.observer = observer;

    this.driftHistory = [];
    this.driftRateWindow = options.driftRateWindow || 60;  // 60 observations
    this.driftThreshold = options.driftThreshold || 0.1;

    this.metrics = {
      driftsDetected: 0,
      anomaliesDetected: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Track behavioral drift from baseline
  trackBehaviorDrift() {
    const comparison = this.observer.compareToBaseline();

    if (!comparison.comparable) {
      return { trackable: false };
    }

    const driftMagnitude = comparison.percentageDeviation;
    const timestamp = new Date().toISOString();

    const driftRecord = {
      timestamp,
      magnitude: driftMagnitude / 100,  // Convert percentage to decimal
      percentageDeviation: comparison.percentageDeviation,
      withinBounds: comparison.withinBounds
    };

    this.driftHistory.push(driftRecord);

    // Keep rolling window
    if (this.driftHistory.length > 1000) {
      this.driftHistory.shift();
    }

    return driftRecord;
  }

  // Compute drift rate (dBehavior/dt)
  computeDriftRate() {
    if (this.driftHistory.length < 2) {
      return { computable: false };
    }

    // Use recent observations
    const recent = this.driftHistory.slice(-this.driftRateWindow);

    // Simple linear regression
    const n = recent.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = recent[i].magnitude;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return {
      computable: true,
      rate: slope,
      direction: slope > 0 ? 'INCREASING' : slope < 0 ? 'DECREASING' : 'STABLE',
      magnitude: Math.abs(slope)
    };
  }

  // Compute drift acceleration (d²Behavior/dt²)
  computeDriftAcceleration() {
    const rate1 = this._getDriftRateAtWindow(
      this.driftHistory.length - 100,
      100
    );
    const rate2 = this._getDriftRateAtWindow(
      this.driftHistory.length - 50,
      100
    );

    if (!rate1 || !rate2) {
      return { computable: false };
    }

    const acceleration = rate2 - rate1;

    return {
      computable: true,
      acceleration,
      direction: acceleration > 0 ? 'ACCELERATING' : 'DECELERATING',
      magnitude: Math.abs(acceleration)
    };
  }

  // Detect anomalies
  detectAnomalies() {
    const anomalies = [];

    if (this.driftHistory.length < 10) {
      return { detected: false, anomalies: [] };
    }

    // Detect sudden jumps
    const recent = this.driftHistory.slice(-10);
    const mean = recent.reduce((a, b) => a + b.magnitude, 0) / recent.length;
    const variance =
      recent.reduce((sum, r) => sum + Math.pow(r.magnitude - mean, 2), 0) /
      recent.length;
    const stdDev = Math.sqrt(variance);

    for (let i = 1; i < recent.length; i++) {
      const delta = Math.abs(recent[i].magnitude - recent[i - 1].magnitude);
      const zScore = delta / (stdDev || 0.001);

      if (zScore > 3) {
        // 3 sigma
        anomalies.push({
          type: 'SUDDEN_JUMP',
          timestamp: recent[i].timestamp,
          magnitude: delta,
          zScore
        });
      }
    }

    this.metrics.anomaliesDetected += anomalies.length;

    return {
      detected: anomalies.length > 0,
      anomalies,
      count: anomalies.length
    };
  }

  // Classify drift
  classifyDrift() {
    const rate = this.computeDriftRate();
    const current = this.driftHistory[this.driftHistory.length - 1];

    if (!rate.computable || !current) {
      return { classification: DRIFT_CLASSIFICATIONS.NORMAL };
    }

    if (current.magnitude < 0.05 && rate.magnitude < 0.001) {
      return { classification: DRIFT_CLASSIFICATIONS.NORMAL };
    }

    if (current.magnitude < 0.2 && rate.magnitude < 0.01) {
      return { classification: DRIFT_CLASSIFICATIONS.SLOW_DRIFT };
    }

    if (current.magnitude < 0.5 && rate.magnitude < 0.05) {
      return { classification: DRIFT_CLASSIFICATIONS.RAPID_CHANGE };
    }

    return { classification: DRIFT_CLASSIFICATIONS.ANOMALY };
  }

  // Predict drift trajectory
  predictDriftTrajectory() {
    const rate = this.computeDriftRate();
    const current = this.driftHistory[this.driftHistory.length - 1];

    if (!rate.computable || !current) {
      return { predictable: false };
    }

    // Linear extrapolation (simplistic)
    const secsPerObservation = 1;
    const predictions = [];

    for (let i = 1; i <= 10; i++) {
      const predictedMagnitude = current.magnitude + rate.rate * i;

      predictions.push({
        secondsAhead: i * secsPerObservation,
        predictedMagnitude: Math.max(0, predictedMagnitude)
      });
    }

    return {
      predictable: true,
      trajectory: predictions,
      direction: rate.direction
    };
  }

  // Estimate time to deviation threshold
  estimateTimeToDeviation(threshold = 0.2) {
    const rate = this.computeDriftRate();
    const current = this.driftHistory[this.driftHistory.length - 1];

    if (!rate.computable || !current) {
      return { estimable: false };
    }

    if (current.magnitude >= threshold) {
      return {
        estimable: true,
        alreadyExceeded: true,
        currentMagnitude: current.magnitude
      };
    }

    if (rate.rate <= 0) {
      return {
        estimable: true,
        converging: true,
        timeToExceed: 'NEVER'
      };
    }

    const timeToThreshold = (threshold - current.magnitude) / rate.rate;

    return {
      estimable: true,
      alreadyExceeded: false,
      secondsToThreshold: Math.max(0, timeToThreshold),
      estimatedTime: new Date(Date.now() + timeToThreshold * 1000).toISOString()
    };
  }

  // Get drift metrics
  getDriftMetrics() {
    const rate = this.computeDriftRate();
    const accel = this.computeDriftAcceleration();
    const current = this.driftHistory[this.driftHistory.length - 1];
    const classification = this.classifyDrift();

    return Object.freeze({
      current: current || { magnitude: 0 },
      rate: rate.computable ? rate : null,
      acceleration: accel.computable ? accel : null,
      classification: classification.classification,
      metrics: {
        driftsDetected: this.metrics.driftsDetected,
        anomaliesDetected: this.metrics.anomaliesDetected,
        createdAt: this.metrics.createdAt
      },
      isAuthoritative: false
    });
  }

  // Helper: Get drift rate at specific window
  _getDriftRateAtWindow(startIndex, windowSize) {
    if (startIndex < 0 || startIndex + windowSize > this.driftHistory.length) {
      return null;
    }

    const window = this.driftHistory.slice(startIndex, startIndex + windowSize);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    const n = window.length;

    for (let i = 0; i < n; i++) {
      const x = i;
      const y = window[i].magnitude;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return slope;
  }
}

// Freeze class
Object.freeze(RealityDriftWatcher);
Object.freeze(RealityDriftWatcher.prototype);

module.exports = {
  RealityDriftWatcher,
  DRIFT_CLASSIFICATIONS
};
