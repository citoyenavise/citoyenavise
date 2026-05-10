/**
 * Kernel Configuration
 * PHASE 9.3 — Centralized cluster kernel configuration
 *
 * Global parameters, thresholds, timeouts, and hash seeds
 */

module.exports = {
  // Bootstrap configuration
  bootstrap: {
    timeoutMs: 5000,
    maxRetries: 3,
    stepValidationRequired: true,
    freezeTopologyAfterStep3: true
  },

  // Rebuild configuration
  rebuild: {
    crashDetectionTimeoutMs: 2000,
    heartbeatIntervalMs: 500,
    maxCrashedNodesAllowed: 3, // can lose up to 3 nodes
    rebalanceMaxMovementsPerStep: 10,
    convergenceTimeoutMs: 30000
  },

  // Shard discovery configuration
  discovery: {
    phaseTimeouts: {
      phase1_ping: 5000,
      phase2_metadata: 10000,
      phase3_topology: 10000,
      phase4_conflict: 15000,
      phase5_finalize: 5000
    },
    maxConcurrentDiscoveries: 10,
    stateHashValidationRequired: true,
    checksumMismatchAction: 'REJECT' // REJECT | RETRY | OVERRIDE
  },

  // Cold start configuration
  coldStart: {
    validateBeforeExecute: true,
    maxConfigErrors: 0, // zero tolerance
    requireProofSystem: true,
    requiredValidations: [
      'nodeIds',
      'shardCount',
      'replicationFactor',
      'network',
      'dependencies'
    ]
  },

  // Shard and replication configuration
  sharding: {
    defaultShardCount: 3,
    defaultReplicationFactor: 3,
    minNodesPerShard: 1,
    maxNodesPerShard: 10,
    loadImbalanceThreshold: 0.3, // 30%
    minRebalanceBenefit: 0.05 // 5%
  },

  // Lock configuration
  locks: {
    quorumRequirement: 'MAJORITY', // MAJORITY | CONSENSUS | CUSTOM
    lockTimeoutMs: 30000,
    deadlockDetectionIntervalMs: 5000,
    maxLockWaitTime: 60000,
    lockReleaseGracePeriodMs: 1000
  },

  // Proof system configuration
  proofs: {
    maxProofLogSize: 50000,
    sha256Deterministic: true,
    chainVerificationRequired: true,
    appendOnlyEnforced: true,
    compressionEnabled: false
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'INFO',
    enableDetailedTimestamps: true,
    enableStackTraces: true,
    maxLogSize: 1000,
    logStorageMs: 3600000 // 1 hour
  },

  // Hash configuration
  hash: {
    algorithm: 'sha256',
    encoding: 'hex',
    canonicalForm: 'JSON.stringify sorted keys',
    deterministicSeed: 'CITOYEN_AVISÉ_KERNEL_PHASE_9'
  },

  // Invariant enforcement
  invariants: {
    enforcementDeterminism: {
      enabled: true,
      checkOnEveryDecision: true
    },
    proofImmutability: {
      enabled: true,
      freezeAfterCreation: true
    },
    globalIdempotency: {
      enabled: true,
      checkDuplicates: true
    },
    shardDeterminism: {
      enabled: true,
      consistentHashingRequired: true
    },
    recoveryNonBlocking: {
      enabled: true,
      allowParallelRecovery: true
    },
    realtimeSourceOfTruth: {
      enabled: true,
      proofSystemGovernsDecisions: true
    },
    observabilityReadOnly: {
      enabled: true,
      noObservableModifiesExecution: true
    },
    deterministicRouting: {
      enabled: true,
      sameIdSameShard: true
    },
    objectImmutability: {
      enabled: true,
      freezeAllCriticalObjects: true
    },
    replayIntegrity: {
      enabled: true,
      reconstructionMustMatch: true
    },
    lockQuorumSafety: {
      enabled: true,
      singleOwnershipEnforced: true
    },
    failureCoverage: {
      enabled: true,
      allFailuresMustBeCovered: true
    }
  },

  // Feature flags
  features: {
    enableCompressionInLogs: false,
    enableAdvancedRebalancing: true,
    enableConflictResolution: true,
    enableAsyncRecovery: false, // keep sync for now
    enableMetricsAggregation: true
  },

  // Thresholds and limits
  limits: {
    maxNodesInCluster: 100,
    maxShardsPerNode: 20,
    maxEventsPerRebuild: 10000,
    maxProofChainLength: 50000,
    maxConcurrentOperations: 100,
    maxMemoryUsageMb: 2048
  },

  // Validation rules
  validation: {
    nodeIdFormat: /^[a-zA-Z0-9_-]+$/, // alphanumeric, underscore, hyphen
    minNodeIdLength: 1,
    maxNodeIdLength: 255,
    minShardCount: 1,
    maxShardCount: 1000,
    minReplicationFactor: 1,
    maxReplicationFactor: 10
  }
};
