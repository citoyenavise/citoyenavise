/**
 * PHASE 11.4 — ProbabilisticTruthScorer
 * Hypothesis Plausibility Assignment
 * ~300 LOC
 */

'use strict';

class ProbabilisticTruthScorer {
  constructor(hypotheses = [], observations = {}, options = {}) {
    this.hypotheses = Object.freeze([...hypotheses]);
    this.observations = Object.freeze({ ...observations });
    this.scoreThreshold = options.scoreThreshold || 0.01;

    this.scoringMetrics = {
      scoringsPerformed: 0,
      hypothesesEvaluated: 0,
      createdAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // Main API: scoreHypothesisLikelihood
  // ============================================================================

  scoreHypothesisLikelihood(hypothesis) {
    try {
      if (!hypothesis) {
        return Object.freeze({ score: 0, isAuthoritative: false });
      }

      // P(observations | hypothesis)
      const score = this._computeBayesianScore(hypothesis);

      this.scoringMetrics.scoringsPerformed++;

      return Object.freeze({
        hypothesisId: hypothesis.id || 'unknown',
        score: Math.max(this.scoreThreshold, score),
        likelihood: score > 0.5 ? 'HIGH' : score > 0.2 ? 'MEDIUM' : 'LOW',
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        score: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeRelativePlausibility
  // ============================================================================

  computeRelativePlausibility() {
    try {
      const scores = this.hypotheses.map(h => this._computeBayesianScore(h));
      const sorted = scores.map((s, i) => ({ hyp_index: i, score: s }))
        .sort((a, b) => b.score - a.score);

      this.scoringMetrics.hypothesesEvaluated += this.hypotheses.length;

      return Object.freeze({
        ranking: Object.freeze([...sorted]),
        most_plausible: this.hypotheses[sorted[0].hyp_index] || null,
        score_range: {
          min: Math.min(...scores),
          max: Math.max(...scores),
          spread: Math.max(...scores) - Math.min(...scores)
        },
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        ranking: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: normalizeDistribution
  // ============================================================================

  normalizeDistribution() {
    try {
      const scores = this.hypotheses.map(h => this._computeBayesianScore(h));
      const sum = scores.reduce((a, b) => a + b, 0);

      if (sum === 0) {
        const uniform = 1.0 / this.hypotheses.length;
        return Object.freeze({
          distribution: Object.freeze(this.hypotheses.map(() => uniform)),
          normalized: true,
          sum_to_one: true,
          isAuthoritative: false
        });
      }

      const normalized = scores.map(s => Math.max(this.scoreThreshold, s / sum));
      const renorm_sum = normalized.reduce((a, b) => a + b, 0);
      const final = normalized.map(n => n / renorm_sum);

      return Object.freeze({
        distribution: Object.freeze([...final]),
        normalized: true,
        sum_to_one: Math.abs(final.reduce((a, b) => a + b, 0) - 1.0) < 0.01,
        all_positive: final.every(p => p > 0),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        distribution: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeEntropyOfScores
  // ============================================================================

  computeEntropyOfScores() {
    try {
      const normalized = this.normalizeDistribution();
      const dist = normalized.distribution || [];

      let entropy = 0;
      for (const p of dist) {
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }

      const maxEntropy = Math.log2(this.hypotheses.length || 1);
      const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

      return Object.freeze({
        entropy: entropy,
        max_entropy: maxEntropy,
        normalized_entropy: normalizedEntropy,
        spread_type: normalizedEntropy > 0.8 ? 'UNIFORM' : normalizedEntropy > 0.4 ? 'DISPERSED' : 'CONCENTRATED',
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        entropy: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: measureScoringDisagreement
  // ============================================================================

  measureScoringDisagreement(otherScores = []) {
    try {
      const myScores = this.hypotheses.map(h => this._computeBayesianScore(h));

      if (!otherScores || otherScores.length === 0) {
        return Object.freeze({
          disagreement: 0,
          isAuthoritative: false
        });
      }

      let disagreement = 0;
      for (let i = 0; i < Math.min(myScores.length, otherScores.length); i++) {
        disagreement += Math.abs(myScores[i] - (otherScores[i] || 0));
      }

      const avgDisagreement = disagreement / Math.max(myScores.length, otherScores.length);

      return Object.freeze({
        disagreement_level: Math.min(avgDisagreement, 1.0),
        agreement_level: 1.0 - Math.min(avgDisagreement, 1.0),
        large_divergence: avgDisagreement > 0.3,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        disagreement_level: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _computeBayesianScore(hypothesis) {
    if (!hypothesis) return 0;

    const prior = 1.0 / this.hypotheses.length;
    const likelihood = (hypothesis.evidence_base || 0.5) * (hypothesis.internal_consistency || 0.5);
    const score = prior * likelihood;

    return Math.max(this.scoreThreshold, score);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.scoringMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = ProbabilisticTruthScorer;
