/**
 * PHASE 10.1 — CrossObserverReconciliation
 * Resolve divergences between observers
 */

class CrossObserverReconciliation {
  constructor(observers, options = {}) {
    this.observers = observers;
    this.robustMeanK = options.robustMeanK || 1.5;  // IQR-based outlier removal

    this.metrics = {
      reconciliationsPerformed: 0,
      divergencesResolved: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Detect divergence
  detectDivergence(observations) {
    if (observations.length < 2) {
      return { divergenceDetected: false };
    }

    const values = observations
      .filter((o) => o.success)
      .map((o) => o.observation.properties.value);

    if (values.length < 2) {
      return { divergenceDetected: false };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;

    const divergence = range / (mean || 1);

    return Object.freeze({
      divergenceDetected: divergence > 0.1,
      magnitude: divergence,
      range: { min, max, span: range },
      isAuthoritative: false
    });
  }

  // Analyze discrepancies
  analyzeDiscrepancies(observations) {
    const divergence = this.detectDivergence(observations);

    if (!divergence.divergenceDetected) {
      return { discrepancies: [] };
    }

    const mean = this._computeMean(observations);
    const discrepancies = [];

    for (const obs of observations) {
      if (!obs.success) continue;

      const diff = Math.abs(
        (obs.observation.properties.value - mean) / (mean || 1)
      );

      if (diff > 0.05) {
        discrepancies.push({
          observerId: obs.observerId,
          value: obs.observation.properties.value,
          difference: diff * 100,
          probable_cause: diff > 0.2 ? 'OUTLIER' : 'NOISE'
        });
      }
    }

    return Object.freeze({ discrepancies, count: discrepancies.length });
  }

  // Statistical reconciliation
  statisticalReconciliation(observations) {
    // Remove outliers using robust mean (IQR method)
    const values = observations
      .filter((o) => o.success)
      .map((o) => ({
        observerId: o.observerId,
        value: o.observation.properties.value
      }))
      .sort((a, b) => a.value - b.value);

    if (values.length < 3) {
      return Object.freeze({
        reconciled: values,
        removedOutliers: [],
        isAuthoritative: false
      });
    }

    // Compute quartiles
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index].value;
    const q3 = values[q3Index].value;
    const iqr = q3 - q1;

    // Remove outliers beyond IQR * k
    const lowerBound = q1 - this.robustMeanK * iqr;
    const upperBound = q3 + this.robustMeanK * iqr;

    const reconciled = values.filter(
      (v) => v.value >= lowerBound && v.value <= upperBound
    );

    const removed = values.filter(
      (v) => v.value < lowerBound || v.value > upperBound
    );

    return Object.freeze({
      reconciled,
      removedOutliers: removed,
      outlierCount: removed.length,
      isAuthoritative: false
    });
  }

  // Weight by confidence
  weightByConfidence(observations, confidenceScores) {
    let weightedSum = 0,
      totalWeight = 0;

    for (const obs of observations) {
      const conf = confidenceScores[obs.observerId] || 1.0;

      weightedSum += obs.observation.properties.value * conf;
      totalWeight += conf;
    }

    return Object.freeze({
      weightedMean: weightedSum / (totalWeight || 1),
      totalWeight,
      isAuthoritative: false
    });
  }

  // Detect systematic bias
  detectSystematicBias(observations) {
    const mean = this._computeMean(observations);
    const observerBiases = {};

    for (const obs of observations) {
      if (!obs.success) continue;

      const bias =
        (obs.observation.properties.value - mean) / (mean || 1);

      if (!observerBiases[obs.observerId]) {
        observerBiases[obs.observerId] = [];
      }

      observerBiases[obs.observerId].push(bias);
    }

    // Find consistently biased observers
    const systematicBiases = {};

    for (const [id, biases] of Object.entries(observerBiases)) {
      const avgBias = biases.reduce((a, b) => a + b, 0) / biases.length;

      if (Math.abs(avgBias) > 0.05) {
        systematicBiases[id] = avgBias;
      }
    }

    return Object.freeze({
      biasesDetected: Object.keys(systematicBiases).length > 0,
      systematicBiases,
      isAuthoritative: false
    });
  }

  // Compensate for bias
  compensateForBias(observations, biases) {
    const compensated = [];

    for (const obs of observations) {
      const bias = biases[obs.observerId] || 0;

      compensated.push({
        observerId: obs.observerId,
        originalValue: obs.observation.properties.value,
        bias,
        compensatedValue:
          obs.observation.properties.value - bias * (obs.observation.properties.value || 1),
        success: obs.success
      });
    }

    return Object.freeze({ compensated, count: compensated.length });
  }

  // Get reconciliation result
  getReconciliationResult() {
    return Object.freeze({
      reconciliationsPerformed: this.metrics.reconciliationsPerformed,
      divergencesResolved: this.metrics.divergencesResolved,
      isAuthoritative: false
    });
  }

  // Get reconciliation metrics
  getReconciliationMetrics() {
    return Object.freeze({
      ...this.metrics,
      robustMeanK: this.robustMeanK,
      isAuthoritative: false
    });
  }

  // Helper: Compute mean
  _computeMean(observations) {
    const values = observations
      .filter((o) => o.success)
      .map((o) => o.observation.properties.value);

    if (values.length === 0) return 0;

    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// Freeze class
Object.freeze(CrossObserverReconciliation);
Object.freeze(CrossObserverReconciliation.prototype);

module.exports = {
  CrossObserverReconciliation
};
