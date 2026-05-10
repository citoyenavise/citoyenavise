// PHASE 9.1 — Truth Runtime Engine: Drift Field Model
// Multi-region spatial coherence tracking

class DriftFieldModel {
  constructor(regions = ['EU', 'US', 'APAC'], options = {}) {
    if (!Array.isArray(regions) || regions.length === 0) {
      throw new Error('Regions must be non-empty array');
    }

    this.regions = regions;
    this.windowSizeSeconds = options.windowSizeSeconds || 60;

    // Initialize drift field
    this.driftField = {};
    regions.forEach((region) => {
      this.driftField[region] = {
        current_divergence: 0.0,
        drift_rate: 0.0, // dD/dt per second
        drift_acceleration: 0.0, // d²D/dt² per second²
        variance: 0.0,
        history: [],
        lastUpdateTimestamp: null,
      };
    });

    // Metrics
    this.metrics = {
      updatesPerformed: 0,
      lastUpdateTimestamp: null,
    };
  }

  updateRegionalDivergence(region, timestamp, divergence) {
    if (!this.driftField[region]) {
      throw new Error(`Unknown region: ${region}`);
    }

    if (typeof divergence !== 'number' || divergence < 0 || divergence > 1) {
      throw new Error('Divergence must be number in [0, 1]');
    }

    const regionData = this.driftField[region];
    const previousDivergence = regionData.current_divergence;
    const previousTimestamp = regionData.lastUpdateTimestamp;

    // Update divergence
    regionData.current_divergence = divergence;
    regionData.lastUpdateTimestamp = timestamp;

    // Add to history
    regionData.history.push({
      timestamp,
      divergence,
      recordedAt: Date.now(),
    });

    // Compute drift rate (dD/dt)
    if (previousTimestamp) {
      const timeDeltaSeconds = (timestamp - previousTimestamp) / 1000;
      if (timeDeltaSeconds > 0) {
        const divergenceDelta = divergence - previousDivergence;
        const newDriftRate = divergenceDelta / timeDeltaSeconds;

        // Compute acceleration (d²D/dt²) before updating rate
        const oldRate = regionData.drift_rate;
        regionData.drift_acceleration = (newDriftRate - oldRate) / timeDeltaSeconds;

        // Update drift rate (use exponential moving average for smoothing)
        regionData.drift_rate = regionData.drift_rate * 0.7 + newDriftRate * 0.3;
      }
    }

    // Compute variance
    if (regionData.history.length > 1) {
      const values = regionData.history.slice(-this.windowSizeSeconds).map((e) => e.divergence);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      regionData.variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    }

    // Prune old history
    if (regionData.history.length > this.windowSizeSeconds * 10) {
      regionData.history = regionData.history.slice(-this.windowSizeSeconds * 10);
    }

    this.metrics.updatesPerformed++;
    this.metrics.lastUpdateTimestamp = new Date().toISOString();
  }

  getRegionalDrift(region) {
    if (!this.driftField[region]) {
      throw new Error(`Unknown region: ${region}`);
    }

    const data = this.driftField[region];
    return Object.freeze({
      region,
      current_divergence: data.current_divergence,
      drift_rate: data.drift_rate,
      drift_acceleration: data.drift_acceleration,
      variance: data.variance,
    });
  }

  getGlobalDriftField() {
    const heatmap = {};
    this.regions.forEach((region) => {
      const data = this.driftField[region];
      heatmap[region] = {
        divergence: data.current_divergence,
        drift_rate: data.drift_rate,
        variance: data.variance,
      };
    });

    return Object.freeze(heatmap);
  }

  getDriftRate(region, windowMs) {
    if (!this.driftField[region]) {
      throw new Error(`Unknown region: ${region}`);
    }

    const data = this.driftField[region];
    const windowSeconds = windowMs / 1000;

    if (data.history.length === 0) {
      return 0;
    }

    // Calculate average drift rate over window
    const recentEntries = data.history.filter(
      (e) => Date.now() - e.recordedAt < windowMs
    );

    if (recentEntries.length < 2) {
      return data.drift_rate;
    }

    const firstEntry = recentEntries[0];
    const lastEntry = recentEntries[recentEntries.length - 1];
    const timeDelta = (lastEntry.timestamp - firstEntry.timestamp) / 1000;

    if (timeDelta === 0) {
      return 0;
    }

    return (lastEntry.divergence - firstEntry.divergence) / timeDelta;
  }

  getRegionalConsistency() {
    const divergences = this.regions.map((r) => this.driftField[r].current_divergence);

    if (divergences.length === 0) {
      return 1.0;
    }

    const max = Math.max(...divergences);
    const min = Math.min(...divergences);
    const spread = max - min;

    // Consistency: 1.0 = all regions agree, 0.0 = maximum disagreement
    const consistency = 1.0 - spread;
    return Math.max(0, Math.min(1, consistency));
  }

  getMaxDriftGradient() {
    let maxGradient = 0;
    let maxRegion = null;

    this.regions.forEach((region) => {
      const absGradient = Math.abs(this.driftField[region].drift_rate);
      if (absGradient > maxGradient) {
        maxGradient = absGradient;
        maxRegion = region;
      }
    });

    return {
      region: maxRegion,
      gradient: maxGradient,
    };
  }

  getPropagationVector() {
    // Which region is drifting fastest?
    const vectors = this.regions.map((region) => ({
      region,
      drift_rate: this.driftField[region].drift_rate,
      divergence: this.driftField[region].current_divergence,
    }));

    // Sort by drift rate magnitude
    vectors.sort((a, b) => Math.abs(b.drift_rate) - Math.abs(a.drift_rate));

    return Object.freeze(vectors);
  }

  predictDriftTrajectory(horizonSeconds) {
    if (horizonSeconds <= 0) {
      throw new Error('Horizon must be positive');
    }

    const predictions = {};

    this.regions.forEach((region) => {
      const data = this.driftField[region];
      const current = data.current_divergence;
      const rate = data.drift_rate;
      const acceleration = data.drift_acceleration;

      // Simple linear prediction with acceleration
      // D(t+h) ≈ D(t) + (dD/dt) * h + 0.5 * (d²D/dt²) * h²
      const predicted =
        current + rate * horizonSeconds + 0.5 * acceleration * Math.pow(horizonSeconds, 2);

      predictions[region] = {
        current_divergence: current,
        predicted_divergence: Math.max(0, Math.min(1, predicted)),
        drift_rate: rate,
        horizon_seconds: horizonSeconds,
      };
    });

    return Object.freeze(predictions);
  }

  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      regionsMonitored: this.regions.length,
    });
  }

  reset() {
    this.regions.forEach((region) => {
      this.driftField[region] = {
        current_divergence: 0.0,
        drift_rate: 0.0,
        drift_acceleration: 0.0,
        variance: 0.0,
        history: [],
        lastUpdateTimestamp: null,
      };
    });

    this.metrics = {
      updatesPerformed: 0,
      lastUpdateTimestamp: null,
    };
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = DriftFieldModel;
