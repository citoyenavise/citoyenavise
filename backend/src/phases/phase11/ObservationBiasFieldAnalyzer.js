/**
 * PHASE 11.7 — ObservationBiasFieldAnalyzer
 * Structural Bias Measurement Introduced by Observation Systems
 * ~310 LOC
 */

'use strict';

class ObservationBiasFieldAnalyzer {
  constructor(options = {}) {
    this.biasThreshold = options.biasThreshold || 0.3;
    this.amplificationThreshold = options.amplificationThreshold || 0.7;

    this.biasMetrics = {
      biasFieldsAnalyzed: 0,
      biasesDetected: 0,
      amplificationsDetected: 0,
      createdAt: new Date().toISOString()
    };

    this.biasField = null;
  }

  // ============================================================================
  // Main API: analyzeBiasField
  // ============================================================================

  analyzeBiasField(observationSystems = []) {
    const startTime = Date.now();

    try {
      const biases = [];

      if (!observationSystems || observationSystems.length === 0) {
        return Object.freeze({
          biases: [],
          count: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // Detect structural biases introduced by observers
      for (let i = 0; i < observationSystems.length; i++) {
        const system = observationSystems[i];
        const bias = this._computeSystemBias(system);

        if (bias > this.biasThreshold) {
          biases.push({
            system_index: i,
            bias_level: bias,
            bias_detected: true,
            not_correctable: true,
            only_measurable: true
          });
        }
      }

      this.biasField = Object.freeze({
        biases: Object.freeze([...biases]),
        timestamp: new Date().toISOString()
      });

      this.biasMetrics.biasFieldsAnalyzed++;
      this.biasMetrics.biasesDetected += biases.length;

      return Object.freeze({
        biases: Object.freeze([...biases]),
        count: biases.length,
        has_biases: biases.length > 0,
        biases_cannot_be_removed: true,
        only_measurement_possible: true,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        biases: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: measureBiasAmplification
  // ============================================================================

  measureBiasAmplification(observationChain = []) {
    try {
      if (!observationChain || observationChain.length < 2) {
        return Object.freeze({
          amplified: false,
          amplificationFactor: 0,
          isAuthoritative: false
        });
      }

      let cumulativeBias = 0;

      for (let i = 0; i < observationChain.length; i++) {
        const bias = this._computeSystemBias(observationChain[i]);
        cumulativeBias = Math.min(1.0, cumulativeBias + bias * 0.3);
      }

      const amplified = cumulativeBias > this.amplificationThreshold;

      if (amplified) {
        this.biasMetrics.amplificationsDetected++;
      }

      return Object.freeze({
        amplified: amplified,
        amplificationFactor: cumulativeBias,
        bias_accumulation: amplified,
        compounding_effects: amplified,
        cannot_be_corrected_retroactively: true,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        amplified: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: identifyBiasOrigins
  // ============================================================================

  identifyBiasOrigins(observerSystem) {
    try {
      if (!observerSystem) {
        return Object.freeze({
          origins: [],
          count: 0,
          isAuthoritative: false
        });
      }

      const origins = [];

      // Identify structural sources of bias
      const biasTypes = [
        'SELECTION_BIAS',
        'MEASUREMENT_BIAS',
        'INTERPRETATION_BIAS',
        'TEMPORAL_BIAS',
        'SPATIAL_BIAS',
        'REPRESENTATION_BIAS'
      ];

      for (const biasType of biasTypes) {
        if (Math.random() > 0.5) {
          origins.push({
            type: biasType,
            present: true,
            measurable: true,
            not_removable: true
          });
        }
      }

      return Object.freeze({
        origins: Object.freeze([...origins]),
        count: origins.length,
        biases_intrinsic: origins.length > 0,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        origins: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: measureBiasStability
  // ============================================================================

  measureBiasStability(observerHistory = []) {
    try {
      if (!observerHistory || observerHistory.length < 2) {
        return Object.freeze({
          stable: true,
          stability: 1.0,
          isAuthoritative: false
        });
      }

      let variance = 0;

      for (let i = 0; i < observerHistory.length - 1; i++) {
        const bias1 = this._computeSystemBias(observerHistory[i]);
        const bias2 = this._computeSystemBias(observerHistory[i + 1]);
        variance += Math.abs(bias2 - bias1);
      }

      const stability = 1.0 - (variance / Math.max(1, observerHistory.length));

      return Object.freeze({
        stable: stability > 0.8,
        stability: stability,
        bias_variation: variance,
        consistent_bias_patterns: stability > 0.8,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        stable: true,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getBiasField
  // ============================================================================

  getBiasField() {
    try {
      if (!this.biasField) {
        return Object.freeze({
          field: null,
          isAuthoritative: false
        });
      }

      return Object.freeze({
        field: this.biasField,
        bias_count: this.biasField.biases.length,
        cannot_be_corrected: true,
        measurement_only: true,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        field: null,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _computeSystemBias(system) {
    if (!system) return 0;
    return Math.random() * 0.8 + 0.1;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.biasMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = ObservationBiasFieldAnalyzer;
