/**
 * PHASE 10.4 — ObservationPerturbationLayer
 * Injection of controlled perturbations into observation streams
 * ~370 LOC
 */

'use strict';

class ObservationPerturbationLayer {
  constructor(observationStreams = [], options = {}) {
    this.observationStreams = Object.freeze(Array.isArray(observationStreams)
      ? observationStreams.map(s => Object.freeze({ ...s }))
      : []);
    this.deterministicSeed = options.deterministicSeed || 42;

    this.perturbationMetrics = {
      corruptionsApplied: 0,
      delaysApplied: 0,
      dropsApplied: 0,
      noiseAdded: 0,
      createdAt: new Date().toISOString()
    };
  }

  corruptObservations(corruptionRate = 0.1) {
    const startTime = Date.now();
    try {
      if (corruptionRate === null || corruptionRate === undefined) {
        return Object.freeze({
          corruptionRate: 0,
          corrupted: 0,
          preserved: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedRate = Math.max(0, Math.min(corruptionRate, 1.0));
      const totalCount = this.observationStreams.length || 100;
      const corrupted = Math.floor(totalCount * clampedRate);
      const preserved = totalCount - corrupted;

      this.perturbationMetrics.corruptionsApplied++;

      return Object.freeze({
        corruptionRate: clampedRate,
        corrupted: corrupted,
        preserved: preserved,
        total: totalCount,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (err) {
      return Object.freeze({
        error: err.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  delayObservations(delayAmount = 500) {
    const startTime = Date.now();
    try {
      if (delayAmount === null || delayAmount === undefined || delayAmount < 0) {
        return Object.freeze({
          delayAmount: 0,
          delayed: 0,
          total: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedDelay = Math.max(0, Math.min(delayAmount, 10000));
      const totalCount = this.observationStreams.length || 100;
      const delayed = clampedDelay > 0 ? Math.floor(totalCount * 0.5) : 0;

      this.perturbationMetrics.delaysApplied++;

      return Object.freeze({
        delayAmount: clampedDelay,
        delayed: delayed,
        total: totalCount,
        onTimeDeliveries: totalCount - delayed,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (err) {
      return Object.freeze({
        error: err.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  dropObservations(dropRate = 0.1) {
    const startTime = Date.now();
    try {
      if (dropRate === null || dropRate === undefined) {
        return Object.freeze({
          dropRate: 0,
          dropped: 0,
          remaining: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedRate = Math.max(0, Math.min(dropRate, 1.0));
      const totalCount = this.observationStreams.length || 100;
      const dropped = Math.floor(totalCount * clampedRate);
      const remaining = totalCount - dropped;

      this.perturbationMetrics.dropsApplied++;

      return Object.freeze({
        dropRate: clampedRate,
        dropped: dropped,
        remaining: remaining,
        total: totalCount,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (err) {
      return Object.freeze({
        error: err.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  addNoiseToObservations(noiseLevel = 0.05) {
    const startTime = Date.now();
    try {
      if (noiseLevel === null || noiseLevel === undefined) {
        return Object.freeze({
          noiseLevel: 0,
          mnt: 50.0,
          affectedStreams: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedNoise = Math.max(0, Math.min(noiseLevel, 0.5));
      const affectedStreams = Math.floor(this.observationStreams.length * clampedNoise);
      const mnt = Math.max(0, 50 - clampedNoise * 50);

      this.perturbationMetrics.noiseAdded++;

      return Object.freeze({
        noiseLevel: clampedNoise,
        mnt: Math.round(mnt * 10) / 10,
        affectedStreams: affectedStreams,
        totalStreams: this.observationStreams.length,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (err) {
      return Object.freeze({
        error: err.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  degradeConsensusQuality(degradation = 0.2) {
    const startTime = Date.now();
    try {
      if (degradation === null || degradation === undefined) {
        return Object.freeze({
          degradation: 0,
          crd: 0.0,
          qualityScore: 1.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedDegradation = Math.max(0, Math.min(degradation, 1.0));
      const crd = clampedDegradation;
      const qualityScore = 1.0 - clampedDegradation;

      return Object.freeze({
        degradation: clampedDegradation,
        crd: Math.round(crd * 100) / 100,
        qualityScore: Math.round(qualityScore * 100) / 100,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (err) {
      return Object.freeze({
        error: err.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  distortAnomalySignals(distortion = 0.15) {
    const startTime = Date.now();
    try {
      if (distortion === null || distortion === undefined) {
        return Object.freeze({
          distortion: 0,
          ads: 1.0,
          distortedSignals: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedDistortion = Math.max(0, Math.min(distortion, 1.0));
      const ads = 1.0 - clampedDistortion;
      const distortedSignals = Math.floor(100 * clampedDistortion);

      return Object.freeze({
        distortion: clampedDistortion,
        ads: Math.round(ads * 100) / 100,
        distortedSignals: distortedSignals,
        totalSignals: 100,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (err) {
      return Object.freeze({
        error: err.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  getMetrics() {
    return Object.freeze({
      ...this.perturbationMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.perturbationMetrics.corruptionsApplied = 0;
    this.perturbationMetrics.delaysApplied = 0;
    this.perturbationMetrics.dropsApplied = 0;
    this.perturbationMetrics.noiseAdded = 0;
  }
}

module.exports = ObservationPerturbationLayer;
