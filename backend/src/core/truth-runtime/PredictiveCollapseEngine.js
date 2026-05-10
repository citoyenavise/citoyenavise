// PHASE 9.1 — Truth Runtime Engine: Predictive Collapse Engine
// Collapse forecasting and risk assessment

class PredictiveCollapseEngine {
  constructor(driftFieldModel, options = {}) {
    if (!driftFieldModel) {
      throw new Error('DriftFieldModel required');
    }

    this.driftField = driftFieldModel;

    // Thresholds
    this.collapseThreshold = options.collapseThreshold || 0.5; // ε₃
    this.velocityThreshold = options.velocityThreshold || 0.1;
    this.accelerationThreshold = options.accelerationThreshold || 0.02;
    this.varianceThreshold = options.varianceThreshold || 0.1;
    this.regionalAsynchronyThreshold = options.regionalAsynchronyThreshold || 0.3;

    // Weights for risk computation
    this.accelerationWeight = 0.4;
    this.velocityWeight = 0.3;
    this.magnitudeWeight = 0.3;

    // Metrics
    this.metrics = {
      riskComputations: 0,
      collapseDetections: 0,
      lastComputationTimestamp: null,
    };
  }

  computeCollapseRisk() {
    const globalField = this.driftField.getGlobalDriftField();
    const regions = Object.keys(globalField);

    let totalAccelerationRisk = 0;
    let totalVelocityRisk = 0;
    let totalMagnitudeRisk = 0;

    // Analyze each region
    regions.forEach((region) => {
      const regionalDrift = this.driftField.getRegionalDrift(region);

      // Risk from acceleration
      const accelerationRisk = Math.min(
        1.0,
        Math.max(0, (Math.abs(regionalDrift.drift_acceleration) - this.accelerationThreshold) /
          (0.1 - this.accelerationThreshold))
      );
      totalAccelerationRisk += accelerationRisk;

      // Risk from velocity
      const velocityRisk = Math.min(
        1.0,
        Math.max(0, (Math.abs(regionalDrift.drift_rate) - this.velocityThreshold) /
          (0.5 - this.velocityThreshold))
      );
      totalVelocityRisk += velocityRisk;

      // Risk from magnitude
      const magnitudeRisk = Math.min(
        1.0,
        Math.max(0, (regionalDrift.current_divergence - this.collapseThreshold) / (1.0 - this.collapseThreshold))
      );
      totalMagnitudeRisk += magnitudeRisk;
    });

    // Average risks
    const avgAccelerationRisk = totalAccelerationRisk / regions.length;
    const avgVelocityRisk = totalVelocityRisk / regions.length;
    const avgMagnitudeRisk = totalMagnitudeRisk / regions.length;

    // Weighted sum
    const collapseRisk =
      this.accelerationWeight * avgAccelerationRisk +
      this.velocityWeight * avgVelocityRisk +
      this.magnitudeWeight * avgMagnitudeRisk;

    this.metrics.riskComputations++;
    this.metrics.lastComputationTimestamp = new Date().toISOString();

    return Math.min(1.0, Math.max(0, collapseRisk));
  }

  estimateTimeToCollapse() {
    const globalField = this.driftField.getGlobalDriftField();
    const regions = Object.keys(globalField);

    let estimatedTimes = [];

    regions.forEach((region) => {
      const regionalDrift = this.driftField.getRegionalDrift(region);
      const current = regionalDrift.current_divergence;
      const velocity = regionalDrift.drift_rate;

      if (velocity > 0) {
        const timeToThreshold = (this.collapseThreshold - current) / velocity;
        if (timeToThreshold > 0) {
          estimatedTimes.push(timeToThreshold * 1000); // Convert to ms
        }
      }
    });

    if (estimatedTimes.length === 0) {
      return Infinity;
    }

    // Return minimum (soonest collapse)
    return Math.min(...estimatedTimes);
  }

  detectCollapseAcceleration() {
    const globalField = this.driftField.getGlobalDriftField();
    const regions = Object.keys(globalField);

    const accelerations = regions.map((region) => {
      const drift = this.driftField.getRegionalDrift(region);
      return {
        region,
        acceleration: drift.drift_acceleration,
        isAccelerating: Math.abs(drift.drift_acceleration) > this.accelerationThreshold,
      };
    });

    return Object.freeze(accelerations);
  }

  analyzeDivergenceTrend(windowMs) {
    const globalField = this.driftField.getGlobalDriftField();
    const regions = Object.keys(globalField);

    const trends = {};

    regions.forEach((region) => {
      const rate = this.driftField.getDriftRate(region, windowMs);
      trends[region] = {
        drift_rate: rate,
        window_ms: windowMs,
        is_increasing: rate > 0,
      };
    });

    return Object.freeze(trends);
  }

  detectVarianceExplosion() {
    const globalField = this.driftField.getGlobalDriftField();
    const regions = Object.keys(globalField);

    const explosions = regions.map((region) => {
      const drift = this.driftField.getRegionalDrift(region);
      const variance = drift.variance;
      const exploding = variance > this.varianceThreshold;

      return {
        region,
        variance,
        threshold: this.varianceThreshold,
        isExploding: exploding,
      };
    });

    return Object.freeze(explosions);
  }

  checkRegionalAsynchrony() {
    const consistency = this.driftField.getRegionalConsistency();
    const asynchrony = 1.0 - consistency;

    return {
      consistency,
      asynchrony,
      isAsync: asynchrony > this.regionalAsynchronyThreshold,
      threshold: this.regionalAsynchronyThreshold,
    };
  }

  isCollapseImminent() {
    const risk = this.computeCollapseRisk();
    const timeToCollapse = this.estimateTimeToCollapse();
    const asynchrony = this.checkRegionalAsynchrony();

    // Collapse is imminent if:
    // 1. Risk > 0.7, AND
    // 2. Time to collapse < 5 minutes, AND
    // 3. Regional inconsistency high
    const imminent =
      risk > 0.7 &&
      timeToCollapse < 5 * 60 * 1000 &&
      asynchrony.isAsync;

    if (imminent) {
      this.metrics.collapseDetections++;
    }

    return imminent;
  }

  getCollapseSeverity() {
    const risk = this.computeCollapseRisk();
    const maxGradient = this.driftField.getMaxDriftGradient();
    const asynchrony = this.checkRegionalAsynchrony();

    // Severity combines risk, gradient, and asynchrony
    const baseSeverity = risk * 0.5 + Math.min(1.0, maxGradient.gradient) * 0.3 + asynchrony.asynchrony * 0.2;

    return Math.min(1.0, Math.max(0, baseSeverity));
  }

  getMetrics() {
    return Object.freeze({
      ...this.metrics,
    });
  }

  reset() {
    this.metrics = {
      riskComputations: 0,
      collapseDetections: 0,
      lastComputationTimestamp: null,
    };
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = PredictiveCollapseEngine;
