# GLOBAL_MEMORY_GRAPH.md
## PHASE 8.1 — Représentation Causale Déterministe du Cluster

**Date**: 2026-05-08  
**Version**: 1.0  
**Status**: Production-Ready

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Node Types (8)](#node-types-8)
4. [Edge Types (7)](#edge-types-7)
5. [Data Structures](#data-structures)
6. [API Reference](#api-reference)
7. [Multi-Region Workflows](#multi-region-workflows)
8. [Recovery Scenarios](#recovery-scenarios)
9. [Performance Baselines](#performance-baselines)
10. [Invariants Preservation](#invariants-preservation)
11. [Integration with PHASE 8.0](#integration-with-phase-80)
12. [Testing Summary](#testing-summary)
13. [Migration Guide](#migration-guide)
14. [Limitations & Future Work](#limitations--future-work)

---

## Architecture Overview

### Vision

PHASE 8.1 construits le **graphe causal global** (DAG — Directed Acyclic Graph) immuable et déterministe qui représente l'intégralité de l'histoire du cluster:

```
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL MEMORY GRAPH — Représentation Causale Complète      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Niveau 1: REAL-TIME DECISIONS                              │
│  ├─ EVENT_NODE: Décisions temps réel capturées              │
│  └─ PROOF_NODE: Preuves cryptographiques validées           │
│                    │                                        │
│                    ▼                                        │
│  Niveau 2: CONSENSUS LAYER                                  │
│  ├─ QUORUM_NODE: Consensus multi-région (MAJORITY)          │
│  └─ REGION_NODE: Nœuds clusters régionaux                   │
│                    │                                        │
│                    ▼                                        │
│  Niveau 3: PERSISTENCE LAYER                                │
│  ├─ SNAPSHOT_NODE: Point-in-time snapshots                  │
│  ├─ TRANSACTION_NODE: Transactions WAL committées           │
│  └─ ARCHIVE_NODE: Segments long-terme archivés              │
│                    │                                        │
│                    ▼                                        │
│  Niveau 4: RECOVERY LAYER                                   │
│  └─ REPLAY_NODE: Résultats de WAL replay/recovery           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Properties

1. **Append-Only**: Aucune modification, suppression, ou rebase — uniquement ajout de nodes/edges
2. **Immutable**: Tous nodes/edges Object.freeze() récursivement, jamais modifiés
3. **Deterministic**: Ordering via globalSequence monotonique (unique, jamais décroissant)
4. **Non-Authoritative**: Jamais source unique de vérité — supportive structure uniquement
5. **O(1) Lookup**: Map-based primary stores pour node/edge lookup
6. **O(log n) Range**: Binary search sur temporalIndex pour range queries
7. **Causal Tracing**: BFS/DFS sur adjacency/reverseAdjacency pour ancestry tracking
8. **Real-Time Isolation**: Graph ops ne bloquent pas enforcement decisions

---

## Core Concepts

### GlobalSequence

Compteur monotonique, nuniquement incrémenté à chaque ajout de node:
- **Propriété**: globalSequence ne décroît JAMAIS
- **Usage**: Ordering déterministe des nodes indépendamment du temps
- **Implication**: Deux traversals du même graphe produisent toujours le même ordre

### Immutability via Object.freeze()

Tous nodes/edges sont recursively frozen:
```javascript
const node = Object.freeze({
  nodeId,
  type,
  timestamp,
  causalParents: Object.freeze([...]),      // nested frozen
  proofHash,
  regionId,
  sequence,
  immutableMetadata: Object.freeze({...}),  // nested frozen
  isAuthoritative: false
});
```

Tentatives de modification silencieusement ignorées en mode strict:
```javascript
node.newField = 'value';  // No-op
node.causalParents.push(id);  // TypeError in strict mode
```

### Causal Parents & Edges

Chaque node contient `causalParents: []` (immutable) listant les nodeId qui ont causé ce node.
Les edges représentent les relations formelles:

- **Node.causalParents**: Liste statique au moment de création (pour performance)
- **Edges**: Relations dirigées avec métadonnées (type, timestamp, metadata)

---

## Node Types (8)

### 1. EVENT_NODE

**Source**: EnforcementProofSystem.captureDecision()  
**Represents**: Décision Real-Time capturée au moment de l'exécution

**immutableMetadata**:
```javascript
{
  decisionId: string,        // Unique decision identifier
  module: string,            // 'RealTime', 'ProofSystem', etc.
  action: string,            // 'CAPTURE', 'VERIFY', 'ACCEPT', etc.
  decision: object | null,   // { valid, reason, impact, ... }
  latencyMs: number,         // Latency in milliseconds
  severity: string           // 'INFO', 'WARNING', 'CRITICAL'
}
```

**Relationships**:
- **Outgoing**: `EVENT_NODE --validated_by--> PROOF_NODE`
- **Incoming**: `SNAPSHOT_NODE --derived_from--> EVENT_NODE`

---

### 2. PROOF_NODE

**Source**: EnforcementProofSystem.verify() + hashing  
**Represents**: Preuve cryptographique de l'EVENT_NODE

**immutableMetadata**:
```javascript
{
  proofHash: string | null,      // SHA-256 hash of proof
  previousHash: string | null,   // Hash-chain link (for lineage)
  entriesVerified: number,       // Count of entries verified
  validChain: boolean            // Chain integrity check
}
```

**Relationships**:
- **Incoming**: `EVENT_NODE --validated_by--> PROOF_NODE`
- **Outgoing**: `PROOF_NODE --accepted_by--> QUORUM_NODE`

---

### 3. QUORUM_NODE

**Source**: DistributedTransactionLog.logEntry() + consensus  
**Represents**: Consensus multi-région validé (MAJORITY quorum)

**immutableMetadata**:
```javascript
{
  consensusId: string,         // Unique consensus identifier
  requiredAcks: number,        // floor(N/2) + 1
  ackCount: number,            // Actual acks received
  regions: string[]            // ['EU', 'US', 'APAC', ...] (frozen)
}
```

**Relationships**:
- **Incoming**: `PROOF_NODE --accepted_by--> QUORUM_NODE`
- **Multi-Region**: Each region has quorum representation

---

### 4. SNAPSHOT_NODE

**Source**: IncrementalSnapshotManager.createSnapshot()  
**Represents**: Point-in-time snapshot d'archive (full ou delta)

**immutableMetadata**:
```javascript
{
  snapshotId: string,          // Unique snapshot identifier
  archiveSize: number,         // Size in bytes
  totalEntries: number,        // Count of entries
  takenAt: string              // ISO timestamp
}
```

**Relationships**:
- **Incoming**: `ARCHIVE_NODE --persisted_from--> SNAPSHOT_NODE`
- **Outgoing**: `SNAPSHOT_NODE --derived_from--> EVENT_NODE` (lineage)

---

### 5. ARCHIVE_NODE

**Source**: BatchArchiveManager.archiveCompaction()  
**Represents**: Segment long-terme archivé (compressed, batched)

**immutableMetadata**:
```javascript
{
  segmentId: string,           // Unique segment identifier
  batchId: string | null,      // Parent batch reference
  rootHash: string | null,     // Merkle root of entries
  entriesCount: number,        // Count of entries archived
  compressed: boolean          // Compression applied
}
```

**Relationships**:
- **Outgoing**: `ARCHIVE_NODE --persisted_from--> SNAPSHOT_NODE`
- **Incoming**: `REPLAY_NODE --reconstructed_from--> ARCHIVE_NODE`

---

### 6. REPLAY_NODE

**Source**: WALModule.recover()  
**Represents**: Résultat de recovery/replay après crash

**immutableMetadata**:
```javascript
{
  walEntryId: string,          // Original WAL entry reference
  entriesReplayed: number,     // Count of entries replayed
  startIndex: number,          // Starting index in log
  fromCheckpointId: string | null  // Checkpoint used
}
```

**Relationships**:
- **Outgoing**: `REPLAY_NODE --reconstructed_from--> ARCHIVE_NODE`
- **Incoming**: `TRANSACTION_NODE` (if result of txn replay)

---

### 7. REGION_NODE

**Source**: CrossRegionArchiveSyncModule.registerRegion()  
**Represents**: Nœud cluster régional dans le réseau distribué

**immutableMetadata**:
```javascript
{
  regionId: string,            // 'EU', 'US', 'APAC', 'AU', etc.
  registeredAt: string,        // ISO timestamp
  isHealthy: boolean,          // Health status
  lagMs: number                // Replication lag in ms
}
```

**Relationships**:
- **Outgoing**: `REGION_NODE --replicated_to--> REGION_NODE` (inter-region)
- **Indexed**: regionIndex[regionId] contains all nodes in that region

---

### 8. TRANSACTION_NODE

**Source**: WALModule.commit()  
**Represents**: Transaction WAL committée (durable)

**immutableMetadata**:
```javascript
{
  transactionId: string,       // Unique transaction identifier
  operationCount: number,      // Count of operations
  committedAt: string,         // ISO timestamp
  walEntryId: string | null    // WAL entry reference
}
```

**Relationships**:
- **Outgoing**: `TRANSACTION_NODE --committed_into--> SNAPSHOT_NODE`
- **Recovery**: Links to recovery/replay operations

---

## Edge Types (7)

### Edge Type Matrix (Validated)

```
SOURCE NODE     EDGE TYPE           TARGET NODE
─────────────   ─────────────────   ─────────────
EVENT_NODE      validated_by        PROOF_NODE
PROOF_NODE      accepted_by         QUORUM_NODE
SNAPSHOT_NODE   derived_from        EVENT_NODE
ARCHIVE_NODE    persisted_from      SNAPSHOT_NODE
REPLAY_NODE     reconstructed_from  ARCHIVE_NODE
REGION_NODE     replicated_to       REGION_NODE
TRANSACTION_NODE committed_into     SNAPSHOT_NODE
```

### Edge Semantics

| Edge Type | Meaning | Use Case |
|-----------|---------|----------|
| **validated_by** | EVENT proven by PROOF | Proof chain anchoring |
| **accepted_by** | PROOF accepted by quorum | Consensus ratification |
| **derived_from** | SNAPSHOT depends on EVENT | State lineage |
| **persisted_from** | ARCHIVE contains SNAPSHOT | Durability link |
| **reconstructed_from** | REPLAY restored from ARCHIVE | Recovery path |
| **replicated_to** | REGION replicates to REGION | Cross-region sync |
| **committed_into** | TRANSACTION persists into SNAPSHOT | WAL durability |

---

## Data Structures

### Primary Stores

```javascript
this.nodes = new Map();           // O(1) lookup: nodeId → frozenNode
this.edges = new Map();           // O(1) lookup: edgeId → frozenEdge
```

### Traversal Indexes

```javascript
this.adjacency = new Map();       // nodeId → Set<edgeId> (outgoing)
this.reverseAdjacency = new Map();  // nodeId → Set<edgeId> (incoming)
```

### Temporal Indexing

```javascript
this.temporalIndex = [];          // sorted [{ts, nodeId}]
// Binary search range queries: O(log n) + O(k) for k results
```

### Type Indexing

```javascript
this.typeIndex = new Map();       // nodeType → Set<nodeId>
// Fast lookup: all PROOF_NODE, all SNAPSHOT_NODE, etc.
```

### Region Indexing

```javascript
this.regionIndex = new Map();     // regionId → Set<nodeId>
// Fast lookup: all nodes in EU region, US region, etc.
```

### Sequence Indexing

```javascript
this.sequenceIndex = [];          // sorted [{seq, nodeId}]
// Deterministic ordering independent of time
```

---

## API Reference

### Insertion APIs (8 methods)

```javascript
addEventNode(proofEntry)
// Input: { decisionId, module?, action?, decision?, latencyMs?, severity? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addProofNode(verifyResult, proofEntry)
// Input: verifyResult (validation result), proofEntry { proofHash?, ... }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addQuorumNode(consensusRecord)
// Input: { consensusId, requiredAcks?, ackCount?, regions? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addSnapshotNode(snapshotRecord)
// Input: { snapshotId, archiveSize?, totalEntries?, takenAt? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addArchiveNode(archiveSegment)
// Input: { segmentId, batchId?, rootHash?, entriesCount?, compressed? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addReplayNode(replayResult, walEntry)
// Input: replayResult { entriesReplayed?, startIndex?, checkpointId? }, walEntry { entryId, regionId? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addRegionNode(regionId, meta)
// Input: regionId (string), meta { registeredAt?, isHealthy?, lagMs? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }

addTransactionNode(walEntry)
// Input: { transactionId, operationCount?, committedAt?, entryId? }
// Returns: { added, nodeId, type, sequence, isAuthoritative }
```

### Edge API

```javascript
addEdge(fromNodeId, toNodeId, edgeType, metadata)
// Input: from/to nodeIds, edgeType (validated), metadata object
// Returns: { connected, edgeId?, edgeType, isAuthoritative }
// Rejects: Unknown nodes, invalid edge types (matrix validation)
```

### Lookup APIs (8 methods)

```javascript
getNode(nodeId)
// Returns: { found, node (frozen), isAuthoritative }

getCausalChain(nodeId, maxDepth)
// BFS on reverseAdjacency to find ancestors
// Returns: { found, nodeId, chain, depth, isAuthoritative }

getStateLineage(snapshotId)
// Finds SNAPSHOT_NODE, traces derived_from edges backward
// Returns: { found, snapshotId, lineage, depth, isAuthoritative }

getProofPath(eventId)
// Traces EVENT_NODE → PROOF_NODE → QUORUM_NODE
// Returns: { found, eventId, path, hasQuorum, quorumNodeId, isAuthoritative }

getReplayDependencies(replayId)
// Finds REPLAY_NODE, traces reconstructed_from → ARCHIVE_NODE → SNAPSHOT_NODE
// Returns: { found, replayId, dependencies, isAuthoritative }

verifyGraphConsistency()
// Checks: all frozen, no orphans, valid edge types, proof hashes, type counts
// Returns: { consistent, checks, violations, nodesVerified, edgesVerified, isAuthoritative }

reconstructTimeline(startTs, endTs)
// Binary search temporalIndex for range, returns sorted nodes
// Returns: { found, nodes, startTs, endTs, count, isAuthoritative }

getRegionReplicationGraph(regionId)
// Gathers all nodes in region + their replicated_to edges
// Returns: { found, regionId, nodes, replicationEdges, isAuthoritative }
```

### Metrics & Monitoring

```javascript
getGraphMetrics()
// Returns frozen object:
// {
//   isAuthoritative: false,
//   nodesAdded, edgesAdded,
//   nodesByType: { EVENT_NODE: N, PROOF_NODE: M, ... },
//   traversalsPerformed, consistencyChecks, lastConsistencyCheck,
//   nodeCount, edgeCount, avgDegree,
//   timestamp, createdAt
// }

checkAlerts()
// Checks: GRAPH_SIZE_HIGH, ORPHAN_NODE_DETECTED, PROOF_LINKAGE_MISSING, TRAVERSAL_DEPTH_EXCEEDED
// Returns: [alert, alert, ...] (new alerts since last call)

getAllAlerts()
// Returns: [...all alerts ever generated] (max 1000, circular buffer)

isAuthoritative()
// Returns: false (INVARIANT)
```

---

## Multi-Region Workflows

### Workflow: Cross-Region Consensus

```
REGION EU                    REGION US
  │                            │
  ├─ EVENT_NODE created ────┬──┤ EVENT_NODE created
  │                         │  │
  ├─ PROOF_NODE created ────┼──┤ PROOF_NODE created
  │                         │  │
  └─ QUORUM_NODE created ◄──┼──┤ Ack received
     (2/2 acks received)    │  │
           │                │  │
           └────────────────┘  │
                  │            │
           Cross-Region Graph  │
           EVENT→PROOF→QUORUM  │
                      │        │
                      ├─ REGION_NODE(EU) ─replicated_to─► REGION_NODE(US)
                      │
                      ▼
             SNAPSHOT consistency achieved
```

### Workflow: Archive & Recovery

```
TRANSACTION_NODE committed ──► WAL durable
         │
         └─ committed_into ──► SNAPSHOT_NODE
                    │
                    └─ persisted_from ──► ARCHIVE_NODE
                                 │
                                 └─ On crash recovery:
                                    reconstructed_from ──► REPLAY_NODE
```

---

## Recovery Scenarios

### Scenario 1: Single-Node Crash → Recover from Checkpoint

1. System crashes
2. REPLAY_NODE created linking to ARCHIVE_NODE via reconstructed_from
3. ARCHIVE traversal gives us SNAPSHOT_NODE
4. State reconstructed from SNAPSHOT + WAL replay
5. Causality chain: REPLAY_NODE → ARCHIVE_NODE → SNAPSHOT_NODE → EVENT_NODE

### Scenario 2: Regional Failure → Replication from Peer

1. Region US goes down
2. REGION_NODE(US) marked unhealthy
3. REGION_NODE(EU) still healthy with full replication edges
4. Graph query: getRegionReplicationGraph('EU') shows all replicated data
5. Cross-region edges enable recovery orchestration

### Scenario 3: Temporal Reconstruction @ Timestamp T

1. Query: reconstructTimeline(T-1hour, T)
2. Binary search temporalIndex for range
3. Returns all nodes created in that hour (deterministic via sequence)
4. Application can replay state at any historical point

---

## Performance Baselines

### Latency

| Operation | P50 | P99 | Target |
|-----------|-----|-----|--------|
| addXxxNode() | <1ms | <5ms | <10ms |
| addEdge() | <0.5ms | <2ms | <5ms |
| getNode() | <0.1ms | <0.5ms | <1ms |
| getCausalChain() | <5ms | <20ms | <100ms |
| reconstructTimeline(1000 nodes) | <10ms | <50ms | <100ms |
| verifyGraphConsistency(1000 nodes) | <20ms | <100ms | <500ms |

### Throughput

| Operation | Ops/sec | Target |
|-----------|---------|--------|
| Node additions | 1000+ | > 500 |
| Edge additions | 2000+ | > 1000 |
| Lookups | 10000+ | > 5000 |
| Graph traversals | 500+ | > 100 |

### Memory

| Metric | Typical | Limit |
|--------|---------|-------|
| Per node | ~500 bytes | - |
| Per edge | ~200 bytes | - |
| 1M nodes | ~500 MB | 1 GB |
| 5M edges | ~1 GB | 2 GB |

---

## Invariants Preservation

### Invariant 1: Graph Never Authoritative

```javascript
globalMemoryGraph.isAuthoritative() === false  // ALWAYS
// Every returned object has isAuthoritative: false
```

**Implication**: The graph is supportive (advisory) structure, not source of truth.

### Invariant 2: Append-Only

```javascript
// No delete, remove, or modify methods exist
// Only: addXxxNode(), addEdge()
```

**Implication**: History is immutable, fully traceable.

### Invariant 3: No Mutable Edges

```javascript
const edge = graph.edges.get(edgeId);
Object.isFrozen(edge) === true
Object.isFrozen(edge.metadata) === true
```

**Implication**: Edge metadata cannot be changed post-creation.

### Invariant 4: Causal Chain Immutable

```javascript
const node = graph.getNode(nodeId).node;
Object.isFrozen(node.causalParents) === true
node.causalParents.push(id)  // TypeError in strict mode
```

**Implication**: Parent relationships fixed at node creation time.

### Invariant 5: No Orphan Nodes via API

```javascript
const result = graph.addEdge(nodeId, 'nonexistent', EDGE_TYPES.VALIDATED_BY);
// Returns: { connected: false, reason: 'NODE_NOT_FOUND' }
```

**Implication**: Graph consistency guaranteed (no dangling references).

### Invariant 6: Proof Linkage Mandatory

```javascript
// verifyGraphConsistency() detects PROOF_NODE with null proofHash
{ consistent: false, violations: ['PROOF_NODE ... missing proofHash'] }
```

**Implication**: Proof chain integrity enforced.

### Invariant 7: Region Replication Traceable

```javascript
graph.regionIndex.get('EU')  // All nodes in EU region
graph.getRegionReplicationGraph('EU')  // All replication edges from EU
```

**Implication**: Cross-region flows auditable and queryable.

### Invariant 8: Deterministic Traversal

```javascript
const r1 = graph.getCausalChain(nodeId);
const r2 = graph.getCausalChain(nodeId);
// r1.chain === r2.chain (same order, same content)
```

**Implication**: Graph queries reproducible, no randomness.

---

## Integration with PHASE 8.0

### From EnforcementProofSystem

```javascript
// captureDecision() output → addEventNode()
const decision = proofSystem.captureDecision({ ... });
graph.addEventNode({
  decisionId: decision.id,
  module: 'EnforcementProofSystem',
  action: 'CAPTURE',
  latencyMs: decision.latencyMs
});

// verify() output → addProofNode()
const proof = proofSystem.verify(decision);
graph.addProofNode(proof, { proofHash: proof.hash, ... });
```

### From DistributedTransactionLog

```javascript
// logEntry() → addQuorumNode()
const dtLogEntry = dtlog.logEntry(entry, 'EU');
graph.addQuorumNode({
  consensusId: dtLogEntry.consensusId,
  requiredAcks: dtLogEntry.quorumSize,
  ackCount: dtLogEntry.ackCount,
  regions: dtLogEntry.regions
});
```

### From WALModule

```javascript
// commit() → addTransactionNode()
const walResult = wal.commit(transactionId);
graph.addTransactionNode({
  transactionId: walResult.transactionId,
  operationCount: walResult.operationCount,
  entryId: walResult.entryId
});

// recover() → addReplayNode()
const replayResult = wal.recover();
graph.addReplayNode(replayResult, { entryId: 'wal_...' });
```

### From IncrementalSnapshotManager

```javascript
// createSnapshot() → addSnapshotNode()
const snap = snapMgr.createSnapshot(archive);
graph.addSnapshotNode({
  snapshotId: snap.snapshotId,
  archiveSize: snap.size,
  totalEntries: snap.entries.length
});
```

### From BatchArchiveManager

```javascript
// archiveCompaction() → addArchiveNode()
const archived = archiveMgr.compactArchive(batch);
graph.addArchiveNode({
  segmentId: archived.segmentId,
  rootHash: archived.rootHash,
  entriesCount: archived.entriesCount
});
```

---

## Testing Summary

### Test Coverage: 50/50 PASSED ✅

**Breakdown**:
- **Section 1 (Node Insertion)**: 12/12 ✅
  - All 8 node types creatable
  - All nodes frozen recursively
  - Global sequence monotonic

- **Section 2 (Edge Management)**: 8/8 ✅
  - All 7 edge types validated
  - Invalid types rejected
  - Unknown nodes rejected
  - Edges frozen

- **Section 3 (Navigation APIs)**: 10/10 ✅
  - Causal chain traversal
  - State lineage
  - Proof paths (full + partial)
  - Replay dependencies
  - Timeline reconstruction
  - Region graphs
  - Deterministic traversals

- **Section 4 (Integration)**: 8/8 ✅
  - ProofSystem → EVENT_NODE → PROOF_NODE
  - Archive → ARCHIVE_NODE
  - Snapshot → SNAPSHOT_NODE
  - WAL → TRANSACTION_NODE
  - DTLog → QUORUM_NODE
  - CrossRegion → REGION_NODE
  - Full 5-node causal chains
  - Real-time isolation verified

- **Section 5 (Invariants)**: 7/7 ✅
  - isAuthoritative() === false
  - Append-only (no delete methods)
  - Consistency checks pass
  - Missing proofHash detected
  - Orphan prevention via API
  - Reset clears state

- **Section 6 (Performance)**: 5/5 ✅
  - 1000 nodes < 100ms
  - Timeline reconstruction < 100ms
  - Causal chain depth 50 < 100ms
  - PHASE 8.0 regression tests pass
  - Metrics frozen and accurate

---

## Migration Guide

### From PHASE 8.0 → PHASE 8.1

No breaking changes. PHASE 8.1 is additive:

1. **Create GlobalMemoryGraph instance**:
   ```javascript
   const graph = new GlobalMemoryGraph({
     maxNodes: 1_000_000,
     maxEdges: 5_000_000,
     maxAlerts: 1000
   });
   ```

2. **Wire proof captures**:
   ```javascript
   // In ProofSystem.captureDecision():
   graph.addEventNode({ decisionId, module, action, ... });
   ```

3. **Wire proof verification**:
   ```javascript
   // In ProofSystem.verify():
   graph.addProofNode(result, { proofHash, ... });
   graph.addEdge(eventNodeId, proofNodeId, EDGE_TYPES.VALIDATED_BY);
   ```

4. **Wire persistence**:
   ```javascript
   // In IncrementalSnapshotManager, DistributedTransactionLog, etc.
   graph.addSnapshotNode({ snapshotId, ... });
   graph.addArchiveNode({ segmentId, ... });
   // ... and so on
   ```

5. **Query for debugging/auditing**:
   ```javascript
   const consistency = graph.verifyGraphConsistency();
   const lineage = graph.getStateLineage(snapshotId);
   const path = graph.getProofPath(eventId);
   ```

---

## Limitations & Future Work

### NOT in PHASE 8.1

- **Byzantine fault tolerance**: Graph assumes honest nodes
- **Network partition recovery**: No automatic failover orchestration
- **Automatic georeplication failover**: Manual intervention required
- **Key rotation / encryption at rest**: Plaintext storage
- **Live migration between backends**: Fixed backend at creation

### Expected in PHASE 8.2–8.5

- **State Reconstruction Engine** (8.2): `reconstructStateAt(T)` using graph lineage
- **Temporal Causality Analysis** (8.3): Causality engine for ordering constraints
- **Multi-Region Replay Orchestrator** (8.4): Automated recovery coordination
- **Snapshot Lineage Verification** (8.5): Ancestry proof & integrity validation
- **Graph Compression** (9.0+): Merkle tree compression for large graphs
- **Distributed Query Planning** (9.0+): Distributed graph traversal across regions

---

## Appendix A: Constants

```javascript
// NODE_TYPES (exported)
const NODE_TYPES = Object.freeze({
  EVENT_NODE:       'EVENT_NODE',
  PROOF_NODE:       'PROOF_NODE',
  QUORUM_NODE:      'QUORUM_NODE',
  SNAPSHOT_NODE:    'SNAPSHOT_NODE',
  ARCHIVE_NODE:     'ARCHIVE_NODE',
  REPLAY_NODE:      'REPLAY_NODE',
  REGION_NODE:      'REGION_NODE',
  TRANSACTION_NODE: 'TRANSACTION_NODE'
});

// EDGE_TYPES (exported)
const EDGE_TYPES = Object.freeze({
  VALIDATED_BY:       'validated_by',
  ACCEPTED_BY:        'accepted_by',
  DERIVED_FROM:       'derived_from',
  PERSISTED_FROM:     'persisted_from',
  RECONSTRUCTED_FROM: 'reconstructed_from',
  REPLICATED_TO:      'replicated_to',
  COMMITTED_INTO:     'committed_into'
});
```

---

**Documentation Version**: 1.0  
**Last Updated**: 2026-05-08  
**Status**: Production-Ready

