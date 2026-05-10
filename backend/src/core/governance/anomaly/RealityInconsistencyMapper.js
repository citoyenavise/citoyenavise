/**
 * PHASE 10.2 — RealityInconsistencyMapper
 * Map observer disagreement zones and consensus fragility
 */

class RealityInconsistencyMapper {
  constructor(observerData, consensusMetrics, options = {}) {
    this.observerData = observerData || [];
    this.consensusMetrics = consensusMetrics || {};
    this.uncertaintyThreshold = options.uncertaintyThreshold || 0.3;

    this.metrics = {
      mappingsPerformed: 0,
      disagreementZonesDetected: 0,
      fragilityZonesHighlighted: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Map observer disagreement zones
  mapObserverDisagreementZones(observations = this.observerData) {
    const zones = [];
    const observerGroups = this._groupByRegion(observations);

    for (const [region, regionObs] of Object.entries(observerGroups)) {
      const oal = this._computeObserverAgreementLevel(regionObs);

      if (oal < 0.7) {
        zones.push({
          region,
          observerCount: regionObs.length,
          agreementLevel: oal,
          disagreementMagnitude: 1.0 - oal,
          level:
            oal < 0.4
              ? 'SEVERE'
              : oal < 0.6
                ? 'HIGH'
                : 'MODERATE',
          detail: `${Math.round((1.0 - oal) * 100)}% observer disagreement`
        });
      }
    }

    this.metrics.mappingsPerformed++;
    this.metrics.disagreementZonesDetected += zones.length;

    return Object.freeze({
      zones,
      count: zones.length,
      severity:
        zones.length === 0
          ? 'NONE'
          : zones.some((z) => z.level === 'SEVERE')
            ? 'CRITICAL'
            : zones.some((z) => z.level === 'HIGH')
              ? 'WARNING'
              : 'MODERATE',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Identify systematic divergences
  identifySystematicDivergences(observations = this.observerData) {
    const divergences = [];
    const observerBiases = {};

    const globalMean = this._computeGlobalMean(observations);

    for (const obs of observations) {
      if (!obs.success) continue;

      const observerId = obs.observerId || `observer_${Math.random()}`;
      const value = obs.observation?.properties?.value || 0;

      if (!observerBiases[observerId]) {
        observerBiases[observerId] = [];
      }

      observerBiases[observerId].push(value - globalMean);
    }

    for (const [observerId, biases] of Object.entries(observerBiases)) {
      const avgBias = biases.reduce((a, b) => a + b, 0) / biases.length;
      const biasMagnitude = Math.abs(avgBias) / (Math.abs(globalMean) || 1);

      if (biasMagnitude > 0.05) {
        divergences.push({
          observerId,
          bias: avgBias,
          biasMagnitude,
          pattern: avgBias > 0 ? 'OPTIMISTIC' : 'PESSIMISTIC',
          confidence: Math.min(1.0, biasMagnitude),
          detail: `Observer consistently ${avgBias > 0 ? 'over' : 'under'}-reports by ${Math.abs(biasMagnitude * 100).toFixed(1)}%`
        });
      }
    }

    return Object.freeze({
      divergences,
      count: divergences.length,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Flag high uncertainty regions
  flagHighUncertaintyRegions(observations = this.observerData) {
    const regions = [];
    const observerGroups = this._groupByRegion(observations);

    for (const [region, regionObs] of Object.entries(observerGroups)) {
      const values = regionObs
        .filter((o) => o.success)
        .map((o) => o.observation?.properties?.value || 0);

      if (values.length < 2) continue;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);
      const uncertainty = stdDev / (Math.abs(mean) || 1);

      if (uncertainty > this.uncertaintyThreshold) {
        regions.push({
          region,
          uncertainty,
          stdDev,
          confidence: Math.max(0, 1.0 - uncertainty),
          level:
            uncertainty > 1.0
              ? 'EXTREME'
              : uncertainty > 0.5
                ? 'HIGH'
                : 'MODERATE',
          detail: `Coefficient of variation: ${(uncertainty * 100).toFixed(1)}%`
        });
      }
    }

    return Object.freeze({
      regions,
      count: regions.length,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Highlight consensus fragility zones
  highlightConsensusFragilityZones(observations = this.observerData) {
    const zones = [];
    const disagreementZones = this.mapObserverDisagreementZones(observations)
      .zones;

    for (const dz of disagreementZones) {
      const fragility = (1.0 - dz.agreementLevel) * 100;

      if (fragility > 10) {
        zones.push({
          region: dz.region,
          fragility,
          agreementLevel: dz.agreementLevel,
          riskOfCollapse: fragility > 30 ? 'HIGH' : 'MODERATE',
          recommendation:
            fragility > 50
              ? 'Verify observer independence'
              : 'Monitor consensus stability',
          detail: dz.detail
        });
      }
    }

    this.metrics.fragilityZonesHighlighted += zones.length;

    return Object.freeze({
      zones,
      count: zones.length,
      severity:
        zones.length === 0
          ? 'NONE'
          : zones.some((z) => z.riskOfCollapse === 'HIGH')
            ? 'CRITICAL'
            : 'WARNING',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Compute inconsistency score
  computeInconsistencyScore(observations = this.observerData) {
    const disagreementZones = this.mapObserverDisagreementZones(observations)
      .count;
    const uncertaintyRegions = this.flagHighUncertaintyRegions(observations)
      .count;
    const divergences = this.identifySystematicDivergences(observations).count;
    const fragilityZones = this.highlightConsensusFragilityZones(observations)
      .count;

    const totalIssues =
      disagreementZones +
      uncertaintyRegions +
      divergences +
      fragilityZones;

    const inconsistencyScore = Math.min(1.0, totalIssues / 100);

    return Object.freeze({
      score: inconsistencyScore,
      level:
        inconsistencyScore < 0.1
          ? 'LOW'
          : inconsistencyScore < 0.3
            ? 'MODERATE'
            : inconsistencyScore < 0.7
              ? 'HIGH'
              : 'SEVERE',
      contributors: {
        disagreementZones,
        uncertaintyRegions,
        systematicDivergences: divergences,
        fragilityZones
      },
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get fragility level (for metrics)
  getFragilityLevel(observations = this.observerData) {
    const fragilityZones = this.highlightConsensusFragilityZones(observations);
    const avgFragility =
      fragilityZones.zones.length > 0
        ? fragilityZones.zones.reduce((sum, z) => sum + z.fragility, 0) /
          fragilityZones.zones.length
        : 0;

    return avgFragility;
  }

  // Get inconsistency map
  getInconsistencyMap(observations = this.observerData) {
    const disagreement = this.mapObserverDisagreementZones(observations);
    const divergences = this.identifySystematicDivergences(observations);
    const uncertainty = this.flagHighUncertaintyRegions(observations);
    const fragility = this.highlightConsensusFragilityZones(observations);
    const inconsistency = this.computeInconsistencyScore(observations);

    return Object.freeze({
      disagreementZones: disagreement.count,
      systematicDivergences: divergences.count,
      uncertaintyRegions: uncertainty.count,
      fragilityZones: fragility.count,
      inconsistencyScore: inconsistency.score,
      level: inconsistency.level,
      severity: disagreement.severity,
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
  _groupByRegion(observations) {
    const groups = {};

    for (const obs of observations) {
      if (!obs.success) continue;

      const region = obs.region || obs.observerId || 'default';

      if (!groups[region]) {
        groups[region] = [];
      }

      groups[region].push(obs);
    }

    return groups;
  }

  _computeObserverAgreementLevel(observations) {
    const values = observations
      .filter((o) => o.success)
      .map((o) => o.observation?.properties?.value || 0);

    if (values.length === 0) return 1.0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const agreeing = values.filter(
      (v) => Math.abs(v - mean) / (Math.abs(mean) || 1) < 0.1
    ).length;

    return agreeing / values.length;
  }

  _computeGlobalMean(observations) {
    const validObs = observations.filter((o) => o.success);

    if (validObs.length === 0) return 0;

    const sum = validObs.reduce((acc, obs) => {
      const value = obs.observation?.properties?.value || 0;
      return acc + value;
    }, 0);

    return sum / validObs.length;
  }
}

// Freeze class
Object.freeze(RealityInconsistencyMapper);
Object.freeze(RealityInconsistencyMapper.prototype);

module.exports = {
  RealityInconsistencyMapper
};
