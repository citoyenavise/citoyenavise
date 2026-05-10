/**
 * PHASE 10.2 — TemporalAnomalyTracker
 * Detect time-series instabilities and collapse precursors
 */

class TemporalAnomalyTracker {
  constructor(timeSeriesData, options = {}) {
    this.timeSeriesData = timeSeriesData || [];
    this.detectionWindow = options.detectionWindow || 300000; // 5 minutes
    this.stagnationThreshold = options.stagnationThreshold || 0.001;

    this.metrics = {
      detectionsPerformed: 0,
      behaviorShiftsDetected: 0,
      anomaliesIdentified: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Detect sudden behavior shifts
  detectSuddenBehaviorShifts(data = this.timeSeriesData) {
    const shifts = [];

    if (data.length < 10) {
      return Object.freeze({
        shifts: [],
        count: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const values = data.map((d) => (typeof d === 'object' ? d.value : d));

    const windowSize = Math.max(3, Math.floor(values.length / 10));

    for (let i = windowSize; i < values.length - windowSize; i++) {
      const before = values.slice(i - windowSize, i);
      const after = values.slice(i, i + windowSize);

      const meanBefore = before.reduce((a, b) => a + b, 0) / before.length;
      const meanAfter = after.reduce((a, b) => a + b, 0) / after.length;

      const shift = Math.abs(meanAfter - meanBefore);
      const relativeShift = shift / (Math.abs(meanBefore) || 1);

      if (relativeShift > 0.2) {
        shifts.push({
          index: i,
          timestamp: new Date(data[i]?.ts || Date.now()).toISOString(),
          meanBefore,
          meanAfter,
          shift,
          relativeShift,
          magnitude:
            relativeShift > 0.5
              ? 'EXTREME'
              : relativeShift > 0.3
                ? 'MAJOR'
                : 'MODERATE'
        });
      }
    }

    this.metrics.detectionsPerformed++;
    this.metrics.behaviorShiftsDetected += shifts.length;

    return Object.freeze({
      shifts,
      count: shifts.length,
      density: (shifts.length / values.length) * 100,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Track drift rate acceleration
  trackDriftAcceleration(data = this.timeSeriesData) {
    const values = data.map((d) => (typeof d === 'object' ? d.value : d));

    if (values.length < 3) {
      return Object.freeze({
        acceleration: 0,
        driftRate: 0,
        isAccelerating: false,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    const driftRate = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    const secondDiffs = [];
    for (let i = 1; i < diffs.length; i++) {
      secondDiffs.push(diffs[i] - diffs[i - 1]);
    }

    const acceleration =
      secondDiffs.reduce((a, b) => a + b, 0) / secondDiffs.length;

    const isAccelerating = Math.abs(acceleration) > 0.1;

    return Object.freeze({
      acceleration,
      driftRate,
      isAccelerating,
      severity:
        Math.abs(acceleration) > 5.0
          ? 'EXTREME'
          : Math.abs(acceleration) > 1.0
            ? 'HIGH'
            : 'MODERATE',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Identify oscillation patterns
  identifyOscillationPatterns(data = this.timeSeriesData) {
    const values = data.map((d) => (typeof d === 'object' ? d.value : d));

    if (values.length < 10) {
      return Object.freeze({
        periodic: false,
        period: null,
        frequency: null,
        amplitude: null,
        periodAnomaly: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const centered = values.map((v) => v - mean);

    let maxCorr = 0;
    let period = 0;

    for (let lag = 1; lag < values.length / 2; lag++) {
      let corr = 0;
      for (let i = 0; i < values.length - lag; i++) {
        corr += centered[i] * centered[i + lag];
      }
      corr /= values.length - lag;

      if (corr > maxCorr) {
        maxCorr = corr;
        period = lag;
      }
    }

    const periodic = maxCorr > 0.3;
    const amplitude = periodic
      ? (Math.max(...values) - Math.min(...values)) / 2
      : 0;

    if (!periodic) {
      return Object.freeze({
        periodic: false,
        period: null,
        frequency: null,
        amplitude: null,
        periodAnomaly: 1.0,
        detail: 'No periodic behavior detected',
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const periods = [];
    for (let i = 0; i < values.length - period; i += period) {
      periods.push(period);
    }

    const periodVariance =
      periods.reduce((sum, p) => sum + Math.pow(p - period, 2), 0) /
      periods.length;
    const periodStdDev = Math.sqrt(periodVariance);
    const periodAnomaly = periodStdDev / (period || 1);

    return Object.freeze({
      periodic: true,
      period,
      frequency: 1 / (period || 1),
      amplitude,
      periodAnomaly,
      stability:
        periodAnomaly < 0.1
          ? 'STABLE'
          : periodAnomaly < 0.5
            ? 'MODERATE'
            : 'CHAOTIC',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Flag stagnation anomalies
  flagStagnationAnomalies(data = this.timeSeriesData) {
    const values = data.map((d) => (typeof d === 'object' ? d.value : d));

    const stagnationPeriods = [];

    let stagnationStart = null;
    let stagnationLength = 0;

    for (let i = 1; i < values.length; i++) {
      const change = Math.abs(values[i] - values[i - 1]);

      if (change < this.stagnationThreshold) {
        if (stagnationStart === null) {
          stagnationStart = i - 1;
        }
        stagnationLength++;
      } else {
        if (stagnationStart !== null && stagnationLength > 5) {
          stagnationPeriods.push({
            startIndex: stagnationStart,
            endIndex: i,
            duration: stagnationLength,
            timestamp: new Date(data[stagnationStart]?.ts || Date.now()).toISOString(),
            detail: `No change for ${stagnationLength} samples`
          });
        }
        stagnationStart = null;
        stagnationLength = 0;
      }
    }

    this.metrics.detectionsPerformed++;

    return Object.freeze({
      stagnationPeriods,
      count: stagnationPeriods.length,
      severity:
        stagnationPeriods.length > 5
          ? 'HIGH'
          : stagnationPeriods.length > 0
            ? 'MODERATE'
            : 'NONE',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Warn of collapse precursors
  warnOfCollapsePrecursors(data = this.timeSeriesData) {
    const values = data.map((d) => (typeof d === 'object' ? d.value : d));

    const shifts = this.detectSuddenBehaviorShifts(data).count;
    const acceleration = Math.abs(
      this.trackDriftAcceleration(data).acceleration
    );
    const stagnation = this.flagStagnationAnomalies(data).count;
    const oscillations = this.identifyOscillationPatterns(data);

    const precursorScore = Math.min(
      1.0,
      (shifts * 0.3 + acceleration / 10 + stagnation * 0.2) / 3
    );

    const precursors = [];

    if (shifts > 2) {
      precursors.push({
        type: 'MULTIPLE_SHIFTS',
        indicator: 'Multiple sudden behavior shifts detected',
        severity: 'HIGH',
        probability: Math.min(1.0, shifts / 10)
      });
    }

    if (acceleration > 1.0) {
      precursors.push({
        type: 'ACCELERATION',
        indicator: `Drift rate accelerating (d²X/dt² = ${acceleration.toFixed(2)})`,
        severity: 'HIGH',
        probability: Math.min(1.0, acceleration / 5)
      });
    }

    if (oscillations.periodic && oscillations.periodAnomaly > 0.5) {
      precursors.push({
        type: 'CHAOTIC_OSCILLATION',
        indicator: 'Oscillation period becoming chaotic',
        severity: 'MODERATE',
        probability: oscillations.periodAnomaly
      });
    }

    if (stagnation > 3) {
      precursors.push({
        type: 'REPEATED_STAGNATION',
        indicator: 'Multiple stagnation periods (system freezing)',
        severity: 'MODERATE',
        probability: Math.min(1.0, stagnation / 20)
      });
    }

    const collapseProbability =
      precursors.length > 0
        ? precursors.reduce((sum, p) => sum + p.probability, 0) /
          precursors.length
        : 0;

    this.metrics.anomaliesIdentified += precursors.length;

    return Object.freeze({
      precursors,
      count: precursors.length,
      collapseProbability,
      collapseImminent: collapseProbability > 0.6,
      windowTillCollapse: collapseProbability > 0.3
        ? `${Math.round(collapseProbability * 300)} seconds`
        : 'unknown',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get temporal anomaly report
  getTemporalAnomalyReport(data = this.timeSeriesData) {
    const shifts = this.detectSuddenBehaviorShifts(data);
    const drift = this.trackDriftAcceleration(data);
    const oscillations = this.identifyOscillationPatterns(data);
    const stagnation = this.flagStagnationAnomalies(data);
    const precursors = this.warnOfCollapsePrecursors(data);

    return Object.freeze({
      behaviorShifts: shifts.count,
      driftAcceleration: drift.acceleration,
      isAccelerating: drift.isAccelerating,
      oscillationAnomaly: oscillations.periodAnomaly,
      stagnationPeriods: stagnation.count,
      collapsePrecursors: precursors.count,
      collapseProbability: precursors.collapseProbability,
      collapseImminent: precursors.collapseImminent,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get anomaly density (for metrics)
  getAnomalyDensity(data = this.timeSeriesData) {
    const shifts = this.detectSuddenBehaviorShifts(data).count;
    const stagnation = this.flagStagnationAnomalies(data).count;
    const precursors = this.warnOfCollapsePrecursors(data).count;

    const totalAnomalies = shifts + stagnation + precursors;

    return (totalAnomalies / (data.length || 1)) * 100;
  }

  // Get metrics
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      isAuthoritative: false
    });
  }
}

// Freeze class
Object.freeze(TemporalAnomalyTracker);
Object.freeze(TemporalAnomalyTracker.prototype);

module.exports = {
  TemporalAnomalyTracker
};
