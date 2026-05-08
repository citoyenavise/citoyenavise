# RUNBOOK — Distributed Batch Processing (PHASE 7.1)

## Vue d'ensemble

Le moteur de batch distribué (`DistributedBatchEngine`) orchestre la couche batch sur l'ensemble du cluster. Chaque nœud exécute indépendamment son `EnforcementProofSystem` + `BatchLayerOptimization`. Le moteur assure le routage déterministe, la réplication asynchrone, et l'agrégation des métriques.

**Architecture distribuée in-memory** : simulation de cluster sans sockets, pattern cohérent avec Phase60-70-72.

---

## Architecture Cluster

```
┌──────────────────────────────────────────────────────────────┐
│           DistributedBatchEngine (Orchestrateur)             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  BatchNode-1    │  │  BatchNode-2    │  │ BatchNode-3│  │
│  ├─────────────────┤  ├─────────────────┤  ├────────────┤  │
│  │ ProofSystem     │  │ ProofSystem     │  │ ProofSys   │  │
│  │ BatchLayer      │  │ BatchLayer      │  │ BatchLayer │  │
│  │ (shard_0)       │  │ (shard_1)       │  │ (shard_2)  │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
│       ↑ Real-Time            ↑                    ↑          │
│       │ (immutable)          │ Async Replication │          │
│       ←─────────────────────────────────────────────        │
│                                                              │
│  Routing : SHA-256 + modulo → deterministic                │
│  Metrics : aggregated per-node + cluster-wide              │
│  Proofs : ProofChainConsolidator.buildGlobalRoot()         │
└──────────────────────────────────────────────────────────────┘
```

### Flux de décision

1. **Capture distribuée** : `engine.captureDistributed(context)`
2. **Routing déterministe** : SHA-256 hash de decisionId % shardCount
3. **Enregistrement Real-Time** : `node.proofSystem.captureDecision()` (synchrone)
4. **Réplication async** : `setImmediate()` vers nœuds pairs (non-bloquant)
5. **Batch observabilité** : `node.batchLayer` agrège localement

---

## API Opérationnelle

### 1. Enregistrement nœud

```javascript
const engine = new DistributedBatchEngine({ shardCount: 3, replicationFactor: 1 });

const result = engine.registerNode('batch-node-1', {
  proofSystemOptions: { maxProofLogSize: 50000 },
  batchOptions: { violationRatePercent: 30 },
  maxBatchSize: 5000,
  region: 'eu-west-1'
});
// → { registered: true, nodeId: 'batch-node-1', shardsAssigned: 1 }
```

### 2. Capture distribuée

```javascript
const result = engine.captureDistributed({
  module: 'HardenedEventBus',
  action: 'validateEvent',
  ruleEvaluated: 'event_schema_valid + source_matches',
  input: { eventType: 'OrderCreated' },
  result: { valid: true },
  severity: 'INFO',
  enforcementLayer: 'EVENT_BUS',
  startTime: Date.now() - 5
});
// → { captured: true, nodeId: 'batch-node-2', shardId: 'shard_1' }
```

### 3. Métriques cluster

```javascript
const metrics = engine.getClusterMetrics();
// {
//   isAuthoritative: false,
//   clusterTotals: {
//     totalCaptured: 1000,
//     totalViolations: 50,
//     violationRatePercent: 5,
//     totalDecisionsRouted: 1000,
//     totalDecisionsReplicated: 400,
//     nodeFailovers: 0,
//     totalProofErrors: 0
//   },
//   clusterStatus: {
//     activeNodes: 3,
//     totalNodes: 3,
//     shardCount: 3,
//     shardDistribution: {
//       'batch-node-1': ['shard_0'],
//       'batch-node-2': ['shard_1'],
//       'batch-node-3': ['shard_2']
//     }
//   },
//   perNode: {
//     'batch-node-1': { status, chainLength, totalCaptured, ... },
//     'batch-node-2': { ... },
//     'batch-node-3': { ... }
//   },
//   timestamp: '2026-05-08T...'
// }
```

### 4. Alerting cluster-wide

```javascript
const alerts = engine.checkClusterAlerts();
// Union de toutes les alertes per-nœud :
// [
//   { type: 'VIOLATION_RATE', nodeId: 'batch-node-1', severity: 'WARNING', ... },
//   { type: 'LATENCY_P95', nodeId: 'batch-node-2', severity: 'WARNING', ... }
// ]
```

### 5. Consolidation de preuves

```javascript
const consolidated = engine.consolidateClusterProofs();
// → {
//   rootHash: 'sha256hash...',
//   nodesConsolidated: 3,
//   isAuthoritative: false,
//   timestamp: '2026-05-08T...'
// }
```

### 6. Failover d'un nœud

```javascript
// Détecte une panne
const crashResult = engine.simulateNodeCrash('batch-node-2');
// → { crashed: true, nodeId: 'batch-node-2', redistributed: 1 }

// OU désenregistrer proprement
const removeResult = engine.unregisterNode('batch-node-2');
// → { removed: true, nodeId: 'batch-node-2', redistributed: 1 }
```

---

## Distributed Batch Metrics

### Per-Node Metrics

| Métrique | Description |
|----------|-------------|
| `status` | ACTIVE / DEGRADED / FAILED |
| `chainLength` | Taille du proofLog real-time (authoritative) |
| `totalCaptured` | Total decisions captured by this node |
| `successCount` | ALLOWED decisions |
| `violationCount` | BLOCKED decisions |
| `batchQueueDepth` | Current batch buffer size |
| `batchFlushed` | Cumulative batch compactions |
| `batchAutoCompactCount` | Auto-compactions triggered (overflow) |
| `lastFlushTimestamp` | ISO datetime of last flush |
| `lastFlushDurationMs` | Duration of last compactProofs() |
| `proofSystemErrors` | Internal errors (should be 0) |
| `decisionsRouted` | Decisions routed TO this node |
| `decisionsReplicated` | Decisions replicated FROM this node to peers |

### Cluster-Level Totals

| Métrique | Description |
|----------|-------------|
| `totalCaptured` | Sum across all active nodes |
| `totalViolations` | Sum of violations |
| `violationRatePercent` | totalViolations / totalCaptured * 100 |
| `totalDecisionsRouted` | Total routed by engine |
| `totalDecisionsReplicated` | Total async replication events |
| `nodeFailovers` | Count of simulated crashes |
| `totalProofErrors` | Should stay 0 |

### Shard Distribution

```javascript
shardDistribution: {
  'batch-node-1': ['shard_0'],
  'batch-node-2': ['shard_1', 'shard_2'], // après failover
  'batch-node-3': []  // après crash
}
```

---

## Monitoring & Alerting

### Seuils recommandés par charge

| Profil | Violation Rate | p95 Latency | Queue Fill | Action |
|--------|---|---|---|---|
| Léger (< 100 ops/sec) | 50% | 200ms | 95% | Warn si dépassé |
| Moyen (100-1k) | 30% | 100ms | 90% | Alert sévérité WARNING |
| Élevé (1k-10k) | 20% | 50ms | 85% | Alert sévérité CRITICAL |
| Critique (> 10k) | 10% | 25ms | 80% | Escalade immédiate |

### Procédure Alert CRITICAL : Batch Queue Full

```
SYMPTÔME: engine.getClusterMetrics().clusterStatus.shardDistribution vide pour un nœud

DIAGNOSTIC:
1. Vérifier batchAutoCompactCount — croît rapidement ? (> 5/min ?)
2. Vérifier lastFlushDurationMs — flush prend trop longtemps ? (> 100ms ?)
3. Vérifier batchQueueDepth — reste élevé après flush ?

ACTIONS:
- Augmenter maxBatchBufferSize (par défaut 5000) → 10000
- Réduire flushThreshold (par défaut 80%) → 60%
- Vérifier qu'aucun consumer de batch n'est bloqué
- Envisager réplication factor ↓ (moins de copies)

POST-ACTION:
- Monitorer batchAutoCompactCount (devrait ↓ à < 2/min)
- Monitorer queue fill % (devrait rester < 50%)
```

### Procédure Alert CRITICAL : Node Crash

```
SYMPTÔME: engine.getClusterStatus().activeNodes < totalNodes

DIAGNOSTIC:
1. Vérifier node.status === 'FAILED'
2. Vérifier que shards ont été redistribués
3. Vérifier proofSystemErrors count pour les nœuds restants

ACTIONS:
- Appeler engine.unregisterNode(failedNodeId) (si pas auto-detect)
- Vérifier que captureDistributed() reroute vers nœuds actifs
- Monitorer verify().valid sur tous les nœuds actifs

POST-ACTION:
- Relancer le nœud crash : engine.registerNode(nodeId)
- Monitorer consolidateClusterProofs() pour convergence
```

---

## Troubleshooting

### Node Status DEGRADED

```
CAUSE: Node opérationnel mais metrics dégradées
SIGNES: proofSystemErrors > 0, p95 latency spike

REMÈDE:
1. Vérifier available memory du nœud
2. Réduire maxBatchSize (par défaut 5000) → 2500
3. Réduire proofLog capacity (par défaut 50000) → 10000
```

### Replication Lag

```
CAUSE: Async replication stale (totalDecisionsReplicated << totalDecisionsRouted)
SIGNES: decisionsReplicated per-nœud << decisionsRouted

REMÈDE:
- Réduire replicationFactor (moins de replicas = plus rapide)
- Monitorer proofSystemErrors — peut bloquer setImmediate()
- Augmenter node event loop frequency (OS tuning)
```

### Consolidation Stale Root Hash

```
CAUSE: consolidateClusterProofs() produit mêmes rootHash pour différentes entrées
SIGNES: rootHash identical plusieurs fois de suite

REMÈDE:
- Vérifier que proofs sont correctement capturés (chainLength > 0)
- Vérifier que nodes sont tous ACTIVE
- Appeler reset() et recapturer
```

---

## Tests — Validation

```bash
cd backend

# Tests batch layer single-node
node src/tests/Phase705-BatchLayer.test.js          # 6/6

# Nouveaux tests distributed batch
node src/tests/Phase710-DistributedBatch.test.js    # 6/6
```

### Critères succès

✅ **Registration** : 3 nœuds enregistrés, `activeNodes === 3`  
✅ **Routing** : Même décisionId → même nœud (5 appels)  
✅ **Distribution** : 60 décisions réparties sur 3 nœuds  
✅ **Failover** : Crash nœud → redistribution, routing redirigé  
✅ **Metrics** : `clusterTotals.totalCaptured` === N  
✅ **Isolation** : `verify()` real-time valide même après crash + batch distribué  
✅ **INVARIANT** : `isAuthoritative() === false` toujours  

---

## Opérations quotidiennes

### Health Check (toutes les 10 secondes)

```javascript
function clusterHealthCheck(engine) {
  const status = engine.getClusterStatus();
  const metrics = engine.getClusterMetrics();
  
  // Critical conditions
  if (status.failedNodes > 0) {
    console.warn(`⚠️  ${status.failedNodes} failed nodes detected`);
  }
  if (metrics.clusterStatus.activeNodes < Math.ceil(engine.nodes.size / 2)) {
    console.error(`❌ QUORUM LOST: only ${metrics.clusterStatus.activeNodes}/${engine.nodes.size} active`);
  }
  
  // Warnings
  const alerts = engine.checkClusterAlerts();
  alerts.filter(a => a.severity === 'CRITICAL').forEach(a => {
    console.warn(`⚠️  CRITICAL: ${a.type} on ${a.nodeId}`);
  });
}
```

### Consolidation Shift (toutes les heures)

```javascript
function hourlyProofConsolidation(engine) {
  const consolidated = engine.consolidateClusterProofs();
  console.log(`[CONSOLIDATION] rootHash: ${consolidated.rootHash.substring(0, 16)}...`);
  console.log(`[CONSOLIDATION] nodes consolidated: ${consolidated.nodesConsolidated}`);
  // Store rootHash for audit trail
}
```

### Metrics Export (toutes les 5 minutes)

```javascript
function metricsExport(engine) {
  const metrics = engine.getClusterMetrics();
  // Export to monitoring system (Prometheus, DataDog, etc.)
  // Clé : metrics.clusterTotals + metrics.perNode
}
```

---

## Invariants Garantis

### Real-Time Never Impacted

✔ Batch operations jamais synchrones  
✔ `setImmediate()` utilisé pour réplication (non-bloquant)  
✔ Capture utilise `proofSystem.captureDecision()` qui ne throw jamais  
✔ Routing ne modifie jamais proofLog real-time  

### Distributed Batch Never Authoritative

✔ `isAuthoritative() → false` toujours  
✔ Metrics agrégées = observabilité uniquement  
✔ Alertes = informationnel uniquement  
✔ Aucune prise de décision basée sur batch distribué  

### Deterministic Routing

✔ SHA-256 + modulo = même décisionId → même nœud toujours  
✔ Routing fallback ne rompt pas la cohérence  

### Graceful Failover

✔ Node crash → redistribution automatique  
✔ Real-time chains restent valides sur nœuds actifs  
✔ Consolidation converge post-failover  

---

## Prochaines étapes (PHASE 7.2+)

**PHASE 7.2** : Long-term batch archive (storage pérenne)  
**PHASE 7.3** : Cross-region batch replication (multi-région)  
**PHASE 8.0** : Global observability plane (agrégation multi-cluster)
