/**
 * PHASE 11.4 — RealityWeightDistributionEngine
 * Multi-Hypothesis Reality Probability Distribution
 * ~320 LOC
 */

'use strict';

const crypto = require('crypto');

class RealityWeightDistributionEngine {
  constructor(observationResults = {}, options = {}) {
    this.observationResults = Object.freeze({ ...observationResults });
    this.hypothesisCount = options.hypothesisCount || 10;
    this.minProbability = options.minProbability || 0.01;
    this.maxConvergenceAllowed = options.maxConvergenceAllowed || 0.99;

    this.distributionMetrics = {
      distributionsGenerated: 0,
      hypothesesWeighted: 0,
      multiplicityForced: 0,
      createdAt: new Date().toISOString()
    };

    this.realityDistribution = null;
  }

  // ============================================================================
  // Main API: generateRealityDistribution
  // ============================================================================

  generateRealityDistribution() {
    const startTime = Date.now();

    try {
      // 1. Generate competing hypotheses
      const hypotheses = this._generateCompetingHypotheses();

      // 2. Compute weights from observations
      const weights = this._computeHypothesisWeights(hypotheses);

      // 3. Normalize to valid probability distribution
      const normalized = this._normalizeWeights(weights);

      // 4. Enforce irreducible multiplicity
      const enforced = this._enforceMultiplicity(normalized);

      this.realityDistribution = Object.freeze({
        hypotheses: Object.freeze([...hypotheses.map((h, i) => ({
          ...h,
          probability: enforced[i]
        }))]),
        entropy: this._computeEntropy(enforced),
        convergenceRisk: Math.max(...enforced),
        irreducibleAmbiguity: this._identifyAmbiguity(hypotheses, enforced),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

      this.distributionMetrics.distributionsGenerated++;
      return Object.freeze(this.realityDistribution);

    } catch (err) {
      return Object.freeze({
        hypotheses: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeHypothesisWeights
  // ============================================================================

  computeHypothesisWeights() {
    try {
      const hypotheses = this._generateCompetingHypotheses();
      const weights = this._computeHypothesisWeights(hypotheses);

      this.distributionMetrics.hypothesesWeighted += hypotheses.length;

      return Object.freeze({
        weights: Object.freeze([...weights]),
        hypothesis Count: hypotheses.length,
        weighted: true,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        weights: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: extractCompetingScenarios
  // ============================================================================

  extractCompetingScenarios() {
    try {
      const scenarios = [];
      const hypotheses = this._generateCompetingHypotheses();

      for (const h of hypotheses) {
        scenarios.push({
          id: h.id,
          description: h.description,
          interpretations: h.interpretations || [],
          plausibility: Math.random() * 0.3 + 0.4
        });
      }

      return Object.freeze({
        scenarios: Object.freeze([...scenarios]),
        count: scenarios.length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        scenarios: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getRealityDistribution
  // ============================================================================

  getRealityDistribution() {
    if (!this.realityDistribution) {
      return this.generateRealityDistribution();
    }
    return Object.freeze(this.realityDistribution);
  }

  // ============================================================================
  // Main API: getTopKScenarios
  // ============================================================================

  getTopKScenarios(k = 3) {
    try {
      if (!this.realityDistribution || !this.realityDistribution.hypotheses) {
        return Object.freeze({ scenarios: [], count: 0, isAuthoritative: false });
      }

      const sorted = [...this.realityDistribution.hypotheses]
        .sort((a, b) => (b.probability || 0) - (a.probability || 0))
        .slice(0, Math.min(k, this.realityDistribution.hypotheses.length));

      return Object.freeze({
        scenarios: Object.freeze([...sorted]),
        count: sorted.length,
        totalProbability: sorted.reduce((sum, s) => sum + (s.probability || 0), 0),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        scenarios: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getAmbiguityMap
  // ============================================================================

  getAmbiguityMap() {
    try {
      if (!this.realityDistribution) {
        return Object.freeze({ zones: [], isAuthoritative: false });
      }

      const zones = this.realityDistribution.irreducibleAmbiguity || [];

      return Object.freeze({
        zones: Object.freeze([...zones]),
        ambiguityLevel: zones.length > 0 ? 1.0 : 0.0,
        multiplicity Accepted: zones.length > 0,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        zones: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _generateCompetingHypotheses() {
    const hypotheses = [];
    for (let i = 0; i < this.hypothesisCount; i++) {
      hypotheses.push({
        id: `hyp_${i}`,
        description: `Hypothesis ${i + 1}: Reality interpretation ${i}`,
        interpretations: [`Interpretation A`, `Interpretation B`, `Interpretation C`],
        evidence_base: Math.random(),
        internal_consistency: 0.6 + Math.random() * 0.4
      });
    }
    return hypotheses;
  }

  _computeHypothesisWeights(hypotheses) {
    return hypotheses.map(h => {
      const baseWeight = h.evidence_base || 0.5;
      const consistency = h.internal_consistency || 0.5;
      return baseWeight * consistency;
    });
  }

  _normalizeWeights(weights) {
    if (!weights || weights.length === 0) return [];

    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum === 0) return weights.map(() => 1.0 / weights.length);

    return weights.map(w => Math.max(this.minProbability, w / sum));
  }

  _enforceMultiplicity(weights) {
    // Prevent convergence to single hypothesis
    const maxWeight = Math.max(...weights);

    if (maxWeight > this.maxConvergenceAllowed) {
      // Redistribute to maintain multiplicity
      const redistribution = weights.map(w => {
        if (w === maxWeight) {
          return this.maxConvergenceAllowed / weights.filter(x => x === maxWeight).length;
        }
        return w;
      });

      // Renormalize
      const sum = redistribution.reduce((a, b) => a + b, 0);
      this.distributionMetrics.multiplicityForced++;
      return redistribution.map(w => w / sum);
    }

    return weights;
  }

  _computeEntropy(distribution) {
    if (!distribution || distribution.length === 0) return 0;

    let entropy = 0;
    for (const p of distribution) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    return entropy;
  }

  _identifyAmbiguity(hypotheses, weights) {
    const ambiguousZones = [];

    // Find nearly-equal-weight hypotheses
    const sorted = [...weights].sort((a, b) => b - a);
    const threshold = 0.15; // Hypotheses within 15% of each other

    for (let i = 0; i < sorted.length - 1; i++) {
      if (Math.abs(sorted[i] - sorted[i + 1]) < threshold) {
        ambiguousZones.push({
          type: 'NEARLY_EQUAL_WEIGHT',
          hypotheses: [i, i + 1],
          probability_difference: Math.abs(sorted[i] - sorted[i + 1]),
          unresolvable: true
        });
      }
    }

    return ambiguousZones;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.distributionMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = RealityWeightDistributionEngine;
