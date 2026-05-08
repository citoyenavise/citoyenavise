/**
 * ViolationPatternAnalyzer
 * PHASE 1.3 — Self-Healing Governance
 *
 * Analyzes violation history to detect recurring patterns and predict violations.
 * Patterns with ≥3 occurrences are considered recurring.
 * Generates confidence-weighted predictions.
 *
 * Responsibilities:
 * - Record incoming violations
 * - Build pattern key from violation attributes
 * - Identify recurring patterns (≥3 occurrences)
 * - Predict future violations based on frequency
 * - Calculate violation trends
 * - Generate analysis reports
 */

class ViolationPatternAnalyzer {
  constructor(options = {}) {
    this.violationHistory = [];
    this.patterns = new Map();

    this.config = {
      maxHistorySize: options.maxHistorySize || 10000,
      minPatternOccurrences: options.minPatternOccurrences || 3
    };

    this.metrics = {
      violationsAnalyzed: 0,
      patternsDetected: 0,
      predictionsGenerated: 0,
      averageAnalysisTime_ms: 0
    };
  }

  /**
   * Record a violation in the history
   */
  recordViolation(violation) {
    if (!violation) throw new Error('violation required');

    // Add timestamp if missing
    if (!violation.timestamp) {
      violation.timestamp = Date.now();
    }

    this.violationHistory.push(violation);
    this.metrics.violationsAnalyzed += 1;

    // Trim history if too large
    if (this.violationHistory.length > this.config.maxHistorySize) {
      this.violationHistory.shift();
    }

    // Update pattern map
    const patternKey = this._buildPatternKey(violation);
    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        key: patternKey,
        count: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        violations: []
      });
    }

    const pattern = this.patterns.get(patternKey);
    pattern.count += 1;
    pattern.lastSeen = Date.now();
    pattern.violations.push(violation);

    // Trim violations array in pattern
    if (pattern.violations.length > 100) {
      pattern.violations.shift();
    }
  }

  /**
   * Analyze all recorded patterns
   */
  analyzePatterns() {
    const startTime = Date.now();
    const recurringPatterns = [];

    for (const [patternKey, pattern] of this.patterns) {
      // Calculate frequency (violations per hour)
      const timespan = (pattern.lastSeen - pattern.firstSeen) / (1000 * 60 * 60); // hours
      const frequency = timespan > 0 ? pattern.count / timespan : pattern.count;

      const patternInfo = {
        key: patternKey,
        count: pattern.count,
        frequency_per_hour: frequency,
        firstSeen: new Date(pattern.firstSeen).toISOString(),
        lastSeen: new Date(pattern.lastSeen).toISOString(),
        isRecurring: pattern.count >= this.config.minPatternOccurrences
      };

      if (patternInfo.isRecurring) {
        recurringPatterns.push(patternInfo);
      }

      this.metrics.patternsDetected = Math.max(
        this.metrics.patternsDetected,
        recurringPatterns.length
      );
    }

    const analysisTime = Date.now() - startTime;
    this.metrics.averageAnalysisTime_ms = analysisTime;

    return {
      patterns: recurringPatterns,
      recurringCount: recurringPatterns.length,
      totalPatternsTracked: this.patterns.size,
      analysisTime_ms: analysisTime
    };
  }

  /**
   * Predict next violations based on patterns
   */
  predictNextViolation() {
    const predictions = [];
    const analysis = this.analyzePatterns();

    for (const pattern of analysis.patterns) {
      // Calculate confidence based on frequency and consistency
      let confidence = 'LOW';
      if (pattern.frequency_per_hour >= 5) {
        confidence = 'HIGH';
      } else if (pattern.frequency_per_hour >= 2) {
        confidence = 'MEDIUM';
      }

      // Estimate next occurrence time
      const avgInterval = pattern.frequency_per_hour > 0 ? 60 / pattern.frequency_per_hour : null;

      predictions.push({
        patternKey: pattern.key,
        predictedAt: new Date().toISOString(),
        confidence,
        frequency_per_hour: pattern.frequency_per_hour,
        estimatedNextOccurrence_minutes: avgInterval,
        occurrenceCount: pattern.count
      });
    }

    this.metrics.predictionsGenerated = predictions.length;
    return predictions;
  }

  /**
   * Get recurring patterns above threshold
   */
  getRecurringPatterns(minCount = 3) {
    const patterns = [];

    for (const [patternKey, pattern] of this.patterns) {
      if (pattern.count >= minCount) {
        patterns.push({
          key: patternKey,
          count: pattern.count,
          lastViolations: pattern.violations.slice(-5)
        });
      }
    }

    return patterns;
  }

  /**
   * Get violation frequency in time window
   */
  getViolationFrequency(timeWindow_ms) {
    if (!timeWindow_ms) throw new Error('timeWindow_ms required');

    const cutoffTime = Date.now() - timeWindow_ms;
    const recent = this.violationHistory.filter((v) => v.timestamp >= cutoffTime);

    const bySeverity = {};
    const byType = {};

    for (const v of recent) {
      bySeverity[v.severity || 'UNKNOWN'] = (bySeverity[v.severity] || 0) + 1;
      byType[v.type || 'UNKNOWN'] = (byType[v.type] || 0) + 1;
    }

    return {
      total: recent.length,
      timeWindow_ms: timeWindow_ms,
      bySeverity,
      byType
    };
  }

  /**
   * Generate analysis report
   */
  generateAnalysisReport() {
    const analysis = this.analyzePatterns();
    const predictions = this.predictNextViolation();
    const frequency24h = this.getViolationFrequency(24 * 60 * 60 * 1000);

    return {
      timestamp: new Date().toISOString(),
      historySize: this.violationHistory.length,
      analysis,
      predictions,
      frequency24h,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      historySize: this.violationHistory.length,
      patternCount: this.patterns.size
    };
  }

  /**
   * Reset state
   */
  reset() {
    this.violationHistory = [];
    this.patterns.clear();
    this.metrics = {
      violationsAnalyzed: 0,
      patternsDetected: 0,
      predictionsGenerated: 0,
      averageAnalysisTime_ms: 0
    };
    return { reset: true };
  }

  /**
   * Private: Build pattern key from violation
   */
  _buildPatternKey(violation) {
    const type = violation.type || 'UNKNOWN';
    const module = violation.module || 'UNKNOWN';
    return `${type}::${module}`;
  }
}

module.exports = ViolationPatternAnalyzer;
