/**
 * PHASE 10.3 — SystemForecastingCore
 * Aggregated Predictions & Ensemble Forecasting
 * ~350 LOC
 */

'use strict';

class SystemForecastingCore {
  constructor(allModules = {}, options = {}) {
    this.modules = {
      predictiveEngine: allModules.predictiveEngine || null,
      futureSimulator: allModules.futureSimulator || null,
      causalModel: allModules.causalModel || null,
      evolutionGraph: allModules.evolutionGraph || null
    };

    this.confidenceLevel = options.confidenceLevel || 0.95;
    this.ensembleWeight = options.ensembleWeight || { equal: true };
    this.aggregationMethod = options.aggregationMethod || 'weighted_mean';

    this.forecastMetrics = {
      forecastsComputed: 0,
      ensembleAggregations: 0,
      calibrationsPerformed: 0,
      createdAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // Main API: aggregateForecasts
  // ============================================================================

  aggregateForecasts(horizon = 86400000) {
    const startTime = Date.now();

    try {
      // Collect forecasts from each module
      const forecasts = [];

      if (this.modules.predictiveEngine) {
        const peForecast = this.modules.predictiveEngine.projectSystemEvolution(horizon);
        if (peForecast && peForecast.aggregateUncertainty !== undefined) {
          forecasts.push({
            source: 'predictiveEngine',
            uncertainty: peForecast.aggregateUncertainty,
            confidence: 1.0 - peForecast.aggregateUncertainty,
            trajectoryCount: peForecast.projectionCount
          });
        }
      }

      if (this.modules.causalModel) {
        const cmForecast = this.modules.causalModel.computeFutureCausalCoherence(horizon);
        if (cmForecast && cmForecast.coherenceScore !== undefined) {
          forecasts.push({
            source: 'causalModel',
            uncertainty: 1.0 - cmForecast.coherenceScore,
            confidence: cmForecast.coherenceScore,
            resilience: cmForecast.resilience
          });
        }
      }

      if (this.modules.evolutionGraph) {
        const egForecast = this.modules.evolutionGraph.computePathDivergence();
        if (egForecast && egForecast.averageDivergence !== undefined) {
          forecasts.push({
            source: 'evolutionGraph',
            uncertainty: egForecast.averageDivergence,
            confidence: 1.0 - egForecast.averageDivergence,
            divergence: egForecast.averageDivergence
          });
        }
      }

      // Aggregate
      const aggregated = this._aggregateForecastsList(forecasts);

      this.forecastMetrics.forecastsComputed++;

      return Object.freeze({
        horizon: horizon,
        sourceCount: forecasts.length,
        aggregatedUncertainty: aggregated.uncertainty,
        aggregatedConfidence: aggregated.confidence,
        forecastConsistency: this._computeConsistency(forecasts),
        sources: Object.freeze([...forecasts]),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        horizon: horizon,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeEnsembleDistribution
  // ============================================================================

  computeEnsembleDistribution(horizon = 86400000) {
    const startTime = Date.now();

    try {
      // Collect distributions from modules
      const distributions = [];

      if (this.modules.futureSimulator) {
        const fsDistribution = this.modules.futureSimulator.computeStateDistribution(horizon);
        if (fsDistribution && fsDistribution.quantiles) {
          distributions.push({
            source: 'futureSimulator',
            mean: fsDistribution.mean || 0.5,
            std: fsDistribution.std || 0.1,
            quantiles: fsDistribution.quantiles
          });
        }
      }

      if (this.modules.evolutionGraph) {
        const egDistribution = this.modules.evolutionGraph.getScenarioDistribution();
        if (egDistribution && egDistribution.scenarioProbabilities) {
          const values = Object.values(egDistribution.scenarioProbabilities);
          distributions.push({
            source: 'evolutionGraph',
            mean: values.reduce((a, b) => a + b, 0) / values.length,
            std: 0.15,
            distribution: egDistribution.scenarioProbabilities
          });
        }
      }

      // Ensemble distribution
      const ensemble = this._computeEnsembleDistributions(distributions);

      this.forecastMetrics.ensembleAggregations++;

      return Object.freeze({
        horizon: horizon,
        ensembleMean: ensemble.mean,
        ensembleStd: ensemble.std,
        quantiles: Object.freeze({ ...ensemble.quantiles }),
        confidenceLevel: this.confidenceLevel,
        sourceCount: distributions.length,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        horizon: horizon,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: quantifyUncertainty
  // ============================================================================

  quantifyUncertainty(horizon = 86400000) {
    try {
      const aggregated = this.aggregateForecasts(horizon);

      return Object.freeze({
        horizon: horizon,
        uncertainty: aggregated.aggregatedUncertainty || 0.5,
        confidence: aggregated.aggregatedConfidence || 0.5,
        confidenceLevel: this.confidenceLevel,
        bounds: {
          lower: Math.max(0, (aggregated.aggregatedConfidence || 0.5) - 0.2),
          upper: Math.min(1, (aggregated.aggregatedConfidence || 0.5) + 0.2)
        },
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        uncertainty: 0.5,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeForecastConfidence
  // ============================================================================

  computeForecastConfidence(horizon = 86400000) {
    const startTime = Date.now();

    try {
      const aggregated = this.aggregateForecasts(horizon);
      const consistency = aggregated.forecastConsistency || 0.5;

      const confidence = {
        baseConfidence: aggregated.aggregatedConfidence || 0.5,
        consistencyBoost: consistency * 0.2,
        finalConfidence: Math.min(1.0, (aggregated.aggregatedConfidence || 0.5) + (consistency * 0.2)),
        sourceCount: aggregated.sourceCount || 1,
        reliability: consistency > 0.7 ? 'HIGH' : consistency > 0.4 ? 'MEDIUM' : 'LOW'
      };

      this.forecastMetrics.calibrationsPerformed++;

      return Object.freeze({
        ...confidence,
        horizon: horizon,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        finalConfidence: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: estimatePredictionError
  // ============================================================================

  estimatePredictionError(horizon = 86400000) {
    try {
      const aggregated = this.aggregateForecasts(horizon);
      const consistency = aggregated.forecastConsistency || 0.5;

      // Estimate error from uncertainty and consistency
      const baseError = aggregated.aggregatedUncertainty || 0.5;
      const inconsistencyError = (1.0 - consistency) * 0.2;
      const totalError = baseError + inconsistencyError;

      return Object.freeze({
        horizon: horizon,
        baseError: baseError,
        inconsistencyError: inconsistencyError,
        totalError: Math.min(totalError, 1.0),
        errorBounds: {
          lower: Math.max(0, totalError - 0.2),
          upper: Math.min(1, totalError + 0.2)
        },
        reliability: 1.0 - totalError,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        totalError: 0.5,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: validateForecastConsistency
  // ============================================================================

  validateForecastConsistency(horizon = 86400000) {
    try {
      const aggregated = this.aggregateForecasts(horizon);

      return Object.freeze({
        horizon: horizon,
        consistency: aggregated.forecastConsistency || 0.5,
        isConsistent: (aggregated.forecastConsistency || 0.5) > 0.7,
        sourceAgreement: this._computeSourceAgreement(aggregated.sources || []),
        conflicts: this._identifyConflicts(aggregated.sources || []),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        consistency: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getFutureStateDistribution
  // ============================================================================

  getFutureStateDistribution(horizon = 86400000) {
    try {
      const ensemble = this.computeEnsembleDistribution(horizon);

      return Object.freeze({
        horizon: horizon,
        mean: ensemble.ensembleMean,
        std: ensemble.ensembleStd,
        quantiles: ensemble.quantiles,
        confidenceLevel: this.confidenceLevel,
        distributionType: 'GAUSSIAN',
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        horizon: horizon,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getConfidenceBounds
  // ============================================================================

  getConfidenceBounds(quantile = 0.95) {
    try {
      if (quantile < 0 || quantile > 1) {
        return Object.freeze({
          quantile: quantile,
          error: 'Invalid quantile',
          isAuthoritative: false
        });
      }

      const distribution = this.computeEnsembleDistribution();
      const mean = distribution.ensembleMean || 0.5;
      const std = distribution.ensembleStd || 0.1;

      // z-score for quantile
      const zScore = this._computeZScore(quantile);
      const margin = zScore * std;

      return Object.freeze({
        quantile: quantile,
        lower: Math.max(0, mean - margin),
        upper: Math.min(1, mean + margin),
        margin: margin,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        quantile: quantile,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _aggregateForecastsList(forecasts) {
    if (!forecasts || forecasts.length === 0) {
      return { uncertainty: 0.5, confidence: 0.5 };
    }

    const uncertainties = forecasts.map(f => f.uncertainty || 0.5);
    const avgUncertainty = uncertainties.reduce((a, b) => a + b, 0) / uncertainties.length;

    return {
      uncertainty: avgUncertainty,
      confidence: 1.0 - avgUncertainty
    };
  }

  _computeConsistency(forecasts) {
    if (!forecasts || forecasts.length < 2) return 1.0;

    const uncertainties = forecasts.map(f => f.uncertainty || 0.5);
    const mean = uncertainties.reduce((a, b) => a + b, 0) / uncertainties.length;
    const variance = uncertainties.reduce((sum, u) => sum + Math.pow(u - mean, 2), 0) / uncertainties.length;
    const std = Math.sqrt(variance);

    return Math.max(0, 1.0 - std);
  }

  _computeEnsembleDistributions(distributions) {
    if (!distributions || distributions.length === 0) {
      return { mean: 0.5, std: 0.1, quantiles: {} };
    }

    const means = distributions.map(d => d.mean || 0.5);
    const stds = distributions.map(d => d.std || 0.1);

    const ensembleMean = means.reduce((a, b) => a + b, 0) / means.length;
    const ensembleStd = Math.sqrt(stds.reduce((sum, s) => sum + s * s, 0) / stds.length);

    return {
      mean: ensembleMean,
      std: ensembleStd,
      quantiles: {
        '0.05': Math.max(0, ensembleMean - 1.645 * ensembleStd),
        '0.25': Math.max(0, ensembleMean - 0.674 * ensembleStd),
        '0.50': ensembleMean,
        '0.75': Math.min(1, ensembleMean + 0.674 * ensembleStd),
        '0.95': Math.min(1, ensembleMean + 1.645 * ensembleStd)
      }
    };
  }

  _computeSourceAgreement(sources) {
    if (!sources || sources.length < 2) return 1.0;
    return this._computeConsistency(sources);
  }

  _identifyConflicts(sources) {
    const conflicts = [];
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const diff = Math.abs((sources[i].uncertainty || 0.5) - (sources[j].uncertainty || 0.5));
        if (diff > 0.3) {
          conflicts.push({
            source1: sources[i].source,
            source2: sources[j].source,
            divergence: diff
          });
        }
      }
    }
    return conflicts;
  }

  _computeZScore(quantile) {
    // Approximation for z-score
    if (quantile >= 0.975) return 1.96;
    if (quantile >= 0.95) return 1.645;
    if (quantile >= 0.90) return 1.282;
    if (quantile >= 0.84) return 0.994;
    if (quantile >= 0.75) return 0.674;
    if (quantile === 0.50) return 0;
    return 1.96;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.forecastMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = SystemForecastingCore;
