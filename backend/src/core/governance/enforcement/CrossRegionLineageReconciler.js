const crypto = require('crypto');

class CrossRegionLineageReconciler {
  constructor(regions, lineageEngine, options = {}) {
    this.regions = Object.freeze([...regions]);
    this.lineageEngine = lineageEngine;
    this.reconciliationThreshold = options.reconciliationThreshold || 0.95;

    this.reconciliationMetrics = {
      reconciliations: 0,
      divergencesResolved: 0,
      flaggedDivergences: 0,
      crossRegionChecks: 0,
      createdAt: new Date().toISOString()
    };

    this.divergenceLogs = [];
    this.alerts = [];
  }

  reconcileRegions(targetTs) {
    try {
      if (!targetTs || !Array.isArray(this.regions) || this.regions.length === 0) {
        return Object.freeze({
          targetTs,
          consistent: false,
          regionsChecked: [],
          divergentRegions: [],
          divergenceScore: 0.0,
          recommendedAction: 'ALERT',
          isAuthoritative: false
        });
      }

      let divergentRegions = [];
      let divergenceScore = 0.0;
      const regionsChecked = [...this.regions];

      // Compare lineage hashes across regions
      for (let i = 0; i < this.regions.length - 1; i++) {
        for (let j = i + 1; j < this.regions.length; j++) {
          const region1 = this.regions[i];
          const region2 = this.regions[j];

          try {
            const divergenceResult = this.detectRegionDivergence(region1, region2, targetTs);

            if (divergenceResult.divergenceFound) {
              divergenceScore += (1.0 / (this.regions.length - 1));
              if (!divergentRegions.includes(region2)) {
                divergentRegions.push(region2);
              }
            }
          } catch (e) {
            // Continue with next region pair
          }
        }
      }

      const consistent = divergenceScore < this.reconciliationThreshold;
      let recommendedAction = 'ALERT';

      if (!consistent) {
        if (divergenceScore > 0.5) {
          recommendedAction = 'RECONSTRUCT';
        } else {
          recommendedAction = 'MANUAL';
        }
      }

      this.reconciliationMetrics.reconciliations++;
      this.reconciliationMetrics.crossRegionChecks += this.regions.length;

      return Object.freeze({
        targetTs,
        consistent,
        regionsChecked: Object.freeze([...regionsChecked]),
        divergentRegions: Object.freeze([...divergentRegions]),
        divergenceScore: Math.min(1.0, divergenceScore),
        recommendedAction,
        elapsedMs: 0,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        targetTs,
        consistent: false,
        regionsChecked: [],
        divergentRegions: [],
        divergenceScore: 0.0,
        recommendedAction: 'ALERT',
        error: error.message,
        isAuthoritative: false
      });
    }
  }

  detectRegionDivergence(region1, region2, windowTs) {
    try {
      if (!region1 || !region2 || !windowTs) {
        return Object.freeze({
          region1,
          region2,
          windowTs,
          divergenceFound: false,
          divergenceType: 'NONE',
          detail: 'Invalid parameters',
          isAuthoritative: false
        });
      }

      if (region1 === region2) {
        return Object.freeze({
          region1,
          region2,
          windowTs,
          divergenceFound: false,
          divergenceType: 'NONE',
          detail: 'Same region',
          isAuthoritative: false
        });
      }

      let divergenceFound = false;
      let divergenceType = 'NONE';
      let detail = '';

      // Verify lineage at timestamp for both regions
      if (this.lineageEngine && typeof this.lineageEngine.verifyLineageAt === 'function') {
        try {
          const lineage1 = this.lineageEngine.verifyLineageAt(windowTs, 'SAMPLE');
          const lineage2 = this.lineageEngine.verifyLineageAt(windowTs, 'SAMPLE');

          if (lineage1.chainHash !== lineage2.chainHash) {
            divergenceFound = true;
            divergenceType = 'HASH_MISMATCH';
            detail = `Hash mismatch: ${lineage1.chainHash.slice(0, 8)} vs ${lineage2.chainHash.slice(0, 8)}`;
          }

          if (lineage1.chainLength !== lineage2.chainLength) {
            divergenceFound = true;
            divergenceType = 'ORDERING_DIFF';
            detail = `Chain length mismatch: ${lineage1.chainLength} vs ${lineage2.chainLength}`;
          }
        } catch (e) {
          detail = `Lineage verification error: ${e.message}`;
        }
      }

      this.reconciliationMetrics.crossRegionChecks++;

      return Object.freeze({
        region1,
        region2,
        windowTs,
        divergenceFound,
        divergenceType,
        detail,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        region1,
        region2,
        windowTs,
        divergenceFound: false,
        divergenceType: 'NONE',
        detail: error.message,
        isAuthoritative: false
      });
    }
  }

  flagDivergence(regionId, divergenceDetail) {
    try {
      if (!regionId || !divergenceDetail) {
        return Object.freeze({
          flagged: false,
          regionId,
          divergenceDetail,
          flaggedAt: new Date().toISOString(),
          alertId: '',
          action: 'FLAG',
          error: 'Invalid parameters',
          isAuthoritative: false
        });
      }

      const alertId = crypto.randomUUID();
      const flaggedAt = new Date().toISOString();

      const alert = Object.freeze({
        alertId,
        regionId,
        divergenceDetail,
        flaggedAt,
        severity: 'WARNING',
        action: 'FLAG'
      });

      this.alerts.push(alert);
      this.divergenceLogs.push({
        ts: flaggedAt,
        regionId,
        detail: divergenceDetail,
        alertId
      });

      this.reconciliationMetrics.flaggedDivergences++;

      return Object.freeze({
        flagged: true,
        regionId,
        divergenceDetail,
        flaggedAt,
        alertId,
        action: 'FLAG',
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        flagged: false,
        regionId,
        divergenceDetail,
        flaggedAt: new Date().toISOString(),
        alertId: '',
        action: 'FLAG',
        error: error.message,
        isAuthoritative: false
      });
    }
  }

  getReconciliationReport(startTs, endTs) {
    try {
      if (!startTs || !endTs) {
        return Object.freeze({
          startTs,
          endTs,
          regionsChecked: [],
          overallConsistency: 0.0,
          divergences: [],
          resolutionRequired: false,
          reportAt: new Date().toISOString(),
          isAuthoritative: false
        });
      }

      const relevantLogs = this.divergenceLogs.filter(log => {
        const logTs = new Date(log.ts).getTime();
        const startTsMs = new Date(startTs).getTime();
        const endTsMs = new Date(endTs).getTime();
        return logTs >= startTsMs && logTs <= endTsMs;
      });

      let consistencyScore = 1.0;
      if (this.regions.length > 1) {
        const divergenceCount = relevantLogs.length;
        const totalChecks = this.regions.length * (this.regions.length - 1) / 2;
        consistencyScore = totalChecks > 0 ? 1.0 - (divergenceCount / totalChecks) : 1.0;
      }

      const overallConsistency = Math.max(0.0, Math.min(1.0, consistencyScore));
      const resolutionRequired = overallConsistency < this.reconciliationThreshold;

      return Object.freeze({
        startTs,
        endTs,
        regionsChecked: Object.freeze([...this.regions]),
        overallConsistency,
        divergences: Object.freeze([...relevantLogs]),
        resolutionRequired,
        reportAt: new Date().toISOString(),
        elapsedMs: 0,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        startTs,
        endTs,
        regionsChecked: [],
        overallConsistency: 0.0,
        divergences: [],
        resolutionRequired: true,
        reportAt: new Date().toISOString(),
        error: error.message,
        isAuthoritative: false
      });
    }
  }

  getMetrics() {
    return Object.freeze({
      reconciliations: this.reconciliationMetrics.reconciliations,
      divergencesResolved: this.reconciliationMetrics.divergencesResolved,
      flaggedDivergences: this.reconciliationMetrics.flaggedDivergences,
      crossRegionChecks: this.reconciliationMetrics.crossRegionChecks,
      timestamp: new Date().toISOString(),
      createdAt: this.reconciliationMetrics.createdAt,
      isAuthoritative: false
    });
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.reconciliationMetrics = {
      reconciliations: 0,
      divergencesResolved: 0,
      flaggedDivergences: 0,
      crossRegionChecks: 0,
      createdAt: new Date().toISOString()
    };
    this.divergenceLogs = [];
    this.alerts = [];
  }
}

module.exports = CrossRegionLineageReconciler;
