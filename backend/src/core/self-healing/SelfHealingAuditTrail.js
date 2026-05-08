/**
 * SelfHealingAuditTrail
 * PHASE 1.3 — Self-Healing Governance
 *
 * Maintains immutable audit trail of all self-healing decisions and actions.
 * Persists to JSONL file using appendFileSync for safety.
 * Never deletes entries, only appends.
 *
 * Responsibilities:
 * - Log all violation detections
 * - Log all healing decisions
 * - Log correction outcomes
 * - Log escalation events
 * - Maintain immutable trail
 * - Provide audit queries
 */

const fs = require('fs');
const path = require('path');

class SelfHealingAuditTrail {
  constructor(options = {}) {
    if (!options) throw new Error('options required');

    this.trail = [];
    this.entryCount = 0;
    this.trailFilePath = path.join(__dirname, '../../..', 'self_healing_audit.jsonl');

    this.config = {
      persistToDisk: options.persistToDisk !== false,
      maxInMemoryEntries: options.maxInMemoryEntries || 10000
    };

    this.metrics = {
      entriesCreated: 0,
      correctionsLogged: 0,
      escalationsLogged: 0,
      analysisLogged: 0
    };
  }

  /**
   * Generic decision logging — CORE METHOD
   * Called before any action to ensure audit trail precedes execution
   */
  logDecision(decisionType, details) {
    if (!decisionType || !details) throw new Error('decisionType and details required');

    const entry = {
      id: `heal_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      sequenceNumber: this.entryCount++,
      decisionType,
      details
    };

    this.trail.push(entry);

    // Trim in-memory trail if too large
    if (this.trail.length > this.config.maxInMemoryEntries) {
      this.trail.shift();
    }

    // Persist to disk
    if (this.config.persistToDisk) {
      this._persistEntry(entry);
    }

    this.metrics.entriesCreated += 1;
    return entry;
  }

  /**
   * Log correction attempt
   * Called BEFORE attempting the correction
   */
  logCorrectionAttempt(violation, strategy, expectedOutcome) {
    if (!violation || !strategy) throw new Error('violation and strategy required');

    const entry = this.logDecision('CORRECTION_ATTEMPT', {
      violation,
      strategy,
      expectedOutcome,
      attemptedAt: new Date().toISOString()
    });

    this.metrics.correctionsLogged += 1;
    return entry;
  }

  /**
   * Log correction outcome
   * Called AFTER correction attempt completes
   */
  logCorrectionOutcome(correctionId, success, actualOutcome) {
    if (!correctionId) throw new Error('correctionId required');

    const entry = this.logDecision('CORRECTION_OUTCOME', {
      correctionId,
      success,
      actualOutcome,
      completedAt: new Date().toISOString()
    });

    return entry;
  }

  /**
   * Log escalation event
   * Called when violation cannot be auto-corrected
   */
  logEscalation(violation, reason) {
    if (!violation || !reason) throw new Error('violation and reason required');

    const entry = this.logDecision('ESCALATION', {
      violation,
      escalationReason: reason,
      escalatedAt: new Date().toISOString()
    });

    this.metrics.escalationsLogged += 1;
    return entry;
  }

  /**
   * Log pattern detection
   */
  logPatternDetection(pattern, predictions) {
    if (!pattern) throw new Error('pattern required');

    const entry = this.logDecision('PATTERN_DETECTION', {
      pattern,
      predictions: predictions || [],
      detectedAt: new Date().toISOString()
    });

    this.metrics.analysisLogged += 1;
    return entry;
  }

  /**
   * Log degradation event
   */
  logDegradationEvent(healthSnapshot, trend) {
    if (!healthSnapshot) throw new Error('healthSnapshot required');

    const entry = this.logDecision('DEGRADATION_EVENT', {
      healthSnapshot,
      trend,
      detectedAt: new Date().toISOString()
    });

    return entry;
  }

  /**
   * Get trail entries by decision type
   */
  getTrailByType(decisionType, limit = 100) {
    if (!decisionType) throw new Error('decisionType required');

    return this.trail
      .filter((e) => e.decisionType === decisionType)
      .slice(-limit);
  }

  /**
   * Get trail entries by time range
   */
  getTrailByTimeRange(startMs, endMs) {
    if (!startMs || !endMs) throw new Error('startMs and endMs required');

    return this.trail.filter((e) => e.timestampMs >= startMs && e.timestampMs <= endMs);
  }

  /**
   * Get recent entries
   */
  getRecentEntries(limit = 50) {
    return this.trail.slice(-limit);
  }

  /**
   * Get statistics about audit trail
   */
  getStatistics() {
    const types = {};
    for (const entry of this.trail) {
      types[entry.decisionType] = (types[entry.decisionType] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      totalEntries: this.trail.length,
      entriesInMemory: this.trail.length,
      maxInMemory: this.config.maxInMemoryEntries,
      entriesByType: types,
      sequenceNumber: this.entryCount
    };
  }

  /**
   * Export trail to file
   */
  exportTrail(filename) {
    if (!filename) throw new Error('filename required');

    try {
      const content = this.trail.map((e) => JSON.stringify(e)).join('\n');
      fs.writeFileSync(filename, content, 'utf8');

      return {
        exported: true,
        filename,
        entryCount: this.trail.length
      };
    } catch (error) {
      return {
        exported: false,
        error: error.message
      };
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      metrics: { ...this.metrics },
      trail: {
        entriesInMemory: this.trail.length,
        trailFileExists: fs.existsSync(this.trailFilePath)
      }
    };
  }

  /**
   * Reset state (in-memory only, never delete file)
   */
  reset() {
    this.trail = [];
    // Note: entryCount and trailFilePath preserved for continuity
    this.metrics = {
      entriesCreated: 0,
      correctionsLogged: 0,
      escalationsLogged: 0,
      analysisLogged: 0
    };
    return { reset: true };
  }

  /**
   * Private: Persist entry to disk (JSONL format)
   */
  _persistEntry(entry) {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.trailFilePath, line, 'utf8');
    } catch (error) {
      // Log to console but don't throw — audit trail must not break system
      console.error(`[SelfHealingAuditTrail] Failed to persist entry: ${error.message}`);
    }
  }
}

module.exports = SelfHealingAuditTrail;
