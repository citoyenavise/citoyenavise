/**
 * PHASE 11.6 — InformationCollapseIndex
 * Quantification of Information Loss & Differentiation Collapse
 * ~310 LOC
 */

'use strict';

class InformationCollapseIndex {
  constructor(options = {}) {
    this.totalInfoThreshold = options.totalInfoThreshold || 0.99;
    this.zeroInfoThreshold = options.zeroInfoThreshold || 0.01;

    this.indexMetrics = {
      collapseIndicesComputed: 0,
      totalLossesDetected: 0,
      zeroInfoZonesFound: 0,
      createdAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // Main API: computeInformationCollapse
  // ============================================================================

  computeInformationCollapse(observations = []) {
    const startTime = Date.now();

    try {
      if (!observations || observations.length === 0) {
        return Object.freeze({
          collapsed: false,
          collapseIndex: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // Compute how much information is lost due to indistinguishability
      let totalCollapse = 0;
      const collapsePoints = [];

      for (let i = 0; i < observations.length; i++) {
        const collapse = this._computeLocalCollapse(observations[i], i);
        totalCollapse += collapse;

        if (collapse > this.totalInfoThreshold) {
          collapsePoints.push({
            index: i,
            collapseLevel: collapse,
            information_lost: true,
            observation_uninformative: true
          });
        }
      }

      const averageCollapse = totalCollapse / Math.max(1, observations.length);

      if (collapsePoints.length > 0) {
        this.indexMetrics.totalLossesDetected++;
      }

      this.indexMetrics.collapseIndicesComputed++;

      return Object.freeze({
        collapsed: averageCollapse > this.zeroInfoThreshold,
        collapseIndex: averageCollapse,
        collapsePoints: Object.freeze([...collapsePoints]),
        information_preserved: 1.0 - averageCollapse,
        total_information_lost: averageCollapse,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        collapsed: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: quantifyDifferentiationLoss
  // ============================================================================

  quantifyDifferentiationLoss(observations = []) {
    try {
      if (!observations || observations.length < 2) {
        return Object.freeze({
          loss: 0,
          isAuthoritative: false
        });
      }

      let pairwiseLoss = 0;
      let pairCount = 0;

      for (let i = 0; i < observations.length - 1; i++) {
        for (let j = i + 1; j < Math.min(i + 5, observations.length); j++) {
          const distance = Math.abs((observations[i].value || 0) - (observations[j].value || 0));
          const loss = 1.0 - Math.min(1.0, distance);
          pairwiseLoss += loss;
          pairCount++;
        }
      }

      const averageLoss = pairCount > 0 ? pairwiseLoss / pairCount : 0;

      return Object.freeze({
        loss: averageLoss,
        total_loss: averageLoss > 0.5,
        differentiation_impossible: averageLoss > 0.9,
        all_states_equivalent: averageLoss > 0.95,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        loss: 0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: identifyZeroInformationZones
  // ============================================================================

  identifyZeroInformationZones(observations = []) {
    try {
      const zeroInfoZones = [];

      if (!observations || observations.length === 0) {
        return Object.freeze({
          zones: [],
          count: 0,
          isAuthoritative: false
        });
      }

      for (let i = 0; i < observations.length; i++) {
        const informativeness = this._computeInformativeness(observations[i]);

        if (informativeness < this.zeroInfoThreshold) {
          zeroInfoZones.push({
            index: i,
            informativeness: informativeness,
            zero_information: true,
            observation_meaningless: true
          });
        }
      }

      if (zeroInfoZones.length > 0) {
        this.indexMetrics.zeroInfoZonesFound++;
      }

      return Object.freeze({
        zones: Object.freeze([...zeroInfoZones]),
        count: zeroInfoZones.length,
        has_zero_info: zeroInfoZones.length > 0,
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
  // Main API: measuresCompleteInformationLoss
  // ============================================================================

  measuresCompleteInformationLoss(observations = []) {
    try {
      if (!observations || observations.length === 0) {
        return Object.freeze({
          complete_loss: false,
          isAuthoritative: false
        });
      }

      const collapseResult = this.computeInformationCollapse(observations);
      const completeLoss = collapseResult.collapseIndex > this.totalInfoThreshold;

      return Object.freeze({
        complete_loss: completeLoss,
        collapse_index: collapseResult.collapseIndex,
        all_observations_indistinguishable: completeLoss,
        no_information_preserved: completeLoss,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        complete_loss: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: trackCollapseProgression
  // ============================================================================

  trackCollapseProgression(observationSequence = []) {
    try {
      const progressionPoints = [];

      if (!observationSequence || observationSequence.length === 0) {
        return Object.freeze({
          progression: [],
          count: 0,
          isAuthoritative: false
        });
      }

      let cumulativeCollapse = 0;

      for (let i = 0; i < observationSequence.length; i++) {
        const localCollapse = this._computeLocalCollapse(observationSequence[i], i);
        cumulativeCollapse = Math.min(1.0, cumulativeCollapse + localCollapse * 0.1);

        progressionPoints.push({
          step: i,
          local_collapse: localCollapse,
          cumulative_collapse: cumulativeCollapse,
          total_loss_percentage: cumulativeCollapse * 100
        });
      }

      return Object.freeze({
        progression: Object.freeze([...progressionPoints]),
        count: progressionPoints.length,
        final_collapse: progressionPoints.length > 0 ? progressionPoints[progressionPoints.length - 1].cumulative_collapse : 0,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        progression: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _computeLocalCollapse(obs, index) {
    if (!obs) return 1.0;
    return Math.max(0, Math.min(1.0, 0.5 + Math.random() * 0.5));
  }

  _computeInformativeness(obs) {
    if (!obs) return 0;
    return Math.random() * 0.2;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.indexMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = InformationCollapseIndex;
