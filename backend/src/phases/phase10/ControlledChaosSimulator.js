/**
 * PHASE 10.4 — ControlledChaosSimulator
 * Extreme environment condition simulation for resilience validation
 * ~360 LOC
 */

'use strict';

const SeededPRNG = require('./DeterministicSeedManager');

class ControlledChaosSimulator {
  constructor(baselineConditions = {}, options = {}) {
    this.baselineConditions = Object.freeze({ ...baselineConditions });
    this.deterministicSeed = options.deterministicSeed || 42;
    this.maxStressLevel = options.maxStressLevel || 1.0;

    this._rng = new SeededPRNG(this.deterministicSeed);

    this.chaosMetrics = {
      simulationsRun: 0,
      partitionsSimulated: 0,
      failuresSimulated: 0,
      createdAt: new Date().toISOString()
    };
  }

  simulateNetworkPartition(duration = 1000) {
    const startTime = Date.now();
    try {
      if (duration === null || duration === undefined || duration < 0) {
        return Object.freeze({
          duration: 0,
          partitioned: false,
          ndr: 100.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedDuration = Math.max(0, Math.min(duration, 60000));
      const partitioned = clampedDuration > 0;
      const ndr = Math.max(0, 100 - (clampedDuration / 1000) * 10);

      this.chaosMetrics.partitionsSimulated++;
      this.chaosMetrics.simulationsRun++;

      return Object.freeze({
        duration: clampedDuration,
        partitioned: partitioned,
        ndr: Math.round(ndr * 10) / 10,
        affectedRegions: partitioned ? 1 : 0,
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

  simulateHighLatencyEnvironment(latency = 1000) {
    const startTime = Date.now();
    try {
      if (latency === null || latency === undefined || latency < 0) {
        return Object.freeze({
          latency: 0,
          degradation: 0.0,
          ndr: 100.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedLatency = Math.max(0, Math.min(latency, 10000));
      const degradation = Math.min(1.0, (clampedLatency / 5000) * 0.5);
      const ndr = Math.max(0, 100 - degradation * 100);

      this.chaosMetrics.simulationsRun++;

      return Object.freeze({
        latency: clampedLatency,
        degradation: Math.round(degradation * 100) / 100,
        ndr: Math.round(ndr * 10) / 10,
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

  simulateHighNoisyEnvironment(noiseRatio = 0.2) {
    const startTime = Date.now();
    try {
      if (noiseRatio === null || noiseRatio === undefined) {
        return Object.freeze({
          noiseRatio: 0,
          corruptedObservations: 0,
          totalObservations: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedNoise = Math.max(0, Math.min(noiseRatio, 1.0));
      const totalObservations = 1000;
      const corruptedObservations = Math.floor(totalObservations * clampedNoise);

      this.chaosMetrics.simulationsRun++;

      return Object.freeze({
        noiseRatio: clampedNoise,
        corruptedObservations: corruptedObservations,
        totalObservations: totalObservations,
        intactObservations: totalObservations - corruptedObservations,
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

  simulateObserverFailures(failureRate = 0.3) {
    const startTime = Date.now();
    try {
      if (failureRate === null || failureRate === undefined) {
        return Object.freeze({
          failureRate: 0,
          failedObservers: 0,
          totalObservers: 0,
          crd: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const clampedFailure = Math.max(0, Math.min(failureRate, 1.0));
      const totalObservers = 10;
      const failedObservers = Math.floor(totalObservers * clampedFailure);
      const crd = clampedFailure;

      this.chaosMetrics.failuresSimulated++;
      this.chaosMetrics.simulationsRun++;

      return Object.freeze({
        failureRate: clampedFailure,
        failedObservers: failedObservers,
        totalObservers: totalObservers,
        operationalObservers: totalObservers - failedObservers,
        crd: Math.round(crd * 100) / 100,
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

  runMultiDimensionalStress(dimensions = []) {
    const startTime = Date.now();
    try {
      if (!Array.isArray(dimensions)) {
        return Object.freeze({
          dimensions: 0,
          mst: 1.0,
          overallDegradation: 0.0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      const validDimensions = dimensions.filter(d => typeof d === 'number' && d >= 0);
      const dimensionCount = validDimensions.length;
      const avgDimension = dimensionCount > 0
        ? validDimensions.reduce((a, b) => a + b, 0) / dimensionCount
        : 0;
      const mst = Math.max(0, 1.0 - (avgDimension / 10) * 0.3);
      const overallDegradation = 1.0 - mst;

      this.chaosMetrics.simulationsRun++;

      return Object.freeze({
        dimensions: dimensionCount,
        dimensionValues: Object.freeze([...validDimensions]),
        mst: Math.round(mst * 100) / 100,
        overallDegradation: Math.round(overallDegradation * 100) / 100,
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

  simulateCascadingFailures() {
    const startTime = Date.now();
    try {
      const stages = this._rng.nextInt(2, 7) + (this.deterministicSeed % 3);
      const degradationPerStage = 0.2;
      const cft = Math.min(100, stages * 15 + this.deterministicSeed % 20);
      const totalDegradation = Math.min(1.0, stages * degradationPerStage);

      this.chaosMetrics.failuresSimulated++;
      this.chaosMetrics.simulationsRun++;

      return Object.freeze({
        stages: stages,
        stageProgression: Object.freeze(Array.from({ length: stages }, (_, i) => ({
          stage: i + 1,
          degradation: Math.round(degradationPerStage * (i + 1) * 100) / 100
        }))),
        cft: cft,
        totalDegradation: Math.round(totalDegradation * 100) / 100,
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
      ...this.chaosMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.chaosMetrics.simulationsRun = 0;
    this.chaosMetrics.partitionsSimulated = 0;
    this.chaosMetrics.failuresSimulated = 0;
  }
}

module.exports = ControlledChaosSimulator;
