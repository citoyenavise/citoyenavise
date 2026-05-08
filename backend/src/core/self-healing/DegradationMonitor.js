/**
 * DegradationMonitor
 * PHASE 1.3 — Self-Healing Governance
 *
 * Monitors system health proactively using a sliding window of health snapshots.
 * Detects degradation trends via linear regression before critical violation.
 * Calculates deterministic health score 0-100.
 *
 * Responsibilities:
 * - Record health snapshots
 * - Calculate health score (0-100)
 * - Detect degradation trends (linear regression)
 * - Manage sampling intervals
 * - Start/stop monitoring
 * - Generate health reports
 */

class DegradationMonitor {
  constructor(options = {}) {
    this.healthSnapshots = [];
    this.degradationEvents = [];
    this.monitoringActive = false;
    this.monitoringInterval = null;

    this.config = {
      samplingInterval_ms: options.samplingInterval_ms || 30000,
      degradationThreshold_percent: options.degradationThreshold_percent || 20,
      windowSize: options.windowSize || 10
    };

    this.metrics = {
      snapshotsTaken: 0,
      degradationEventsDetected: 0,
      falsePositives: 0,
      averageHealthScore: 100
    };
  }

  /**
   * Record a health snapshot
   */
  recordHealthSnapshot(healthData) {
    if (!healthData) throw new Error('healthData required');

    const score = this._calculateHealthScore(healthData);

    const snapshot = {
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      healthScore: score,
      healthData,
      sequenceNumber: this.healthSnapshots.length
    };

    this.healthSnapshots.push(snapshot);
    this.metrics.snapshotsTaken += 1;

    // Trim window to windowSize
    if (this.healthSnapshots.length > this.config.windowSize) {
      this.healthSnapshots.shift();
    }

    // Update average
    if (this.healthSnapshots.length > 0) {
      const sum = this.healthSnapshots.reduce((acc, s) => acc + s.healthScore, 0);
      this.metrics.averageHealthScore = Math.round(sum / this.healthSnapshots.length);
    }

    return snapshot;
  }

  /**
   * Detect degradation trend in current window
   */
  detectDegradationTrend() {
    if (this.healthSnapshots.length < 3) {
      return {
        degrading: false,
        reason: 'insufficient_data',
        dataPoints: this.healthSnapshots.length
      };
    }

    // Simple linear regression on health scores
    const n = this.healthSnapshots.length;
    const xs = Array.from({ length: n }, (_, i) => i);
    const ys = this.healthSnapshots.map((s) => s.healthScore);

    const xMean = xs.reduce((a, b) => a + b) / n;
    const yMean = ys.reduce((a, b) => a + b) / n;

    const numerator = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
    const denominator = xs.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Slope < -2 indicates significant decline
    const isDegrading = slope < -this.config.degradationThreshold_percent / 100;

    // Predict time to critical if degrading
    let predictedCriticalTime = null;
    if (isDegrading && slope < 0) {
      const currentScore = ys[ys.length - 1];
      const scoreToLose = currentScore - 20; // 20 is critical threshold
      const pointsToLose = Math.abs(scoreToLose / slope);
      const msPerPoint = this.config.samplingInterval_ms;
      predictedCriticalTime = Math.round(pointsToLose * msPerPoint);
    }

    return {
      degrading: isDegrading,
      slope: Math.round(slope * 100) / 100,
      confidence: isDegrading ? 'HIGH' : 'LOW',
      currentScore: ys[ys.length - 1],
      scoreChange: ys[ys.length - 1] - ys[0],
      predictedCriticalTime_ms: predictedCriticalTime,
      dataPoints: n
    };
  }

  /**
   * Start monitoring with provider function
   */
  start(healthDataProvider) {
    if (!healthDataProvider) throw new Error('healthDataProvider required');
    if (this.monitoringActive) return { started: false, reason: 'already_running' };

    this.monitoringActive = true;

    this.monitoringInterval = setInterval(() => {
      try {
        const healthData = healthDataProvider();
        if (healthData) {
          this.recordHealthSnapshot(healthData);

          // Check for degradation
          const trend = this.detectDegradationTrend();
          if (trend.degrading) {
            this.degradationEvents.push({
              timestamp: new Date().toISOString(),
              trend,
              triggeredAt: Date.now()
            });
            this.metrics.degradationEventsDetected += 1;
          }
        }
      } catch (error) {
        console.error(`[DegradationMonitor] Error in sampling: ${error.message}`);
      }
    }, this.config.samplingInterval_ms);

    return {
      started: true,
      samplingInterval_ms: this.config.samplingInterval_ms
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.monitoringActive) {
      return { stopped: false, reason: 'not_running' };
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.monitoringActive = false;
    return {
      stopped: true,
      snapshotsTaken: this.metrics.snapshotsTaken,
      degradationEventsDetected: this.metrics.degradationEventsDetected
    };
  }

  /**
   * Get degradation report
   */
  getDegradationReport() {
    const trend = this.detectDegradationTrend();

    return {
      timestamp: new Date().toISOString(),
      monitoringActive: this.monitoringActive,
      currentTrend: trend,
      recentEvents: this.degradationEvents.slice(-10),
      healthHistory: this.healthSnapshots.map((s) => ({
        timestamp: s.timestamp,
        score: s.healthScore
      })),
      metrics: { ...this.metrics }
    };
  }

  /**
   * Get health trend over window
   */
  getHealthTrend(windowSize = 10) {
    const trimmed = this.healthSnapshots.slice(-windowSize);

    return {
      timestamp: new Date().toISOString(),
      dataPoints: trimmed.length,
      scores: trimmed.map((s) => s.healthScore),
      min: Math.min(...trimmed.map((s) => s.healthScore)),
      max: Math.max(...trimmed.map((s) => s.healthScore)),
      average: Math.round(
        trimmed.reduce((sum, s) => sum + s.healthScore, 0) / Math.max(trimmed.length, 1)
      )
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      monitoringActive: this.monitoringActive,
      metrics: { ...this.metrics },
      snapshots: this.healthSnapshots.length,
      degradationEvents: this.degradationEvents.length
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.stop();
    this.healthSnapshots = [];
    this.degradationEvents = [];
    this.metrics = {
      snapshotsTaken: 0,
      degradationEventsDetected: 0,
      falsePositives: 0,
      averageHealthScore: 100
    };
    return { reset: true };
  }

  /**
   * Private: Calculate health score from health data
   * Algorithm: 100 - (violationRate * 40) - (cyclePenalty * 30) - (activeViolationsPenalty * 30)
   */
  _calculateHealthScore(healthData) {
    let score = 100;

    // Violation rate penalty (max 40 points)
    if (healthData.violationRate !== undefined) {
      score -= Math.min(healthData.violationRate * 40, 40);
    }

    // Validation cycle duration penalty (max 30 points)
    if (healthData.validationCycleDuration_ms !== undefined) {
      const cyclePenalty = Math.min(healthData.validationCycleDuration_ms / 100, 30);
      score -= cyclePenalty;
    }

    // Active violations penalty (max 30 points)
    if (healthData.activeViolations !== undefined) {
      const violationsPenalty = Math.min(healthData.activeViolations * 2, 30);
      score -= violationsPenalty;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

module.exports = DegradationMonitor;
