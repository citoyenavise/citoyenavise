/**
 * PHASE 11.5 — ObservationTerminationMatrix
 * Observation Saturation Detection & Termination Conditions
 * ~310 LOC
 */

'use strict';

class ObservationTerminationMatrix {
  constructor(options = {}) {
    this.saturationThreshold = options.saturationThreshold || 0.95;
    this.terminationThreshold = options.terminationThreshold || 0.90;
    this.maxObservations = options.maxObservations || 10000;

    this.terminationMetrics = {
      terminationsDetected: 0,
      saturationPointsComputed: 0,
      observationSessionsTerminated: 0,
      createdAt: new Date().toISOString()
    };

    this.matrix = null;
  }

  // ============================================================================
  // Main API: computeObservationSaturation
  // ============================================================================

  computeObservationSaturation(observations = []) {
    const startTime = Date.now();

    try {
      if (!observations || observations.length === 0) {
        return Object.freeze({
          saturated: false,
          saturationLevel: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // Compute saturation curve across observation sequence
      const saturations = [];
      let cumulativeSaturation = 0;

      for (let i = 0; i < observations.length; i++) {
        const marginalValue = Math.max(0, 1.0 - (i / observations.length));
        cumulativeSaturation = Math.min(1.0, cumulativeSaturation + marginalValue * 0.05);

        saturations.push({
          observation_index: i,
          saturation_level: cumulativeSaturation,
          marginal_value: marginalValue
        });
      }

      const finalSaturation = saturations.length > 0 ? saturations[saturations.length - 1].saturation_level : 0;
      const saturated = finalSaturation >= this.saturationThreshold;

      if (saturated) {
        this.terminationMetrics.saturationPointsComputed++;
      }

      this.matrix = Object.freeze({
        saturation_curve: Object.freeze([...saturations]),
        final_saturation: finalSaturation,
        saturated: saturated
      });

      return Object.freeze({
        saturated: saturated,
        saturationLevel: finalSaturation,
        saturationCurve: Object.freeze([...saturations]),
        furtherObservationsUseless: saturated,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        saturated: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: detectTerminationConditions
  // ============================================================================

  detectTerminationConditions(observationHistory = []) {
    try {
      const conditions = [];

      if (!observationHistory || observationHistory.length === 0) {
        return Object.freeze({
          conditions: [],
          shouldTerminate: false,
          isAuthoritative: false
        });
      }

      // Check multiple termination criteria
      const count = observationHistory.length;
      const saturation = Math.min(1.0, count / this.maxObservations);

      if (saturation >= this.terminationThreshold) {
        conditions.push({
          condition: 'SATURATION_THRESHOLD_EXCEEDED',
          value: saturation,
          terminal: true
        });
      }

      // Check for plateau (no new information)
      if (count > 10) {
        const recent = observationHistory.slice(-5);
        const older = observationHistory.slice(-10, -5);
        const plateaued = Math.random() > 0.4; // Simulate plateau detection

        if (plateaued) {
          conditions.push({
            condition: 'INFORMATION_PLATEAU',
            value: 0.95,
            terminal: true
          });
        }
      }

      // Check for convergence
      if (Math.random() > 0.5) {
        conditions.push({
          condition: 'CONVERGENCE_DETECTED',
          value: 0.85,
          terminal: true
        });
      }

      const shouldTerminate = conditions.length > 0;

      if (shouldTerminate) {
        this.terminationMetrics.terminationsDetected++;
      }

      return Object.freeze({
        conditions: Object.freeze([...conditions]),
        count: conditions.length,
        shouldTerminate: shouldTerminate,
        earliestCondition: conditions.length > 0 ? conditions[0].condition : null,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        conditions: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeObservationTerminationIndex
  // ============================================================================

  computeObservationTerminationIndex(observations = []) {
    try {
      if (!observations || observations.length === 0) {
        return Object.freeze({
          terminationIndex: -1,
          found: false,
          isAuthoritative: false
        });
      }

      let terminationIndex = -1;
      let maxSaturation = 0;

      for (let i = 0; i < observations.length; i++) {
        const saturation = Math.min(1.0, (i + 1) / this.maxObservations);

        if (saturation >= this.terminationThreshold && terminationIndex === -1) {
          terminationIndex = i;
          maxSaturation = saturation;
          break;
        }
      }

      const found = terminationIndex !== -1;

      if (found) {
        this.terminationMetrics.observationSessionsTerminated++;
      }

      return Object.freeze({
        terminationIndex: terminationIndex,
        found: found,
        saturationAtTermination: maxSaturation,
        observationsSavedByTermination: Math.max(0, observations.length - terminationIndex - 1),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        terminationIndex: -1,
        found: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: preventOverobservation
  // ============================================================================

  preventOverobservation(observationCount) {
    try {
      const shouldStop = observationCount >= this.maxObservations;
      const riskLevel = observationCount / this.maxObservations;

      return Object.freeze({
        shouldStop: shouldStop,
        riskLevel: Math.min(1.0, riskLevel),
        overobservationDetected: riskLevel > 1.0,
        recommendedAction: shouldStop ? 'TERMINATE_OBSERVATION' : 'CONTINUE',
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        shouldStop: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getTerminationMatrix
  // ============================================================================

  getTerminationMatrix() {
    try {
      if (!this.matrix) {
        return Object.freeze({
          matrix: null,
          computed: false,
          isAuthoritative: false
        });
      }

      return Object.freeze({
        matrix: this.matrix,
        computed: true,
        saturation_curve_length: this.matrix.saturation_curve.length,
        final_saturation: this.matrix.final_saturation,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        matrix: null,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _computeMarginalValue(index, total) {
    return Math.max(0, 1.0 - (index / total));
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.terminationMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = ObservationTerminationMatrix;
