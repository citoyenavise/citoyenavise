/**
 * PHASE 9.0 — DivergenceFunctionEngine (Divergence Function D(t))
 *
 * Computes divergence between external observation EO(t) and projected
 * internal state P(IS(t)).
 *
 * D(t) = distance(EO(t), P(IS(t)))
 *
 * This is the PRIMARY TRUTH SIGNAL. High divergence → state is not accurate.
 * Low divergence → external observation matches projection.
 *
 * Key: This is non-corrective. We measure divergence but never fix it.
 */

const crypto = require('crypto');

const DIVERGENCE_COMPONENTS = Object.freeze({
  STATE_HASH: 'STATE_HASH',
  CONSISTENCY_SCORE: 'CONSISTENCY_SCORE',
  LATENCY: 'LATENCY',
  PACKET_LOSS: 'PACKET_LOSS',
  NODE_AVAILABILITY: 'NODE_AVAILABILITY',
  CORRUPTION: 'CORRUPTION',
  TEMPORAL: 'TEMPORAL',
  REPLICATION: 'REPLICATION'
});

class DivergenceFunctionEngine {
  constructor(options = {}) {
    // Weights for each divergence component (sum to 1.0)
    this.weights = {
      state_hash_weight: options.state_hash_weight || 0.20,
      consistency_weight: options.consistency_weight || 0.15,
      latency_weight: options.latency_weight || 0.15,
      packet_loss_weight: options.packet_loss_weight || 0.15,
      node_availability_weight: options.node_availability_weight || 0.15,
      corruption_weight: options.corruption_weight || 0.10,
      temporal_weight: options.temporal_weight || 0.10,
      replication_weight: options.replication_weight || 0.00 // Optional
    };

    // Normalize weights to sum to 1.0
    const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
    for (const key in this.weights) {
      this.weights[key] /= totalWeight;
    }

    this.metrics = {
      divergencesComputed: 0,
      maxDivergenceObserved: 0.0,
      minDivergenceObserved: 1.0,
      averageDivergence: 0.0,
      createdAt: new Date().toISOString()
    };

    this.divergenceHistory = [];
  }

  /**
   * Compute total divergence between observation and projection
   *
   * D(t) = weighted_sum of component divergences
   */
  computeDivergence(externalObservation, projection, context = {}) {
    try {
      if (!externalObservation || !projection) {
        throw new Error('Missing external observation or projection');
      }

      const components = {
        // Component 1: State hash divergence
        [DIVERGENCE_COMPONENTS.STATE_HASH]: this._computeStateHashDivergence(
          externalObservation,
          projection
        ),

        // Component 2: Consistency score divergence
        [DIVERGENCE_COMPONENTS.CONSISTENCY_SCORE]: this._computeConsistencyDivergence(
          externalObservation,
          projection
        ),

        // Component 3: Latency divergence
        [DIVERGENCE_COMPONENTS.LATENCY]: this._computeLatencyDivergence(
          externalObservation,
          projection
        ),

        // Component 4: Packet loss divergence
        [DIVERGENCE_COMPONENTS.PACKET_LOSS]: this._computePacketLossDivergence(
          externalObservation,
          projection
        ),

        // Component 5: Node availability divergence
        [DIVERGENCE_COMPONENTS.NODE_AVAILABILITY]: this._computeNodeAvailabilityDivergence(
          externalObservation,
          projection
        ),

        // Component 6: Data corruption divergence
        [DIVERGENCE_COMPONENTS.CORRUPTION]: this._computeCorruptionDivergence(
          externalObservation,
          projection
        ),

        // Component 7: Temporal ordering divergence
        [DIVERGENCE_COMPONENTS.TEMPORAL]: this._computeTemporalDivergence(
          externalObservation,
          projection
        ),

        // Component 8: Replication completeness
        [DIVERGENCE_COMPONENTS.REPLICATION]: this._computeReplicationDivergence(
          externalObservation,
          projection
        )
      };

      // Compute weighted total divergence
      let totalDivergence = 0.0;
      for (const [component, value] of Object.entries(components)) {
        const componentKey = component.toLowerCase().replace(/_/g, '') + '_weight';
        const weight = this.weights[componentKey] || 0.0;
        totalDivergence += value * weight;
      }

      // Ensure divergence is in [0.0, 1.0]
      totalDivergence = Math.max(0.0, Math.min(1.0, totalDivergence));

      // Update metrics
      this.metrics.divergencesComputed++;
      this.metrics.maxDivergenceObserved = Math.max(this.metrics.maxDivergenceObserved, totalDivergence);
      this.metrics.minDivergenceObserved = Math.min(this.metrics.minDivergenceObserved, totalDivergence);

      // Update running average
      this.metrics.averageDivergence =
        (this.metrics.averageDivergence * (this.metrics.divergencesComputed - 1) + totalDivergence) /
        this.metrics.divergencesComputed;

      // Store in history for collapse detection
      this.divergenceHistory.push({
        timestamp: new Date().toISOString(),
        divergence: totalDivergence,
        components: Object.freeze({ ...components })
      });

      // Keep history to last 1000 samples
      if (this.divergenceHistory.length > 1000) {
        this.divergenceHistory.shift();
      }

      const result = Object.freeze({
        total_divergence: totalDivergence,
        components: Object.freeze(components),
        context: context,
        computed_at: new Date().toISOString(),
        isAuthoritative: false // Divergence measurement is not authoritative alone
      });

      return result;
    } catch (error) {
      return Object.freeze({
        error: error.message,
        total_divergence: NaN,
        isAuthoritative: false
      });
    }
  }

  /**
   * Component 1: State hash divergence
   * Compare: observed state hash vs projected state hash
   */
  _computeStateHashDivergence(eo, projection) {
    try {
      const observedHash = eo.sampled_state_hash || eo.observed_state_hash || '';
      const projectedHash = projection.projected_state_hash || '';

      if (!observedHash || !projectedHash) {
        return 0.5; // Unknown: assume moderate divergence
      }

      // 0 if hashes match, 1 if completely different
      if (observedHash === projectedHash) {
        return 0.0;
      }

      // Compute bit-level difference
      const observed = Buffer.from(observedHash, 'hex');
      const projected = Buffer.from(projectedHash, 'hex');

      if (observed.length === 0 || projected.length === 0) {
        return 1.0; // Missing hash = maximum divergence
      }

      let bitDifferences = 0;
      const minLen = Math.min(observed.length, projected.length);
      for (let i = 0; i < minLen; i++) {
        const xor = observed[i] ^ projected[i];
        bitDifferences += this._popcount(xor);
      }

      // Normalize: max 256 bits different, so max 256 bit differences
      return Math.min(1.0, bitDifferences / 256.0);
    } catch (e) {
      return 0.5;
    }
  }

  /**
   * Component 2: Consistency score divergence
   * Compare: observed consistency vs projected consistency
   */
  _computeConsistencyDivergence(eo, projection) {
    try {
      const observedScore = eo.external_consistency || 0.5;
      const projectedScore = projection.projected_consistency_score || 0.5;

      const delta = Math.abs(observedScore - projectedScore);
      return Math.min(1.0, delta); // 0 if match, up to 1.0 if opposite
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Component 3: Latency divergence
   * Compare: observed inter-region latencies vs projected
   */
  _computeLatencyDivergence(eo, projection) {
    try {
      const observedLatencies = eo.region_latency || {};
      const projectedLatencies = projection.projected_latencies || {};

      const regions = ['EU_to_US', 'US_to_APAC', 'APAC_to_EU'];
      let totalDeviation = 0;
      let regionCount = 0;

      for (const region of regions) {
        const observed = observedLatencies[region] || 0;
        const projected = projectedLatencies[region] || 50; // Default 50ms

        const deviation = Math.abs(observed - projected) / Math.max(1, Math.max(observed, projected));
        totalDeviation += deviation;
        regionCount++;
      }

      const avgDeviation = regionCount > 0 ? totalDeviation / regionCount : 0;
      return Math.min(1.0, avgDeviation); // Normalized
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Component 4: Packet loss divergence
   * Compare: observed packet loss vs projected
   */
  _computePacketLossDivergence(eo, projection) {
    try {
      const observedLoss = eo.packet_loss || {};
      const projectedLoss = projection.projected_packet_loss || {};

      const regions = ['EU', 'US', 'APAC'];
      let totalDivergence = 0;

      for (const region of regions) {
        const observed = observedLoss[region] || 0.0;
        const projected = projectedLoss[region] || 0.0;

        // Percentage point difference
        const pointDifference = Math.abs(observed - projected);
        totalDivergence += pointDifference;
      }

      const avgDivergence = totalDivergence / regions.length;
      return Math.min(1.0, avgDivergence); // Max 100% divergence
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Component 5: Node availability divergence
   * Compare: observed node status vs projected
   */
  _computeNodeAvailabilityDivergence(eo, projection) {
    try {
      const observedStatus = eo.node_status || {};
      const projectedStatus = projection.projected_node_status || {};

      let totalNodes = 0;
      let disagreements = 0;

      for (const [region, nodes] of Object.entries(projectedStatus)) {
        const observedRegion = observedStatus[region] || {};

        for (const [nodeId, projectedState] of Object.entries(nodes)) {
          totalNodes++;
          const observedState = observedRegion[nodeId] || 'unknown';

          if (observedState !== projectedState) {
            disagreements++;
          }
        }
      }

      if (totalNodes === 0) return 0.0;
      return disagreements / totalNodes; // Fraction of disagreements
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Component 6: Data corruption divergence
   * Compare: observed corrupted entries vs projected
   */
  _computeCorruptionDivergence(eo, projection) {
    try {
      const observedCorruption = eo.corrupted_entries || [];
      const totalEntries = eo.total_entries || 1000;

      const corruptionRate = observedCorruption.length / Math.max(1, totalEntries);
      return Math.min(1.0, corruptionRate); // Any corruption = divergence
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Component 7: Temporal ordering divergence
   * Compare: observed message ordering vs projected causality
   */
  _computeTemporalDivergence(eo, projection) {
    try {
      const messages = eo.message_observations || [];

      if (messages.length === 0) return 0.0;

      let causalViolations = 0;

      // Check for temporal ordering violations
      for (let i = 1; i < messages.length; i++) {
        const prev = messages[i - 1];
        const curr = messages[i];

        // If curr was sent before prev was received, that's a violation
        if (curr.sent_at && prev.received_at && curr.sent_at < prev.received_at) {
          causalViolations++;
        }
      }

      return causalViolations / messages.length;
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Component 8: Replication completeness
   * Compare: observed replication lag vs projected
   */
  _computeReplicationDivergence(eo, projection) {
    try {
      const projectedLag = projection.projected_replication_lag || {};
      const projectedLagMessages = projectedLag.lag_messages || 0;

      // Any lag = some divergence
      if (projectedLagMessages === 0) return 0.0;

      // Estimate divergence from lag
      // 100 messages behind = 10% divergence
      return Math.min(1.0, projectedLagMessages / 1000.0);
    } catch (e) {
      return 0.0;
    }
  }

  /**
   * Get divergence history (for collapse detection)
   */
  getDivergenceHistory(windowSize = null) {
    const history = windowSize
      ? this.divergenceHistory.slice(-windowSize)
      : this.divergenceHistory;

    return Object.freeze({
      history: Object.freeze([...history]),
      count: history.length,
      isAuthoritative: false
    });
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      history_size: this.divergenceHistory.length
    });
  }

  /**
   * Reset metrics
   */
  reset() {
    this.divergenceHistory = [];
    this.metrics = {
      divergencesComputed: 0,
      maxDivergenceObserved: 0.0,
      minDivergenceObserved: 1.0,
      averageDivergence: 0.0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Helper: Count set bits in a byte
   */
  _popcount(byte) {
    let count = 0;
    let n = byte;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  /**
   * Always non-authoritative
   */
  isAuthoritative() {
    return false;
  }
}

module.exports = DivergenceFunctionEngine;
module.exports.DIVERGENCE_COMPONENTS = DIVERGENCE_COMPONENTS;
