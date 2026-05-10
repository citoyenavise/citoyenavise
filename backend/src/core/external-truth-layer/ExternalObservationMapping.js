/**
 * PHASE 9.0 — ExternalObservationMapping (Projection Function)
 *
 * Implements P(IS(t)) — the projection of internal state into observable space.
 * Maps internal claims to what we expect to observe if the claims are accurate.
 *
 * This is NOT validation. This is: "Given what the cluster claims, what SHOULD
 * we observe externally if the claim is true?"
 */

const crypto = require('crypto');

class ExternalObservationMapping {
  constructor(options = {}) {
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
    this.projectionCache = new Map();
    this.metrics = {
      projectionsComputed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Project internal state into observable space
   * P(IS(t)) → observable properties
   */
  projectInternalState(internalState) {
    try {
      if (!internalState || typeof internalState !== 'object') {
        throw new Error('Invalid internal state');
      }

      const cacheKey = this._computeHash(internalState);
      if (this.projectionCache.has(cacheKey)) {
        this.metrics.cacheHits++;
        return Object.freeze(this.projectionCache.get(cacheKey));
      }

      this.metrics.cacheMisses++;
      this.metrics.projectionsComputed++;

      // Project each component
      const projection = Object.freeze({
        // State hash projection: what we expect to observe for this state
        projected_state_hash: this._projectStateHash(internalState),

        // Lineage projection: what lineage hash we expect cluster to report
        projected_lineage_hash: this._projectLineageHash(internalState),

        // Consistency projection: what internal consistency score we expect
        projected_consistency_score: this._projectConsistencyScore(internalState),

        // Latency projection: expected inter-region latency
        projected_latencies: Object.freeze(this._projectLatencies(internalState)),

        // Packet loss projection: expected packet loss rates
        projected_packet_loss: Object.freeze(this._projectPacketLoss(internalState)),

        // Node availability projection: expected node status
        projected_node_status: Object.freeze(this._projectNodeStatus(internalState)),

        // Replication projection: expected replication completeness
        projected_replication_lag: this._projectReplicationLag(internalState),

        // Region agreement projection: do all regions agree?
        projected_region_agreement: this._projectRegionAgreement(internalState),

        // Projection timestamp
        projected_at: new Date().toISOString(),

        // Deterministic projection hash (for audit)
        projection_hash: this._computeHash(internalState),

        isAuthoritative: false // Projection is NOT authoritative
      });

      this.projectionCache.set(cacheKey, projection);
      return projection;
    } catch (error) {
      return Object.freeze({
        error: error.message,
        projected_at: new Date().toISOString(),
        isAuthoritative: false
      });
    }
  }

  /**
   * Project state hash: compute expected hash of internal snapshots + WAL
   */
  _projectStateHash(internalState) {
    try {
      const stateComponents = {
        snapshots: internalState.snapshots || [],
        wal_entries: internalState.wal_entries || [],
        timestamp: internalState.timestamp
      };

      return this._computeHash(JSON.stringify(stateComponents));
    } catch (e) {
      return '';
    }
  }

  /**
   * Project lineage hash: compute deterministic lineage hash
   */
  _projectLineageHash(internalState) {
    try {
      const lineageComponents = {
        causal_graph: internalState.causal_graph || [],
        events: (internalState.events || []).map(e => e.id),
        proofs: (internalState.proofs || []).map(p => p.hash)
      };

      return this._computeHash(JSON.stringify(lineageComponents));
    } catch (e) {
      return '';
    }
  }

  /**
   * Project consistency score: what internal consistency should be
   */
  _projectConsistencyScore(internalState) {
    try {
      const score = internalState.consistency_score;
      if (typeof score === 'number' && score >= 0 && score <= 1.0) {
        return score;
      }

      // Compute expected consistency from structure
      let expectedScore = 1.0;

      // Deduct for missing components
      if (!internalState.snapshots || internalState.snapshots.length === 0) expectedScore -= 0.1;
      if (!internalState.wal_entries || internalState.wal_entries.length === 0) expectedScore -= 0.1;
      if (!internalState.causal_graph || !Array.isArray(internalState.causal_graph)) expectedScore -= 0.2;

      // Deduct for temporal inconsistencies
      if (internalState.temporal_issues && internalState.temporal_issues > 0) {
        expectedScore -= Math.min(0.2, internalState.temporal_issues * 0.05);
      }

      return Math.max(0.0, expectedScore);
    } catch (e) {
      return 0.5; // Unknown consistency
    }
  }

  /**
   * Project latencies: what we expect inter-region latency to be
   */
  _projectLatencies(internalState) {
    try {
      const regions = internalState.region_state || {};
      const projectedLatency = {};

      const regionPairs = [
        ['EU', 'US'],
        ['US', 'APAC'],
        ['APAC', 'EU']
      ];

      for (const [r1, r2] of regionPairs) {
        // Expected latency based on topology and network conditions
        let baseLatency = 50; // ms default

        // Adjust for reported network conditions
        if (internalState.adversarial_conditions) {
          const cond = internalState.adversarial_conditions.find(
            c => (c.region1 === r1 && c.region2 === r2) || (c.region1 === r2 && c.region2 === r1)
          );
          if (cond && cond.latencyMs) {
            baseLatency = cond.latencyMs;
          }
        }

        projectedLatency[`${r1}_to_${r2}`] = baseLatency;
      }

      return projectedLatency;
    } catch (e) {
      return { EU_to_US: 50, US_to_APAC: 50, APAC_to_EU: 50 };
    }
  }

  /**
   * Project packet loss: expected packet loss rates per region
   */
  _projectPacketLoss(internalState) {
    try {
      const regions = internalState.region_state || {};
      const projectedLoss = {
        EU: 0.0,
        US: 0.0,
        APAC: 0.0
      };

      // Adjust for adversarial conditions
      if (internalState.adversarial_conditions) {
        for (const cond of internalState.adversarial_conditions) {
          if (cond.type === 'PACKET_LOSS' && cond.region) {
            projectedLoss[cond.region] = cond.lossRate || 0.0;
          }
        }
      }

      return projectedLoss;
    } catch (e) {
      return { EU: 0.0, US: 0.0, APAC: 0.0 };
    }
  }

  /**
   * Project node status: expected up/down status for each node
   */
  _projectNodeStatus(internalState) {
    try {
      const regions = internalState.region_state || {};
      const projectedStatus = {};

      for (const [regionId, regionState] of Object.entries(regions)) {
        projectedStatus[regionId] = {};

        // Get nodes in region
        const nodes = regionState.nodes || ['node_1', 'node_2', 'node_3'];

        for (const nodeId of nodes) {
          // Default: up
          let status = 'up';

          // Check for node restart conditions
          if (internalState.adversarial_conditions) {
            const restartCond = internalState.adversarial_conditions.find(
              c => c.type === 'NODE_RESTART' && c.region === regionId && c.nodeId === nodeId
            );
            if (restartCond) {
              // Node is restarting (down for duration)
              status = 'down';
            }
          }

          projectedStatus[regionId][nodeId] = status;
        }
      }

      return projectedStatus;
    } catch (e) {
      return {
        EU: { node_1: 'up', node_2: 'up', node_3: 'up' },
        US: { node_1: 'up', node_2: 'up', node_3: 'up' },
        APAC: { node_1: 'up', node_2: 'up', node_3: 'up' }
      };
    }
  }

  /**
   * Project replication lag: expected bytes/messages behind
   */
  _projectReplicationLag(internalState) {
    try {
      let lagBytes = 0;
      let lagMessages = 0;

      // Check for packet loss or latency conditions
      if (internalState.adversarial_conditions) {
        for (const cond of internalState.adversarial_conditions) {
          if (cond.type === 'PACKET_LOSS') {
            // Estimated retransmission backlog
            lagMessages += Math.floor((cond.affectedMessages || 0) * cond.lossRate);
          }
          if (cond.type === 'NETWORK_LATENCY' && cond.latencyMs > 100) {
            // Higher latency → slightly more inflight
            lagBytes += (cond.latencyMs * 1024);
          }
        }
      }

      return {
        lag_bytes: lagBytes,
        lag_messages: lagMessages,
        is_replicated: lagMessages === 0 && lagBytes === 0
      };
    } catch (e) {
      return { lag_bytes: 0, lag_messages: 0, is_replicated: true };
    }
  }

  /**
   * Project region agreement: do all regions have same state?
   */
  _projectRegionAgreement(internalState) {
    try {
      const regions = internalState.region_state || {};
      const regionKeys = Object.keys(regions);

      if (regionKeys.length < 2) {
        return { all_regions_agree: true, divergent_regions: [] };
      }

      // Get hash of first region
      const baseHash = this._computeHash(regions[regionKeys[0]]);

      const divergentRegions = [];
      for (const regionId of regionKeys.slice(1)) {
        const regionHash = this._computeHash(regions[regionId]);
        if (regionHash !== baseHash) {
          divergentRegions.push(regionId);
        }
      }

      return {
        all_regions_agree: divergentRegions.length === 0,
        divergent_regions: divergentRegions,
        agreement_score: (regionKeys.length - divergentRegions.length) / regionKeys.length
      };
    } catch (e) {
      return { all_regions_agree: true, divergent_regions: [], agreement_score: 1.0 };
    }
  }

  /**
   * Get list of projectable properties
   */
  getProjectionComponents() {
    return Object.freeze({
      state_hash: true,
      lineage_hash: true,
      consistency_score: true,
      latencies: true,
      packet_loss: true,
      node_status: true,
      replication_lag: true,
      region_agreement: true
    });
  }

  /**
   * Get projection metrics
   */
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      cache_size: this.projectionCache.size,
      cache_efficiency: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.projectionCache.clear();
  }

  /**
   * Private: compute SHA256 hash
   */
  _computeHash(data) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return crypto.createHash('sha256').update(str).digest('hex');
    } catch (e) {
      return '';
    }
  }

  /**
   * Always non-authoritative
   */
  isAuthoritative() {
    return false;
  }
}

module.exports = ExternalObservationMapping;
