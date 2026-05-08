/**
 * BootstrapTraceReporter.js - Report bootstrap sequence traces
 * PHASE 1.5: Observability Layer
 *
 * Responsibility: Trace and report bootstrap initialization
 * - Track bootstrap phases
 * - Measure phase durations
 * - Identify bottlenecks
 * - Generate bootstrap reports
 * - Support optimization
 */

class BootstrapTraceReporter {
  constructor() {
    this.bootstrapStart = null;
    this.phases = [];
    this.currentPhase = null;
    this.errors = [];
  }

  /**
   * Start bootstrap process
   */
  startBootstrap() {
    this.bootstrapStart = Date.now();
    this.phases = [];
    this.currentPhase = null;
    this.errors = [];

    return {
      bootstrapId: `bootstrap_${Date.now()}`,
      startTime: new Date().toISOString(),
      startTimestamp: this.bootstrapStart
    };
  }

  /**
   * Start bootstrap phase
   */
  startPhase(phaseName, phaseNumber, description = '') {
    if (this.currentPhase) {
      this._endCurrentPhase();
    }

    this.currentPhase = {
      phaseNumber,
      phaseName,
      description,
      startTime: Date.now(),
      startTimestamp: new Date().toISOString(),
      subPhases: []
    };

    return {
      phase: phaseName,
      phaseNumber,
      started: true
    };
  }

  /**
   * End current phase
   */
  _endCurrentPhase() {
    if (!this.currentPhase) return;

    this.currentPhase.endTime = Date.now();
    this.currentPhase.endTimestamp = new Date().toISOString();
    this.currentPhase.duration_ms = this.currentPhase.endTime - this.currentPhase.startTime;

    this.phases.push(this.currentPhase);
    this.currentPhase = null;
  }

  /**
   * Record sub-phase
   */
  recordSubPhase(subPhaseName, duration_ms, status = 'completed', details = {}) {
    if (!this.currentPhase) {
      return { success: false, reason: 'no_active_phase' };
    }

    const subPhase = {
      name: subPhaseName,
      duration_ms,
      status,
      timestamp: new Date().toISOString(),
      details
    };

    this.currentPhase.subPhases.push(subPhase);

    return { success: true, subPhase: subPhaseName };
  }

  /**
   * Record bootstrap error
   */
  recordError(errorPhase, error, severity = 'ERROR') {
    this.errors.push({
      phase: errorPhase,
      error: error.message || String(error),
      severity,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });

    return { recorded: true, errorCount: this.errors.length };
  }

  /**
   * End bootstrap
   */
  endBootstrap(success = true, message = '') {
    if (this.currentPhase) {
      this._endCurrentPhase();
    }

    const bootstrapEnd = Date.now();
    const totalDuration = bootstrapEnd - this.bootstrapStart;

    return {
      success,
      message,
      totalDuration_ms: totalDuration,
      phaseCount: this.phases.length,
      errorCount: this.errors.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get bootstrap timeline
   */
  getBootstrapTimeline() {
    const timeline = [];

    for (const phase of this.phases) {
      timeline.push({
        phase: phase.phaseName,
        phaseNumber: phase.phaseNumber,
        duration_ms: phase.duration_ms,
        status: phase.subPhases.length > 0 ? 'completed' : 'pending',
        subPhaseCount: phase.subPhases.length,
        timestamp: phase.startTimestamp
      });
    }

    return timeline;
  }

  /**
   * Get phase breakdown
   */
  getPhaseBreakdown() {
    const breakdown = [];

    for (const phase of this.phases) {
      const subPhaseBreakdown = phase.subPhases.map(sp => ({
        name: sp.name,
        duration_ms: sp.duration_ms,
        percentage: phase.duration_ms > 0
          ? ((sp.duration_ms / phase.duration_ms) * 100).toFixed(2) + '%'
          : '0%'
      }));

      breakdown.push({
        phase: phase.phaseName,
        totalDuration_ms: phase.duration_ms,
        subPhases: subPhaseBreakdown,
        percentageOfTotal: this.bootstrapStart
          ? ((phase.duration_ms / (Date.now() - this.bootstrapStart)) * 100).toFixed(2) + '%'
          : '0%'
      });
    }

    return breakdown;
  }

  /**
   * Find bottleneck phase
   */
  findBottleneck() {
    if (this.phases.length === 0) return null;

    const slowest = this.phases.reduce((prev, current) =>
      (prev.duration_ms > current.duration_ms) ? prev : current
    );

    return {
      phase: slowest.phaseName,
      duration_ms: slowest.duration_ms,
      subPhaseCount: slowest.subPhases.length
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const totalDuration = this.bootstrapStart ? Date.now() - this.bootstrapStart : 0;
    const durations = this.phases.map(p => p.duration_ms);

    return {
      totalDuration_ms: totalDuration,
      phaseCount: this.phases.length,
      averagePhase_ms: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      fastestPhase_ms: durations.length > 0 ? Math.min(...durations) : 0,
      slowestPhase_ms: durations.length > 0 ? Math.max(...durations) : 0,
      errorCount: this.errors.length,
      success: this.errors.length === 0
    };
  }

  /**
   * Generate bootstrap report
   */
  generateBootstrapReport() {
    return {
      timestamp: new Date().toISOString(),
      timeline: this.getBootstrapTimeline(),
      breakdown: this.getPhaseBreakdown(),
      bottleneck: this.findBottleneck(),
      performance: this.getPerformanceSummary(),
      errors: this.errors,
      recommendations: this._generateRecommendations()
    };
  }

  /**
   * Generate optimization recommendations
   */
  _generateRecommendations() {
    const recommendations = [];

    // Check for slow phases
    const bottleneck = this.findBottleneck();
    if (bottleneck && bottleneck.duration_ms > 500) {
      recommendations.push({
        type: 'slow_phase',
        phase: bottleneck.phase,
        message: `Phase ${bottleneck.phase} took ${bottleneck.duration_ms}ms, consider optimization`,
        severity: bottleneck.duration_ms > 1000 ? 'HIGH' : 'MEDIUM'
      });
    }

    // Check for errors
    if (this.errors.length > 0) {
      recommendations.push({
        type: 'errors',
        message: `${this.errors.length} errors detected during bootstrap`,
        severity: 'HIGH'
      });
    }

    // Check for excessive phases
    if (this.phases.length > 10) {
      recommendations.push({
        type: 'complex_bootstrap',
        message: `Bootstrap has ${this.phases.length} phases, consider consolidation`,
        severity: 'MEDIUM'
      });
    }

    return recommendations;
  }

  /**
   * Export bootstrap report
   */
  exportBootstrapReport(filename) {
    try {
      const report = this.generateBootstrapReport();
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(report, null, 2), 'utf8');

      return { success: true, filename };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get bootstrap status
   */
  getBootstrapStatus() {
    return {
      bootstrapStarted: this.bootstrapStart !== null,
      bootstrapStartTime: this.bootstrapStart
        ? new Date(this.bootstrapStart).toISOString()
        : null,
      currentPhase: this.currentPhase ? this.currentPhase.phaseName : null,
      phaseCount: this.phases.length,
      errorCount: this.errors.length,
      elapsedTime_ms: this.bootstrapStart ? Date.now() - this.bootstrapStart : 0
    };
  }

  /**
   * Reset bootstrap trace
   */
  reset() {
    this.bootstrapStart = null;
    this.phases = [];
    this.currentPhase = null;
    this.errors = [];

    return { reset: true };
  }
}

module.exports = BootstrapTraceReporter;
