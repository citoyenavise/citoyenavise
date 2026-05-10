/**
 * PHASE 10.2 — BreakpointDetectionSystem
 * Identify structural phase transitions and bifurcations
 */

class BreakpointDetectionSystem {
  constructor(timeSeriesData, options = {}) {
    this.timeSeriesData = timeSeriesData || [];
    this.divergenceThreshold = options.divergenceThreshold || 0.05;
    this.windowSize = options.windowSize || 100;

    this.metrics = {
      breakpointsDetected: 0,
      bifurcationsIdentified: 0,
      verificationsPerformed: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Detect structural breakpoints
  detectStructuralBreakpoints(data = this.timeSeriesData) {
    const breakpoints = [];

    if (data.length < this.windowSize * 2) {
      return Object.freeze({
        breakpoints: [],
        count: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const midpoint = Math.floor(data.length / 2);
    const beforeData = data.slice(0, midpoint);
    const afterData = data.slice(midpoint);

    const meanBefore = this._computeMean(beforeData);
    const meanAfter = this._computeMean(afterData);
    const varBefore = this._computeVariance(beforeData, meanBefore);
    const varAfter = this._computeVariance(afterData, meanAfter);

    const meanShift = Math.abs(meanAfter - meanBefore);
    const varShift = Math.abs(varAfter - varBefore);

    if (
      meanShift / (Math.abs(meanBefore) || 1) > this.divergenceThreshold ||
      varShift / (Math.abs(varBefore) || 1) > this.divergenceThreshold
    ) {
      breakpoints.push({
        timestamp: new Date(data[midpoint]?.ts || Date.now()).toISOString(),
        index: midpoint,
        meanBefore,
        meanAfter,
        varBefore,
        varAfter,
        severity: Math.max(
          meanShift / (Math.abs(meanBefore) || 1),
          varShift / (Math.abs(varBefore) || 1)
        )
      });
    }

    this.metrics.breakpointsDetected += breakpoints.length;
    this.metrics.verificationsPerformed++;

    return Object.freeze({
      breakpoints,
      count: breakpoints.length,
      severityScore:
        breakpoints.length > 0
          ? breakpoints.reduce((sum, bp) => sum + bp.severity, 0) /
            breakpoints.length
          : 0,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Identify bifurcation points (state space splits)
  identifyBifurcationPoints(data = this.timeSeriesData) {
    const bifurcations = [];

    if (data.length < this.windowSize) {
      return Object.freeze({
        bifurcations: [],
        count: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    for (let i = this.windowSize; i < data.length - this.windowSize; i++) {
      const beforeWindow = data.slice(i - this.windowSize, i);
      const afterWindow = data.slice(i, i + this.windowSize);

      const varBefore = this._computeVariance(
        beforeWindow,
        this._computeMean(beforeWindow)
      );
      const varAfter = this._computeVariance(
        afterWindow,
        this._computeMean(afterWindow)
      );

      const varRatio = varAfter / (varBefore || 1);

      if (varRatio > 2.0) {
        bifurcations.push({
          timestamp: new Date(data[i]?.ts || Date.now()).toISOString(),
          index: i,
          varBefore,
          varAfter,
          varRatio,
          newDimensions: Math.ceil(Math.log2(varRatio)) + 1,
          potentialCascade: varRatio > 5.0
        });
      }
    }

    this.metrics.bifurcationsIdentified += bifurcations.length;

    return Object.freeze({
      bifurcations,
      count: bifurcations.length,
      bifurcationIndex:
        bifurcations.length > 0
          ? bifurcations.reduce((sum, b) => sum + b.varRatio, 0) /
            bifurcations.length
          : 0,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Flag state space transitions
  flagStateSpaceTransitions(data = this.timeSeriesData) {
    const transitions = [];

    const breakpoints = this.detectStructuralBreakpoints(data).breakpoints;
    const bifurcations = this.identifyBifurcationPoints(data).bifurcations;

    for (const bp of breakpoints) {
      transitions.push({
        type: 'BREAKPOINT',
        timestamp: bp.timestamp,
        severity: bp.severity,
        description: 'Mean or variance regime changed'
      });
    }

    for (const bi of bifurcations) {
      transitions.push({
        type: 'BIFURCATION',
        timestamp: bi.timestamp,
        severity: bi.varRatio,
        description: `State space fragmented into ${bi.newDimensions} dimensions`
      });
    }

    return Object.freeze({
      transitions,
      count: transitions.length,
      avgSeverity:
        transitions.length > 0
          ? transitions.reduce((sum, t) => sum + t.severity, 0) /
            transitions.length
          : 0,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Predict collapse window
  predictCollapseWindow(data = this.timeSeriesData) {
    if (data.length < this.windowSize) {
      return Object.freeze({
        collapseImminent: false,
        probability: 0.0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const recentData = data.slice(-this.windowSize);
    const mean = this._computeMean(recentData);
    const variance = this._computeVariance(recentData, mean);
    const stdDev = Math.sqrt(variance);

    const driftRate = this._computeDriftRate(recentData);
    const acceleration = this._computeAcceleration(recentData);

    const collapseRisk =
      (Math.abs(driftRate) + Math.abs(acceleration)) /
      (stdDev + 0.001) /
      10;
    const collapseProbability = Math.min(1.0, collapseRisk);

    const collapseTs = collapseProbability > 0.3
      ? new Date(Date.now() + 300000).toISOString() // 5 min from now
      : null;

    return Object.freeze({
      collapseImminent: collapseProbability > 0.5,
      probability: collapseProbability,
      collapseWindowStart: collapseTs,
      collapseWindowEnd: collapseProbability > 0.3
        ? new Date(Date.now() + 600000).toISOString() // 10 min from now
        : null,
      riskFactors: {
        driftRate: Math.abs(driftRate),
        acceleration: Math.abs(acceleration),
        volatility: stdDev
      },
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Measure transition severity
  measureTransitionSeverity(data = this.timeSeriesData) {
    const breakpoints = this.detectStructuralBreakpoints(data).breakpoints;

    if (breakpoints.length === 0) {
      return Object.freeze({
        severity: 0.0,
        level: 'NONE',
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const avgSeverity =
      breakpoints.reduce((sum, bp) => sum + bp.severity, 0) /
      breakpoints.length;

    let level = 'MINOR';
    if (avgSeverity > 0.5) level = 'MODERATE';
    if (avgSeverity > 2.0) level = 'MAJOR';
    if (avgSeverity > 5.0) level = 'CATASTROPHIC';

    return Object.freeze({
      severity: avgSeverity,
      level,
      count: breakpoints.length,
      maxSeverity: Math.max(...breakpoints.map((bp) => bp.severity)),
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get breakpoint report
  getBreakpointReport(data = this.timeSeriesData) {
    const breakpoints = this.detectStructuralBreakpoints(data);
    const bifurcations = this.identifyBifurcationPoints(data);
    const transitions = this.flagStateSpaceTransitions(data);
    const severity = this.measureTransitionSeverity(data);
    const collapseWindow = this.predictCollapseWindow(data);

    return Object.freeze({
      breakpoints: breakpoints.count,
      bifurcations: bifurcations.count,
      totalTransitions: transitions.count,
      severity: severity.severity,
      severityLevel: severity.level,
      collapseRisk: collapseWindow.probability,
      collapseImminent: collapseWindow.collapseImminent,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get metrics
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      isAuthoritative: false
    });
  }

  // Helpers
  _computeMean(data) {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, val) => {
      const value = typeof val === 'object' ? val.value : val;
      return acc + (value || 0);
    }, 0);
    return sum / data.length;
  }

  _computeVariance(data, mean) {
    if (data.length === 0) return 0;
    const sumSquares = data.reduce((acc, val) => {
      const value = typeof val === 'object' ? val.value : val;
      return acc + Math.pow((value || 0) - mean, 2);
    }, 0);
    return sumSquares / data.length;
  }

  _computeDriftRate(data) {
    if (data.length < 2) return 0;
    const values = data.map((d) => (typeof d === 'object' ? d.value : d));
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  _computeAcceleration(data) {
    if (data.length < 3) return 0;
    const values = data.map((d) => (typeof d === 'object' ? d.value : d));
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }
    const accelValues = [];
    for (let i = 1; i < diffs.length; i++) {
      accelValues.push(diffs[i] - diffs[i - 1]);
    }
    return accelValues.reduce((a, b) => a + b, 0) / (accelValues.length || 1);
  }
}

// Freeze class
Object.freeze(BreakpointDetectionSystem);
Object.freeze(BreakpointDetectionSystem.prototype);

module.exports = {
  BreakpointDetectionSystem
};
