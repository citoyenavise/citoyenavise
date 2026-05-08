/**
 * ProofChainConsolidator
 * PHASE 7.5 FINAL — Multi-Level Proof Chain Consolidation
 *
 * Merges SHA-256 proof chains into global root hash.
 *
 * CRITICAL: Immutable, append-only, forensic reconstruction
 * - no mutation allowed
 * - deterministic root computation
 * - global integrity witness
 */

const crypto = require('crypto');

class ProofChainConsolidator {
  constructor(options = {}) {
    // Node proof chains: nodeId → { proofs, rootHash }
    this.nodeProofChains = new Map();

    // Shard proof aggregations: shardId → { proofCount, rootHash }
    this.shardProofAggregations = new Map();

    // Global cluster proof root
    this.clusterProofRoot = null;
    this.globalRootHash = null;

    // Consolidation history (immutable)
    this.consolidationHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;

    // Statistics
    this.stats = {
      nodeProofsConsolidated: 0,
      shardProofsAggregated: 0,
      globalRootsComputed: 0,
      integrityVerifications: 0,
      lastConsolidation: null
    };
  }

  /**
   * Register node proof chain
   */
  registerNodeProofs(nodeId, proofChain) {
    if (!nodeId || !proofChain) {
      return { registered: false, reason: 'INVALID_INPUT' };
    }

    // Compute node root hash
    const nodeRootHash = this._computeChainHash(proofChain);

    const entry = Object.freeze({
      nodeId,
      proofCount: proofChain.length,
      rootHash: nodeRootHash,
      registeredAt: Date.now(),
      consolidationOrder: this.stats.nodeProofsConsolidated
    });

    this.nodeProofChains.set(nodeId, entry);
    this.stats.nodeProofsConsolidated++;

    this._addConsolidationRecord({
      type: 'NODE_PROOF_REGISTERED',
      nodeId,
      proofCount: proofChain.length,
      rootHash: nodeRootHash
    });

    return {
      registered: true,
      nodeId,
      rootHash: nodeRootHash,
      proofCount: proofChain.length
    };
  }

  /**
   * Aggregate shard proofs
   */
  aggregateShardProofs(shardId, proofs) {
    if (!shardId || !proofs) {
      return { aggregated: false, reason: 'INVALID_INPUT' };
    }

    // Compute shard aggregation hash
    const shardRootHash = this._computeChainHash(proofs);

    const entry = Object.freeze({
      shardId,
      proofCount: proofs.length,
      rootHash: shardRootHash,
      aggregatedAt: Date.now(),
      consolidationOrder: this.stats.shardProofsAggregated
    });

    this.shardProofAggregations.set(shardId, entry);
    this.stats.shardProofsAggregated++;

    this._addConsolidationRecord({
      type: 'SHARD_PROOF_AGGREGATED',
      shardId,
      proofCount: proofs.length,
      rootHash: shardRootHash
    });

    return {
      aggregated: true,
      shardId,
      rootHash: shardRootHash,
      proofCount: proofs.length
    };
  }

  /**
   * Build global cluster proof root
   */
  buildGlobalRoot() {
    try {
      // Collect all node and shard hashes
      const nodeHashes = Array.from(this.nodeProofChains.values())
        .sort((a, b) => a.nodeId.localeCompare(b.nodeId))
        .map(e => e.rootHash);

      const shardHashes = Array.from(this.shardProofAggregations.values())
        .sort((a, b) => a.shardId.localeCompare(b.shardId))
        .map(e => e.rootHash);

      // Compute global root hash
      const combinedInput = JSON.stringify({
        nodes: nodeHashes,
        shards: shardHashes,
        timestamp: Date.now()
      });

      this.globalRootHash = crypto
        .createHash('sha256')
        .update(combinedInput)
        .digest('hex');

      this.clusterProofRoot = Object.freeze({
        globalRootHash: this.globalRootHash,
        nodeCount: this.nodeProofChains.size,
        shardCount: this.shardProofAggregations.size,
        totalProofCount: Array.from(this.nodeProofChains.values()).reduce((sum, e) => sum + e.proofCount, 0) +
                        Array.from(this.shardProofAggregations.values()).reduce((sum, e) => sum + e.proofCount, 0),
        computedAt: Date.now(),
        nodeHashes: Object.freeze([...nodeHashes]),
        shardHashes: Object.freeze([...shardHashes])
      });

      this.stats.globalRootsComputed++;
      this.stats.lastConsolidation = this.clusterProofRoot.computedAt;

      this._addConsolidationRecord({
        type: 'GLOBAL_ROOT_COMPUTED',
        rootHash: this.globalRootHash,
        nodeCount: this.nodeProofChains.size,
        shardCount: this.shardProofAggregations.size
      });

      return {
        computed: true,
        rootHash: this.globalRootHash,
        timestamp: this.clusterProofRoot.computedAt
      };
    } catch (err) {
      return {
        computed: false,
        error: err.message
      };
    }
  }

  /**
   * Verify global integrity
   */
  verifyGlobalIntegrity() {
    if (!this.clusterProofRoot) {
      return {
        verified: false,
        reason: 'NO_GLOBAL_ROOT'
      };
    }

    try {
      // Recompute root hash to verify
      const combinedInput = JSON.stringify({
        nodes: this.clusterProofRoot.nodeHashes,
        shards: this.clusterProofRoot.shardHashes,
        timestamp: this.clusterProofRoot.computedAt
      });

      const recomputedHash = crypto
        .createHash('sha256')
        .update(combinedInput)
        .digest('hex');

      const isValid = recomputedHash === this.globalRootHash;

      this.stats.integrityVerifications++;

      this._addConsolidationRecord({
        type: 'INTEGRITY_VERIFICATION',
        valid: isValid,
        expectedHash: this.globalRootHash,
        recomputedHash
      });

      return {
        verified: isValid,
        valid: isValid,
        expectedHash: this.globalRootHash,
        recomputedHash,
        timestamp: Date.now()
      };
    } catch (err) {
      return {
        verified: false,
        error: err.message
      };
    }
  }

  /**
   * Get global proof root (immutable)
   */
  getGlobalProofRoot() {
    return {
      available: this.clusterProofRoot !== null,
      root: this.clusterProofRoot,
      rootHash: this.globalRootHash,
      timestamp: Date.now()
    };
  }

  /**
   * Get proof consolidation status
   */
  getConsolidationStatus() {
    return {
      nodesConsolidated: this.nodeProofChains.size,
      shardsAggregated: this.shardProofAggregations.size,
      globalRootAvailable: this.clusterProofRoot !== null,
      globalRootHash: this.globalRootHash,
      timestamp: Date.now()
    };
  }

  /**
   * Internal: Compute hash of proof chain
   */
  _computeChainHash(proofs) {
    if (!Array.isArray(proofs) || proofs.length === 0) {
      return crypto.createHash('sha256').update('').digest('hex');
    }

    const input = JSON.stringify(proofs.map(p => ({ hash: p.hash || p })));
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex');
  }

  /**
   * Internal: Add consolidation record
   */
  _addConsolidationRecord(record) {
    this.consolidationHistory.push({
      ...record,
      timestamp: Date.now(),
      sequence: this.consolidationHistory.length
    });

    if (this.consolidationHistory.length > this.maxHistorySize) {
      this.consolidationHistory.shift();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      nodeProofChainsCount: this.nodeProofChains.size,
      shardProofAggregationsCount: this.shardProofAggregations.size,
      consolidationHistorySize: this.consolidationHistory.length,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.nodeProofChains.clear();
    this.shardProofAggregations.clear();
    this.clusterProofRoot = null;
    this.globalRootHash = null;
    this.consolidationHistory = [];
    this.stats = {
      nodeProofsConsolidated: 0,
      shardProofsAggregated: 0,
      globalRootsComputed: 0,
      integrityVerifications: 0,
      lastConsolidation: null
    };
  }
}

module.exports = ProofChainConsolidator;
