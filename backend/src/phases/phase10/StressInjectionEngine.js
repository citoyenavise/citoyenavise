/**
 * PHASE 10.4 — StressInjectionEngine
 * Deterministic stress pattern generation for resilience testing
 * ~380 LOC
 */

'use strict';

const SeededPRNG = require('./DeterministicSeedManager');

class StressInjectionEngine {
  constructor(stressProfile = {}, options = {}) {
    this.stressProfile = Object.freeze({ ...stressProfile });
    this.deterministicSeed = options.deterministicSeed || 42;
    this.maxLatency = options.maxLatency || 5000;
    this.maxLoss = options.maxLoss || 0.5;

    this._rng = new SeededPRNG(this.deterministicSeed);

    this.stressMetrics = {
      patternsGenerated: 0,
      scenariosCreated: 0,
      cascadesSimulated: 0,
      createdAt: new Date().toISOString()
    };
  }

  generateNetworkLatency(mean = 100, variance = 20) {
    const startTime = Date.now();
    try {
      if (mean === null || mean === undefined) {
        return Object.freeze({
          latency: 0,
          variance: 0,
          noiseAdded: 0,
          ora: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedMean = Math.max(0, Math.min(mean, this.maxLatency));
      const clampedVariance = Math.max(0, Math.min(variance, this.maxLatency / 2));
      const noise = clampedVariance * Math.sin(this.deterministicSeed % 1);
      const latency = clampedMean + noise;
      const ora = Math.max(0, 100 - (latency / this.maxLatency) * 100);

      this.stressMetrics.patternsGenerated++;

      return Object.freeze({
        latency: Math.round(latency),
        variance: clampedVariance,
        noiseAdded: noise,
        ora: Math.round(ora * 10) / 10,
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

  generatePacketLoss(lossProbability = 0.1) {
    const startTime = Date.now();
    try {
      if (lossProbability === null || lossProbability === undefined) {
        return Object.freeze({
          lossProbability: 0,
          packetsLost: 0,
          packetsTotal: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedLoss = Math.max(0, Math.min(lossProbability, this.maxLoss));
      const packetsTotal = 1000;
      const packetsLost = Math.floor(packetsTotal * clampedLoss);

      this.stressMetrics.patternsGenerated++;

      return Object.freeze({
        lossProbability: clampedLoss,
        packetsLost: packetsLost,
        packetsTotal: packetsTotal,
        packetsRetained: packetsTotal - packetsLost,
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

  generateObservationNoise(noiseLevel = 0.05) {
    const startTime = Date.now();
    try {
      if (noiseLevel === null || noiseLevel === undefined) {
        return Object.freeze({
          noiseLevel: 0,
          affectedObservations: 0,
          mnt: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedNoise = Math.max(0, Math.min(noiseLevel, 0.5));
      const totalObservations = 500;
      const affectedObservations = Math.floor(totalObservations * clampedNoise);
      const mnt = (1 - clampedNoise) * 50;

      this.stressMetrics.patternsGenerated++;

      return Object.freeze({
        noiseLevel: clampedNoise,
        affectedObservations: affectedObservations,
        totalObservations: totalObservations,
        mnt: Math.round(mnt * 10) / 10,
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

  generateTemporalDesync(desyncAmount = 1000) {
    const startTime = Date.now();
    try {
      if (desyncAmount === null || desyncAmount === undefined) {
        return Object.freeze({
          desyncAmount: 0,
          affectedNodes: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedDesync = Math.max(0, Math.min(desyncAmount, 10000));
      const affectedNodes = this._rng.nextInt(0, 10) + (this.deterministicSeed % 5);

      this.stressMetrics.patternsGenerated++;

      return Object.freeze({
        desyncAmount: clampedDesync,
        affectedNodes: affectedNodes,
        maxDesync: clampedDesync,
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

  createStressScenario(stressTypes = []) {
    const startTime = Date.now();
    try {
      if (!Array.isArray(stressTypes)) {
        return Object.freeze({
          scenario: null,
          dimensions: 0,
          oraScore: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const validTypes = stressTypes.filter(t => typeof t === 'string' && t.length > 0);
      const dimensions = validTypes.length;
      const oraScore = Math.max(0, 100 - dimensions * 15);

      this.stressMetrics.scenariosCreated++;

      return Object.freeze({
        scenario: Object.freeze([...validTypes]),
        dimensions: dimensions,
        oraScore: oraScore,
        scenarioId: `scenario_${this.stressMetrics.scenariosCreated}`,
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

  generateCascadingFailure(cascade = {}) {
    const startTime = Date.now();
    try {
      if (!cascade || typeof cascade !== 'object') {
        return Object.freeze({
          cascade: null,
          stages: 0,
          failureThreshold: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const stages = Object.keys(cascade).length || 1;
      const failureThreshold = Math.min(1.0, 0.1 + stages * 0.15);

      this.stressMetrics.cascadesSimulated++;

      return Object.freeze({
        cascade: Object.freeze({ ...cascade }),
        stages: stages,
        failureThreshold: Math.round(failureThreshold * 100) / 100,
        cascadeId: `cascade_${this.stressMetrics.cascadesSimulated}`,
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
      ...this.stressMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.stressMetrics.patternsGenerated = 0;
    this.stressMetrics.scenariosCreated = 0;
    this.stressMetrics.cascadesSimulated = 0;
  }
}

module.exports = StressInjectionEngine;
