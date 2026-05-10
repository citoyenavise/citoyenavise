/**
 * PHASE 10.1 — ObservationTruthAggregator
 * Produce final consensus truth estimate
 */

class ObservationTruthAggregator {
  constructor(consensusEngine, validationFederation, reconciliation, options = {}) {
    this.consensusEngine = consensusEngine;
    this.validationFederation = validationFederation;
    this.reconciliation = reconciliation;

    this.confidenceK = options.confidenceK || 1.96;  // 95% CI

    this.metrics = {
      truthsAggregated: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Aggregate consensus
  aggregateConsensus(consensusResult, validationResult, reconciliationResult) {
    try {
      const consensus = consensusResult.consensus;
      const validation = this.validationFederation.computeValidationConsensus(
        validationResult
      );
      const reconciled = reconciliationResult.reconciled;

      const aggregated = {
        consensus: consensus.value,
        validation: validation.consensus,
        reconciliationCount: reconciled.length,
        combined: (consensus.value + validation.confidence) / 2,
        timestamp: new Date().toISOString()
      };

      return Object.freeze(aggregated);
    } catch (error) {
      return Object.freeze({
        error: error.message,
        aggregatable: false
      });
    }
  }

  // Compute truth estimate
  computeTruthEstimate(observations) {
    const consensus = this.consensusEngine.computeConsensus(observations);

    if (!consensus.computable) {
      return { estimable: false };
    }

    const estimate = {
      value: consensus.consensus.value,
      method: consensus.method,
      confidence: this.consensusEngine.computeConsensusConfidence(observations)
        .confidence,
      timestamp: new Date().toISOString()
    };

    this.metrics.truthsAggregated++;

    return Object.freeze(estimate);
  }

  // Compute confidence interval
  computeConfidenceInterval(observations) {
    const values = observations
      .filter((o) => o.success)
      .map((o) => o.observation.properties.value);

    if (values.length === 0) {
      return { computable: false };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);
    const se = stdDev / Math.sqrt(values.length);  // Standard error

    const lower = mean - this.confidenceK * se;
    const upper = mean + this.confidenceK * se;

    return Object.freeze({
      computable: true,
      mean,
      lower,
      upper,
      interval: [lower, upper],
      width: upper - lower,
      relativeWidth: (upper - lower) / (mean || 1)
    });
  }

  // Get observer agreement level
  getObserverAgreementLevel(observations) {
    const consensus = this.consensusEngine.computeConsensus(observations);

    if (!consensus.computable) {
      return { computable: false };
    }

    const agreeing = observations.filter((o) => {
      if (!o.success) return false;

      const diff = Math.abs(
        (o.observation.properties.value - consensus.consensus.value) /
          (consensus.consensus.value || 1)
      );

      return diff < 0.1;
    }).length;

    const percentage = (agreeing / (observations.length || 1)) * 100;

    return Object.freeze({
      agreeing,
      total: observations.length,
      percentage,
      level:
        percentage >= 90
          ? 'EXCELLENT'
          : percentage >= 80
            ? 'GOOD'
            : percentage >= 70
              ? 'FAIR'
              : 'POOR'
    });
  }

  // Get consensus quality
  getConsensusQuality(observations) {
    const agreement = this.getObserverAgreementLevel(observations);
    const confidence = this.consensusEngine.computeConsensusConfidence(
      observations
    );
    const outliers = this.consensusEngine.identifyOutliers(observations);

    const quality =
      confidence.confidence *
      (1 - outliers.count / (observations.length || 1));

    return Object.freeze({
      quality: Math.max(0, Math.min(1, quality)),
      agreement: agreement.percentage,
      outliers: outliers.count,
      rating:
        quality >= 0.9
          ? 'EXCELLENT'
          : quality >= 0.75
            ? 'GOOD'
            : quality >= 0.6
              ? 'FAIR'
              : 'POOR',
      isAuthoritative: false
    });
  }

  // Get final truth
  getFinalTruth(observations) {
    const estimate = this.computeTruthEstimate(observations);
    const confidence = this.computeConfidenceInterval(observations);
    const quality = this.getConsensusQuality(observations);
    const agreement = this.getObserverAgreementLevel(observations);

    if (!estimate.estimable) {
      return Object.freeze({ estimable: false });
    }

    return Object.freeze({
      value: estimate.value,
      method: estimate.method,
      confidence: estimate.confidence,
      interval: confidence.interval,
      quality: quality.quality,
      agreement: agreement.percentage,
      timestamp: estimate.timestamp,
      isAuthoritative: false
    });
  }

  // Get truth metrics
  getTruthMetrics() {
    return Object.freeze({
      ...this.metrics,
      isAuthoritative: false
    });
  }
}

// Freeze class
Object.freeze(ObservationTruthAggregator);
Object.freeze(ObservationTruthAggregator.prototype);

module.exports = {
  ObservationTruthAggregator
};
