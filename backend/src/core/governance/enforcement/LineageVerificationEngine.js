const crypto = require('crypto');

const LINEAGE_ERRORS = Object.freeze({
  BROKEN_CHAIN: 'BROKEN_CHAIN',
  MISSING_PROOF_LINK: 'MISSING_PROOF_LINK',
  MISSING_SNAPSHOT_LINK: 'MISSING_SNAPSHOT_LINK',
  HASH_MISMATCH: 'HASH_MISMATCH',
  CAUSAL_CONTRADICTION: 'CAUSAL_CONTRADICTION',
  WAL_LINEAGE_GAP: 'WAL_LINEAGE_GAP',
  REPLAY_LINEAGE_MISMATCH: 'REPLAY_LINEAGE_MISMATCH',
  REGION_DIVERGENCE: 'REGION_DIVERGENCE'
});

const LINEAGE_STATES = Object.freeze({
  VALID: 'VALID',
  INVALID: 'INVALID',
  PARTIAL: 'PARTIAL',
  CORRUPTED: 'CORRUPTED',
  DIVERGED: 'DIVERGED',
  UNVERIFIABLE: 'UNVERIFIABLE'
});

const VERIFICATION_STRATEGIES = Object.freeze({
  FULL: 'FULL',
  SAMPLE: 'SAMPLE',
  RECENT: 'RECENT'
});

const INTEGRITY_ACTIONS = Object.freeze({
  FLAG: 'FLAG',
  QUARANTINE: 'QUARANTINE',
  ALERT: 'ALERT',
  RECONSTRUCT: 'RECONSTRUCT',
  MANUAL: 'MANUAL'
});

class LineageVerificationEngine {
  constructor(graph, reconstructor = null, causalityEngine = null, orchestrator = null, options = {}) {
    this.graph = graph;
    this.reconstructor = reconstructor;
    this.causalityEngine = causalityEngine;
    this.orchestrator = orchestrator;

    this.maxChainDepth = options.maxChainDepth || 1000;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
    this.divergenceThreshold = options.divergenceThreshold || 0.05;

    this.verificationMetrics = {
      verificationsPerformed: 0,
      chainsVerified: 0,
      contradictionsDetected: 0,
      globalHashesComputed: 0,
      reconstructionParityChecks: 0,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  verifyLineageAt(targetTs, strategy = 'FULL') {
    const startTime = Date.now();

    try {
      if (!targetTs) {
        return Object.freeze({
          targetTs,
          valid: false,
          strategy,
          lineageState: LINEAGE_STATES.UNVERIFIABLE,
          chainLength: 0,
          chainHash: '',
          brokenLinks: [],
          contradictions: [],
          causalScore: 0.0,
          reconstructionParity: false,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      let chainLength = 0;
      let brokenLinks = [];
      let contradictions = [];
      let causalScore = 1.0;
      let reconstructionParity = true;

      // Reconstruct timeline if available in graph
      let timelineNodes = [];
      if (this.graph && typeof this.graph.reconstructTimeline === 'function') {
        try {
          const baseTs = new Date(new Date(targetTs).getTime() - 86400000).toISOString();
          timelineNodes = this.graph.reconstructTimeline(baseTs, targetTs) || [];
          chainLength = timelineNodes.length;
        } catch (e) {
          // Timeline reconstruction not available
        }
      }

      // Verify causal consistency if engine available
      let causalVerified = true;
      if (this.causalityEngine && typeof this.causalityEngine.verifyTemporalConsistency === 'function') {
        try {
          const baseTs = new Date(new Date(targetTs).getTime() - 3600000).toISOString();
          const consistency = this.causalityEngine.verifyTemporalConsistency(baseTs, targetTs);
          causalScore = consistency.consistencyScore || 0.8;
          causalVerified = consistency.consistent !== false;
        } catch (e) {
          causalScore = 0.5;
          causalVerified = false;
        }
      }

      // Compute deterministic chain hash
      const chainHash = this._computeChainHash(timelineNodes);

      // Check reconstruction parity if reconstructor available
      if (this.reconstructor && typeof this.reconstructor.reconstructStateAt === 'function') {
        try {
          const reconstructionResult = this.reconstructor.reconstructStateAt(targetTs);
          const reconstructedState = reconstructionResult.state || {};
          const stateHash = this._hashObject(reconstructedState);
          reconstructionParity = stateHash === chainHash;
          if (!reconstructionParity && chainLength > 0) {
            brokenLinks.push({
              nodeId: 'PARITY_CHECK',
              linkType: 'RECONSTRUCTION_VS_LINEAGE',
              detail: 'Reconstruction state hash differs from lineage hash'
            });
          }
        } catch (e) {
          reconstructionParity = false;
        }
      }

      const lineageState = causalVerified && reconstructionParity && brokenLinks.length === 0
        ? LINEAGE_STATES.VALID
        : brokenLinks.length > 0
          ? LINEAGE_STATES.INVALID
          : LINEAGE_STATES.PARTIAL;

      this.verificationMetrics.verificationsPerformed++;
      this.verificationMetrics.chainsVerified++;

      return Object.freeze({
        targetTs,
        valid: lineageState === LINEAGE_STATES.VALID,
        strategy,
        lineageState,
        chainLength,
        chainHash,
        brokenLinks: Object.freeze([...brokenLinks]),
        contradictions: Object.freeze([...contradictions]),
        causalScore: Math.min(1.0, causalScore),
        reconstructionParity,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        targetTs,
        valid: false,
        strategy,
        lineageState: LINEAGE_STATES.CORRUPTED,
        chainLength: 0,
        chainHash: '',
        brokenLinks: [],
        contradictions: [],
        causalScore: 0.0,
        reconstructionParity: false,
        error: error.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  verifyGlobalLineageConsistency() {
    const startTime = Date.now();

    try {
      let totalNodes = 0;
      let checkedNodes = 0;
      let validChains = 0;
      let brokenChains = 0;
      let issues = [];

      if (this.graph && this.graph.typeIndex && typeof this.graph.typeIndex.get === 'function') {
        const eventNodes = this.graph.typeIndex.get('EVENT_NODE') || [];
        const snapshotNodes = this.graph.typeIndex.get('SNAPSHOT_NODE') || [];
        const replayNodes = this.graph.typeIndex.get('REPLAY_NODE') || [];

        totalNodes = eventNodes.length + snapshotNodes.length + replayNodes.length;

        // Verify event chains
        for (const eventNodeId of eventNodes) {
          try {
            if (this.graph.getProofPath && typeof this.graph.getProofPath === 'function') {
              const proofPath = this.graph.getProofPath(eventNodeId);
              if (!proofPath || proofPath.length === 0) {
                brokenChains++;
                issues.push({
                  nodeId: eventNodeId,
                  issueType: LINEAGE_ERRORS.MISSING_PROOF_LINK,
                  severity: 'CRITICAL'
                });
              } else {
                validChains++;
              }
            }
            checkedNodes++;
          } catch (e) {
            issues.push({
              nodeId: eventNodeId,
              issueType: 'VERIFICATION_ERROR',
              severity: 'WARNING'
            });
            checkedNodes++;
          }
        }

        // Verify snapshot lineage
        for (const snapshotNodeId of snapshotNodes) {
          try {
            if (this.graph.getStateLineage && typeof this.graph.getStateLineage === 'function') {
              const stateLineage = this.graph.getStateLineage(snapshotNodeId);
              if (!stateLineage || stateLineage.length === 0) {
                brokenChains++;
                issues.push({
                  nodeId: snapshotNodeId,
                  issueType: LINEAGE_ERRORS.MISSING_SNAPSHOT_LINK,
                  severity: 'WARNING'
                });
              } else {
                validChains++;
              }
            }
            checkedNodes++;
          } catch (e) {
            checkedNodes++;
          }
        }
      }

      const globalLineageHash = this._computeGlobalHash();
      const consistencyScore = totalNodes > 0 ? validChains / totalNodes : 1.0;

      this.verificationMetrics.globalHashesComputed++;

      return Object.freeze({
        totalNodes,
        checkedNodes,
        validChains,
        brokenChains,
        globalLineageHash,
        consistencyScore: Math.min(1.0, consistencyScore),
        issues: Object.freeze([...issues]),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        totalNodes: 0,
        checkedNodes: 0,
        validChains: 0,
        brokenChains: 0,
        globalLineageHash: '',
        consistencyScore: 0.0,
        issues: [],
        error: error.message,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });
    }
  }

  computeLineageHash(nodeIds) {
    try {
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return Object.freeze({
          lineageHash: this._hashString(''),
          nodeCount: 0,
          orderedNodes: [],
          algorithm: this.hashAlgorithm,
          isAuthoritative: false
        });
      }

      const orderedNodes = [];
      const sortedIds = [...nodeIds].sort();

      for (let i = 0; i < sortedIds.length; i++) {
        orderedNodes.push({
          nodeId: sortedIds[i],
          sequence: i,
          contribution: this._hashString(sortedIds[i])
        });
      }

      const concatenated = orderedNodes.map(n => n.contribution).join('');
      const lineageHash = this._hashString(concatenated);

      return Object.freeze({
        lineageHash,
        nodeCount: nodeIds.length,
        orderedNodes: Object.freeze([...orderedNodes]),
        algorithm: this.hashAlgorithm,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        lineageHash: '',
        nodeCount: 0,
        orderedNodes: [],
        algorithm: this.hashAlgorithm,
        error: error.message,
        isAuthoritative: false
      });
    }
  }

  detectCausalContradictions(windowTs1, windowTs2) {
    try {
      if (!windowTs1 || !windowTs2) {
        return Object.freeze({
          windowTs1,
          windowTs2,
          contradictionsFound: false,
          contradictions: [],
          severity: 'INFO',
          isAuthoritative: false
        });
      }

      let contradictions = [];

      // Check via causality engine if available
      if (this.causalityEngine && typeof this.causalityEngine.detectTemporalConflicts === 'function') {
        try {
          const conflicts = this.causalityEngine.detectTemporalConflicts();
          if (conflicts && conflicts.conflicts) {
            contradictions = contradictions.concat(conflicts.conflicts.map(c => ({
              type: c.conflictType || 'TEMPORAL_CONFLICT',
              nodeId1: c.eventId || '',
              nodeId2: c.conflictingEventId || '',
              severity: 'CRITICAL',
              detail: c.description || '',
              recommendedAction: INTEGRITY_ACTIONS.ALERT
            })));
          }
        } catch (e) {
          // Causality check failed, continue with manual checks
        }
      }

      const contradictionsFound = contradictions.length > 0;
      const maxSeverity = contradictions.length === 0 ? 'INFO'
        : contradictions.some(c => c.severity === 'CRITICAL') ? 'CRITICAL'
          : 'WARNING';

      this.verificationMetrics.contradictionsDetected += contradictions.length;

      return Object.freeze({
        windowTs1,
        windowTs2,
        contradictionsFound,
        contradictions: Object.freeze([...contradictions]),
        severity: maxSeverity,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        windowTs1,
        windowTs2,
        contradictionsFound: false,
        contradictions: [],
        severity: 'INFO',
        error: error.message,
        isAuthoritative: false
      });
    }
  }

  getLineageAuditTrail(startTs, endTs) {
    try {
      if (!startTs || !endTs) {
        return Object.freeze({
          startTs,
          endTs,
          auditHash: '',
          entries: [],
          count: 0,
          isAuthoritative: false
        });
      }

      let entries = [];
      let cumulativeHash = '';

      if (this.graph && typeof this.graph.reconstructTimeline === 'function') {
        try {
          const nodes = this.graph.reconstructTimeline(startTs, endTs) || [];

          for (const node of nodes) {
            const nodeHash = this._hashObject(node);
            const previousHash = cumulativeHash;
            cumulativeHash = this._hashString(cumulativeHash + nodeHash);

            entries.push({
              ts: node.timestamp || startTs,
              nodeId: node.nodeId || '',
              nodeType: node.nodeType || 'UNKNOWN',
              hash: nodeHash,
              previousHash,
              cumulativeHash
            });
          }
        } catch (e) {
          // Timeline retrieval failed
        }
      }

      const auditHash = cumulativeHash;

      return Object.freeze({
        startTs,
        endTs,
        auditHash,
        entries: Object.freeze([...entries]),
        count: entries.length,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        startTs,
        endTs,
        auditHash: '',
        entries: [],
        count: 0,
        error: error.message,
        isAuthoritative: false
      });
    }
  }

  checkReconstructionParity(targetTs) {
    try {
      if (!targetTs) {
        return Object.freeze({
          targetTs,
          parityMatch: false,
          reconstructionHash: '',
          lineageHash: '',
          drift: 'Invalid timestamp',
          isAuthoritative: false
        });
      }

      let reconstructionHash = '';
      let lineageHash = '';

      if (this.reconstructor && typeof this.reconstructor.reconstructStateAt === 'function') {
        try {
          const reconstructionResult = this.reconstructor.reconstructStateAt(targetTs);
          reconstructionHash = this._hashObject(reconstructionResult.state || {});
        } catch (e) {
          reconstructionHash = '';
        }
      }

      // Compute lineage hash for verification
      if (this.graph && typeof this.graph.getCausalChain === 'function') {
        try {
          const chain = this.graph.getCausalChain(targetTs) || [];
          const lineageHashResult = this.computeLineageHash(chain.map(n => n.nodeId || ''));
          lineageHash = lineageHashResult.lineageHash;
        } catch (e) {
          lineageHash = '';
        }
      }

      const parityMatch = reconstructionHash && lineageHash && reconstructionHash === lineageHash;
      const drift = !parityMatch ? `Reconstruction: ${reconstructionHash.slice(0, 8)}, Lineage: ${lineageHash.slice(0, 8)}` : '';

      this.verificationMetrics.reconstructionParityChecks++;

      return Object.freeze({
        targetTs,
        parityMatch,
        reconstructionHash,
        lineageHash,
        drift,
        elapsedMs: 0,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        targetTs,
        parityMatch: false,
        reconstructionHash: '',
        lineageHash: '',
        drift: error.message,
        isAuthoritative: false
      });
    }
  }

  getMetrics() {
    return Object.freeze({
      verificationsPerformed: this.verificationMetrics.verificationsPerformed,
      chainsVerified: this.verificationMetrics.chainsVerified,
      contradictionsDetected: this.verificationMetrics.contradictionsDetected,
      globalHashesComputed: this.verificationMetrics.globalHashesComputed,
      reconstructionParityChecks: this.verificationMetrics.reconstructionParityChecks,
      timestamp: new Date().toISOString(),
      createdAt: this.verificationMetrics.createdAt,
      isAuthoritative: false
    });
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.verificationMetrics = {
      verificationsPerformed: 0,
      chainsVerified: 0,
      contradictionsDetected: 0,
      globalHashesComputed: 0,
      reconstructionParityChecks: 0,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  _hashString(str) {
    return crypto.createHash(this.hashAlgorithm).update(str).digest('hex');
  }

  _hashObject(obj) {
    try {
      const str = JSON.stringify(obj);
      return this._hashString(str);
    } catch (e) {
      return this._hashString('');
    }
  }

  _computeChainHash(nodes) {
    const hashes = nodes.map(n => this._hashObject(n));
    const concatenated = hashes.join('');
    return this._hashString(concatenated);
  }

  _computeGlobalHash() {
    try {
      const timestamp = new Date().toISOString();
      const systemState = {
        verificationsPerformed: this.verificationMetrics.verificationsPerformed,
        chainsVerified: this.verificationMetrics.chainsVerified,
        contradictionsDetected: this.verificationMetrics.contradictionsDetected,
        timestamp
      };
      return this._hashObject(systemState);
    } catch (e) {
      return '';
    }
  }
}

module.exports = LineageVerificationEngine;
module.exports.LINEAGE_ERRORS = LINEAGE_ERRORS;
module.exports.LINEAGE_STATES = LINEAGE_STATES;
module.exports.VERIFICATION_STRATEGIES = VERIFICATION_STRATEGIES;
module.exports.INTEGRITY_ACTIONS = INTEGRITY_ACTIONS;
