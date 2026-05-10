/**
 * PHASE 9.0 — CollapseDetectionModel (Collapse Detection via Variance)
 *
 * Detects system collapse via statistical variance analysis of divergence signal.
 *
 * Collapse Event = Sudden spike in divergence variance above threshold
 * Indicated by z-score > 3.0 (3-sigma deviation) combined with:
 *   - D(t) exceeds collapse threshold (ε₃)
 *   - Cross-region inconsistency detected
 *   - Multiple divergence components elevated
 */

class CollapseDetectionModel {
  constructor(options = {}) {
    // Thresholds for state classification
    this.thresholds = {
      epsilon_1: options.epsilon_1 || 0.05,    // Truth threshold (5%)
      epsilon_2: options.epsilon_2 || 0.20,    // Degradation threshold (20%)
      epsilon_3: options.epsilon_3 || 0.50,    // Collapse threshold (50%)
      z_score_threshold: options.z_score_threshold || 3.0  // 3-sigma
    };

    // Window size for variance calculation (60 samples = 60 seconds if 1/sec sampling)
    this.windowSize = options.windowSize || 60;

    // Detection sensitivity
    this.sensitivity = options.sensitivity || 1.0; // 1.0 = normal, 0.5 = low, 2.0 = high

    this.divergenceWindow = [];
    this.collapseEvents = [];

    this.metrics = {
      collapseDetections: 0,
      falsePositives: 0,
      truPositives: 0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Analyze divergence for collapse conditions
   *
   * Returns: {
   *   is_collapse: boolean,
   *   z_score: number,
   *   mean_divergence: number,
   *   variance: number,
   *   severity: number (0-1),
   *   components_elevated: [component names],
   *   regional_inconsistency: number
   * }
   */
  analyzeForCollapse(divergenceResult, regionalDivergences = {}) {
    try {
      if (!divergenceResult || typeof divergenceResult.total_divergence !== 'number') {
        throw new Error('Invalid divergence result');
      }

      const currentDivergence = divergenceResult.total_divergence;

      // Add to window
      this.divergenceWindow.push({
        timestamp: new Date().toISOString(),
        divergence: currentDivergence,
        components: divergenceResult.components || {}
      });

      // Keep window to size
      while (this.divergenceWindow.length > this.windowSize) {
        this.divergenceWindow.shift();
      }

      // Can't compute statistics with < 2 samples
      if (this.divergenceWindow.length < 2) {
        return Object.freeze({
          is_collapse: false,
          z_score: 0.0,
          mean_divergence: currentDivergence,
          variance: 0.0,
          severity: 0.0,
          components_elevated: [],
          regional_inconsistency: 0.0,
          sample_count: this.divergenceWindow.length,
          isAuthoritative: false
        });
      }

      // Compute mean and variance
      const { mean, variance, stddev } = this._computeStats(
        this.divergenceWindow.map(s => s.divergence)
      );

      // Compute z-score for current divergence
      const zScore = stddev > 0 ? (currentDivergence - mean) / stddev : 0.0;

      // Detect elevated components
      const elevatedComponents = this._detectElevatedComponents(divergenceResult.components);

      // Detect regional inconsistency
      const regionalInconsistency = this._computeRegionalInconsistency(regionalDivergences);

      // Collapse condition: z-score > threshold AND divergence > collapse threshold AND regional issues
      const isCollapse =
        zScore > this.thresholds.z_score_threshold * this.sensitivity &&
        currentDivergence > this.thresholds.epsilon_3 &&
        (elevatedComponents.length > 2 || regionalInconsistency > 0.3);

      // Severity: scaled from z-score
      const severity = Math.min(1.0, Math.max(0.0, (zScore - 3.0) / 3.0) * this.sensitivity);

      if (isCollapse) {
        this.metrics.collapseDetections++;
        this.collapseEvents.push({
          timestamp: new Date().toISOString(),
          z_score: zScore,
          divergence: currentDivergence,
          severity: severity,
          components_elevated: elevatedComponents,
          regional_inconsistency: regionalInconsistency
        });
      }

      const result = Object.freeze({
        is_collapse: isCollapse,
        z_score: zScore,
        mean_divergence: mean,
        variance: variance,
        stddev: stddev,
        severity: severity,
        components_elevated: Object.freeze([...elevatedComponents]),
        regional_inconsistency: regionalInconsistency,
        sample_count: this.divergenceWindow.length,
        thresholds: Object.freeze({
          z_score_threshold: this.thresholds.z_score_threshold * this.sensitivity,
          divergence_threshold: this.thresholds.epsilon_3
        }),
        isAuthoritative: false
      });

      return result;
    } catch (error) {
      return Object.freeze({
        error: error.message,
        is_collapse: false,
        isAuthoritative: false
      });
    }
  }

  /**
   * Classify system state based on divergence and context
   */
  classifyState(divergence, context = {}) {
    try {
      // Basic state classification
      let state = 'TRUE';

      if (divergence > this.thresholds.epsilon_3) {
        state = 'COLLAPSED';
      } else if (divergence > this.thresholds.epsilon_2) {
        state = 'BROKEN';
      } else if (divergence > this.thresholds.epsilon_1) {
        state = 'DEGRADED';
      }

      // Adjust for context
      if (context.is_under_adversarial_conditions) {
        // Under adversarial conditions, allow higher divergence
        if (state === 'BROKEN' && divergence < 0.35) {
          state = 'DEGRADED';
        }
      }

      // Adjust for multi-region context
      if (context.regional_inconsistency && context.regional_inconsistency > 0.2) {
        // High regional inconsistency escalates state
        if (state === 'DEGRADED') state = 'BROKEN';
        if (state === 'TRUE') state = 'DEGRADED';
      }

      return Object.freeze({
        state: state,
        divergence: divergence,
        is_accurate: state === 'TRUE',
        is_operable: state === 'TRUE' || state === 'DEGRADED',
        is_at_risk: state === 'BROKEN' || state === 'COLLAPSED',
        requires_intervention: state === 'COLLAPSED',
        context: context,
        classified_at: new Date().toISOString(),
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        error: error.message,
        state: 'UNKNOWN',
        isAuthoritative: false
      });
    }
  }

  /**
   * Compute verdict on system truth
   *
   * This is the authoritative truth function T(t)
   */
  computeTruth(divergenceResult, internalState, context = {}) {
    try {
      const divergence = divergenceResult.total_divergence || 0.0;

      // Classify state
      const stateClass = this.classifyState(divergence, context);

      // Analyze for collapse
      const collapseAnalysis = this.analyzeForCollapse(divergenceResult, context.regional_divergences);

      // Build verdict
      const verdict = Object.freeze({
        // Basic truth properties
        state: stateClass.state,
        divergence: divergence,

        // Truth assessment
        is_accurate: stateClass.is_accurate,
        is_operable: stateClass.is_operable,
        is_at_risk: stateClass.is_at_risk,
        requires_intervention: stateClass.requires_intervention,

        // Collapse detection
        collapse_risk: collapseAnalysis.is_collapse,
        collapse_severity: collapseAnalysis.severity,
        z_score: collapseAnalysis.z_score,

        // Primary cause of divergence
        primary_divergence_component: this._findPrimaryComponent(divergenceResult.components),

        // Context
        context: Object.freeze({
          is_under_adversarial_conditions: context.is_under_adversarial_conditions || false,
          active_conditions: context.active_conditions || [],
          external_clock_drift_ms: context.external_clock_drift_ms || 0,
          multi_region_consensus: context.multi_region_consensus !== false
        }),

        // Recommendations
        recommendations: Object.freeze(this._generateRecommendations(stateClass.state, divergence, collapseAnalysis)),

        // Authoritative verdict
        authoritative: true, // This is the truth function output
        timestamp: new Date().toISOString()
      });

      return verdict;
    } catch (error) {
      return Object.freeze({
        error: error.message,
        authoritative: true,
        state: 'UNKNOWN'
      });
    }
  }

  /**
   * Get collapse events detected
   */
  getCollapseEvents(limit = null) {
    const events = limit ? this.collapseEvents.slice(-limit) : this.collapseEvents;
    return Object.freeze({
      total_collapse_events: this.collapseEvents.length,
      recent_events: Object.freeze([...events]),
      isAuthoritative: false
    });
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      window_size: this.divergenceWindow.length,
      collapse_events: this.collapseEvents.length
    });
  }

  /**
   * Reset model
   */
  reset() {
    this.divergenceWindow = [];
    this.collapseEvents = [];
    this.metrics = {
      collapseDetections: 0,
      falsePositives: 0,
      truPositives: 0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Private: Compute mean, variance, stddev
   */
  _computeStats(values) {
    if (values.length === 0) return { mean: 0, variance: 0, stddev: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    return { mean, variance, stddev };
  }

  /**
   * Private: Detect which components are elevated
   */
  _detectElevatedComponents(components) {
    const elevated = [];
    const threshold = 0.3; // Components > 30% divergence are "elevated"

    for (const [component, value] of Object.entries(components)) {
      if (typeof value === 'number' && value > threshold) {
        elevated.push(component);
      }
    }

    return elevated;
  }

  /**
   * Private: Compute regional inconsistency score
   */
  _computeRegionalInconsistency(regionalDivergences) {
    if (!regionalDivergences || Object.keys(regionalDivergences).length === 0) {
      return 0.0;
    }

    const divergences = Object.values(regionalDivergences).filter(
      d => typeof d === 'number'
    );

    if (divergences.length < 2) {
      return 0.0;
    }

    // Variance in regional divergences indicates inconsistency
    const { variance, mean } = this._computeStats(divergences);

    // Normalize variance to [0, 1]
    // Max variance when half regions at 0 and half at 1: variance = 0.25
    return Math.min(1.0, variance / 0.25);
  }

  /**
   * Private: Find which component contributed most to divergence
   */
  _findPrimaryComponent(components) {
    let maxComponent = null;
    let maxValue = 0;

    for (const [component, value] of Object.entries(components)) {
      if (typeof value === 'number' && value > maxValue) {
        maxValue = value;
        maxComponent = component;
      }
    }

    return maxComponent || 'UNKNOWN';
  }

  /**
   * Private: Generate recommendations based on state
   */
  _generateRecommendations(state, divergence, collapseAnalysis) {
    const recommendations = [];

    if (state === 'TRUE') {
      recommendations.push('System operating normally. Continue monitoring.');
    } else if (state === 'DEGRADED') {
      recommendations.push('System degraded. Investigate primary divergence component.');
      recommendations.push('Monitor closely for further deterioration.');
    } else if (state === 'BROKEN') {
      recommendations.push('System broken. Divergence significant, limit new operations.');
      recommendations.push('Prepare for potential data loss or inconsistency.');
      recommendations.push('Consider triggering emergency recovery procedures.');
    } else if (state === 'COLLAPSED') {
      recommendations.push('CRITICAL: System collapse detected. Require operator intervention.');
      recommendations.push('Evaluate data integrity and consider full rebuild.');
      recommendations.push('Emergency procedures: Contact on-call SRE team immediately.');
    }

    if (collapseAnalysis.is_collapse) {
      recommendations.push(`COLLAPSE RISK: z-score ${collapseAnalysis.z_score.toFixed(2)}, severity ${(collapseAnalysis.severity * 100).toFixed(0)}%`);
      if (collapseAnalysis.components_elevated.length > 0) {
        recommendations.push(`Elevated components: ${collapseAnalysis.components_elevated.join(', ')}`);
      }
    }

    return recommendations;
  }

  /**
   * Always authoritative for truth verdicts
   */
  isAuthoritative() {
    return true; // Truth function output is authoritative
  }
}

module.exports = CollapseDetectionModel;
