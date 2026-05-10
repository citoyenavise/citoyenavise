const crypto = require('crypto');

/**
 * PHASE 9.0 — AdversarialRealityEngine
 *
 * Injects REAL-WORLD adversarial conditions:
 * - Variable network latency
 * - Packet loss
 * - Node restarts
 * - Region desynchronization
 * - Data corruption
 */

const ADVERSARIAL_CONDITIONS = Object.freeze({
  NETWORK_LATENCY: 'NETWORK_LATENCY',
  PACKET_LOSS: 'PACKET_LOSS',
  NODE_RESTART: 'NODE_RESTART',
  REGION_DESYNC: 'REGION_DESYNC',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  CASCADING_FAILURE: 'CASCADING_FAILURE'
});

class AdversarialRealityEngine {
  constructor(externalTruthLayer, options = {}) {
    this.truthLayer = externalTruthLayer;

    this.conditions = {
      networkLatency: {
        min: options.minLatency || 10,
        max: options.maxLatency || 5000
      },
      packetLoss: {
        min: options.minPacketLoss || 0,
        max: options.maxPacketLoss || 0.5
      },
      nodeRestartChance: options.nodeRestartChance || 0.05,
      regionDesyncChance: options.regionDesyncChance || 0.02,
      corruptionChance: options.corruptionChance || 0.01
    };

    this.activeConditions = [];
    this.injectionHistory = [];
  }

  /**
   * Inject variable network latency
   */
  injectNetworkLatency(region1, region2) {
    try {
      const latency = Math.random() *
        (this.conditions.networkLatency.max - this.conditions.networkLatency.min) +
        this.conditions.networkLatency.min;

      const injection = {
        type: ADVERSARIAL_CONDITIONS.NETWORK_LATENCY,
        region1,
        region2,
        latencyMs: latency,
        expectedEffect: 'REGION_SYNC_DELAY',
        severity: latency > 1000 ? 'CRITICAL' : 'WARNING',
        injectedAt: this.truthLayer.externalClock.now()
      };

      this.truthLayer.recordAdversarialInjection(injection);
      this.injectionHistory.push(Object.freeze(injection));
      this.activeConditions.push(Object.freeze(injection));

      return Object.freeze(injection);
    } catch (error) {
      return Object.freeze({
        type: ADVERSARIAL_CONDITIONS.NETWORK_LATENCY,
        error: error.message
      });
    }
  }

  /**
   * Inject packet loss on a region
   */
  injectPacketLoss(region) {
    try {
      const lossRate = Math.random() * this.conditions.packetLoss.max;

      const injection = Object.freeze({
        type: ADVERSARIAL_CONDITIONS.PACKET_LOSS,
        region,
        lossRate,
        affectedMessages: Math.floor(Math.random() * 100),
        expectedEffect: 'INCOMPLETE_REPLICATION',
        severity: lossRate > 0.2 ? 'CRITICAL' : 'WARNING',
        injectedAt: this.truthLayer.externalClock.now()
      });

      this.truthLayer.recordAdversarialInjection(injection);
      this.injectionHistory.push(injection);
      this.activeConditions.push(injection);

      return injection;
    } catch (error) {
      return Object.freeze({
        type: ADVERSARIAL_CONDITIONS.PACKET_LOSS,
        error: error.message
      });
    }
  }

  /**
   * Inject node restart
   */
  injectNodeRestart(region, nodeId) {
    try {
      const injection = Object.freeze({
        type: ADVERSARIAL_CONDITIONS.NODE_RESTART,
        region,
        nodeId,
        restartDurationMs: Math.random() * 30000 + 1000,
        expectedEffect: 'QUORUM_IMPACT',
        severity: 'CRITICAL',
        injectedAt: this.truthLayer.externalClock.now()
      });

      this.truthLayer.recordAdversarialInjection(injection);
      this.injectionHistory.push(injection);
      this.activeConditions.push(injection);

      return injection;
    } catch (error) {
      return Object.freeze({
        type: ADVERSARIAL_CONDITIONS.NODE_RESTART,
        error: error.message
      });
    }
  }

  /**
   * Inject region clock desynchronization
   */
  injectRegionDesync(region1, region2) {
    try {
      const skewMs = Math.random() * 5000;

      const injection = Object.freeze({
        type: ADVERSARIAL_CONDITIONS.REGION_DESYNC,
        region1,
        region2,
        clockSkewMs: skewMs,
        expectedEffect: 'CAUSAL_CONTRADICTION',
        severity: skewMs > 1000 ? 'CRITICAL' : 'WARNING',
        injectedAt: this.truthLayer.externalClock.now()
      });

      this.truthLayer.recordAdversarialInjection(injection);
      this.injectionHistory.push(injection);
      this.activeConditions.push(injection);

      return injection;
    } catch (error) {
      return Object.freeze({
        type: ADVERSARIAL_CONDITIONS.REGION_DESYNC,
        error: error.message
      });
    }
  }

  /**
   * Inject data corruption
   */
  injectDataCorruption(targetId, corruptionType = 'BITFLIP') {
    try {
      const injection = Object.freeze({
        type: ADVERSARIAL_CONDITIONS.DATA_CORRUPTION,
        target: targetId,
        corruptionType,
        affectedBytes: Math.floor(Math.random() * 1000),
        expectedEffect: 'HASH_MISMATCH',
        severity: 'CRITICAL',
        injectedAt: this.truthLayer.externalClock.now()
      });

      this.truthLayer.recordAdversarialInjection(injection);
      this.injectionHistory.push(injection);
      this.activeConditions.push(injection);

      return injection;
    } catch (error) {
      return Object.freeze({
        type: ADVERSARIAL_CONDITIONS.DATA_CORRUPTION,
        error: error.message
      });
    }
  }

  /**
   * Simulate cascading failure (multiple simultaneous issues)
   */
  injectCascadingFailure(regions) {
    try {
      const injection = Object.freeze({
        type: ADVERSARIAL_CONDITIONS.CASCADING_FAILURE,
        regions,
        conditions: [
          { type: ADVERSARIAL_CONDITIONS.NETWORK_LATENCY, severity: 'CRITICAL' },
          { type: ADVERSARIAL_CONDITIONS.PACKET_LOSS, severity: 'CRITICAL' },
          { type: ADVERSARIAL_CONDITIONS.NODE_RESTART, severity: 'CRITICAL' }
        ],
        expectedEffect: 'SYSTEM_DEGRADATION',
        severity: 'CATASTROPHIC',
        injectedAt: this.truthLayer.externalClock.now()
      });

      this.truthLayer.recordAdversarialInjection(injection);
      this.injectionHistory.push(injection);
      this.activeConditions.push(injection);

      return injection;
    } catch (error) {
      return Object.freeze({
        type: ADVERSARIAL_CONDITIONS.CASCADING_FAILURE,
        error: error.message
      });
    }
  }

  /**
   * Get all active adversarial conditions
   */
  getActiveConditions() {
    return Object.freeze([...this.activeConditions]);
  }

  /**
   * Get injection history
   */
  getInjectionHistory() {
    return Object.freeze([...this.injectionHistory]);
  }

  /**
   * Clear active conditions (for testing)
   */
  clearConditions() {
    this.activeConditions = [];
  }

  /**
   * Simulate random adversarial event (chaos engineering)
   */
  injectRandomAdversary(regions = ['EU', 'US', 'APAC']) {
    const conditionTypes = Object.values(ADVERSARIAL_CONDITIONS).filter(
      t => t !== ADVERSARIAL_CONDITIONS.CASCADING_FAILURE
    );

    const chosen = conditionTypes[Math.floor(Math.random() * conditionTypes.length)];

    switch (chosen) {
      case ADVERSARIAL_CONDITIONS.NETWORK_LATENCY:
        return this.injectNetworkLatency(regions[0], regions[1]);

      case ADVERSARIAL_CONDITIONS.PACKET_LOSS:
        return this.injectPacketLoss(regions[Math.floor(Math.random() * regions.length)]);

      case ADVERSARIAL_CONDITIONS.NODE_RESTART:
        const region = regions[Math.floor(Math.random() * regions.length)];
        return this.injectNodeRestart(region, `node_${Math.floor(Math.random() * 3)}`);

      case ADVERSARIAL_CONDITIONS.REGION_DESYNC:
        return this.injectRegionDesync(regions[0], regions[1]);

      case ADVERSARIAL_CONDITIONS.DATA_CORRUPTION:
        return this.injectDataCorruption(`snapshot_${Math.floor(Math.random() * 100)}`);

      default:
        return null;
    }
  }

  /**
   * Get summary of adversarial activity
   */
  getAdversarialReport() {
    const byType = {};
    for (const injection of this.injectionHistory) {
      byType[injection.type] = (byType[injection.type] || 0) + 1;
    }

    return Object.freeze({
      totalInjections: this.injectionHistory.length,
      activeConditions: this.activeConditions.length,
      byType: Object.freeze(byType),
      timestamp: this.truthLayer.externalClock.now(),
      isAuthoritative: true
    });
  }
}

module.exports = AdversarialRealityEngine;
module.exports.ADVERSARIAL_CONDITIONS = ADVERSARIAL_CONDITIONS;
