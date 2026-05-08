# RUNBOOK — Batch Archive & Retention (PHASE 7.2)

## Vue d'ensemble

Le gestionnaire d'archive batch (`BatchArchiveManager`) capture de manière immuable les compactions batch pour stockage longue durée. Chaque segment archivé est gelé (Object.freeze), indexé temporellement, et sujet à une rotation basée sur TTL.

**Architecture immuable in-memory** : simulation sans I/O disque, pattern cohérent avec Phase60-72.

---

## Architecture Archive

```
┌──────────────────────────────────────────────────────────────┐
│           BatchArchiveManager (Orchestrateur)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  compactProofs() [EnforcementProofSystem]                   │
│       ↓ retourne { batchId, sequenceRange, aggMetrics }     │
│  archiveCompaction(compactionResult)                         │
│       ↓ crée frozen ArchiveSegment                          │
│  Segments Map [frozen, immuable]                            │
│       ↓ indexé par temporal index                           │
│  Temporal Index [ts, segmentId] [sorted]                    │
│                                                              │
│  getSegmentsByTimeRange() [binary search O(log n)]          │
│  replaySegment() [read-only audit]                          │
│  evictExpiredSegments() [TTL rotation]                      │
│  checkAlerts() [4 types : capacity, breach, disabled]       │
└──────────────────────────────────────────────────────────────┘
```

### Flux d'archivage

1. **Capture distribuée** : `engine.captureDistributed(context)` (real-time path)
2. **Compaction batch** : `proofSystem.compactProofs()` (observabilité)
3. **Archivage** : `archive.archiveCompaction(compacted)` ou `archive.archiveClusterBatch(engine)`
4. **Indexation** : insertion triée dans `temporalIndex`
5. **Interrogation** : `getSegmentsByTimeRange()`, `replaySegment()` (audit/replay)
6. **Rotation** : `evictExpiredSegments()` basée sur TTL (défaut 7 jours)

---

## API Opérationnelle

### 1. Archivage monolithique

```javascript
const archive = new BatchArchiveManager({
  retentionMs:         7 * 24 * 60 * 60 * 1000,  // 7 jours (défaut)
  maxSegments:         10000,                     // capacité max (défaut)
  compressionEnabled:  true                       // défaut: true
});

// Après compactProofs()
const result = archive.archiveCompaction({
  batchId: batch.batchId,
  timestamp: batch.timestamp,
  sequenceRange: batch.sequenceRange,
  entriesCount: batch.entriesCount,
  aggregatedMetrics: batch.aggregatedMetrics,
  latencies: batch.latencies
});
// → { archived: true, segmentId: 'arch_...', compressed: true }
```

### 2. Archivage cluster (bulk)

```javascript
const engine = new DistributedBatchEngine({ shardCount: 3 });
// ... register nodes, capture decisions ...

const archiveResult = archive.archiveClusterBatch(engine);
// → {
//   archived: true,
//   segments: ['arch_...', 'arch_...', 'arch_...'],
//   rootHash: 'sha256hash...',
//   nodesArchived: 3,
//   isAuthoritative: false
// }
```

### 3. Interrogation temporelle

```javascript
// Requête par plage de temps
const past24h = Date.now() - 24 * 60 * 60 * 1000;
const now = Date.now();
const segments = archive.getSegmentsByTimeRange(past24h, now);
// → Array of 0-N frozen segments (sorted by timestamp)

// Requête par nœud source
const nodeSegments = archive.getSegmentsByNodeId('batch-node-2');

// Recherche flexible
const results = archive.searchSegments({
  nodeId: 'batch-node-1',
  violationRateAbove: 5,
  startTimestamp: past24h
});
```

### 4. Audit & Replay

```javascript
const replayResult = archive.replaySegment('arch_<segmentId>');
// → {
//   replayed: true,
//   segment: [frozen ArchiveSegment],
//   replayedAt: '2026-05-08T10:15:23.456Z',
//   isAuthoritative: false
// }

// Segment est gelé — lecture seule garantie
console.log(replayResult.segment.aggregatedMetrics); // Can read
// replayResult.segment.batchId = 'modified';        // Fails silently (frozen)
```

### 5. Rotation TTL

```javascript
const evictionResult = archive.evictExpiredSegments();
// → { evicted: 5, retained: 1995 }

// Avant shutdown (assurer la sauvegarde avant perte en-mémoire)
archive.evictExpiredSegments();
// Enregistrer exportSnapshot() si persistance externe planifiée
```

### 6. Alerting & Métriques

```javascript
const alerts = archive.checkAlerts();
// [
//   { type: 'ARCHIVE_CAPACITY_HIGH', severity: 'WARNING', ... },
//   { type: 'RETENTION_BREACH_DETECTED', severity: 'WARNING', ... }
// ]

const metrics = archive.getArchiveMetrics();
// {
//   isAuthoritative: false,
//   segmentsStored: 500,
//   segmentsEvicted: 12,
//   totalEntriesArchived: 45000,
//   compressionRatioAvg: 1.8,
//   lastArchiveTimestamp: '2026-05-08T10:15:23.456Z',
//   archiveErrors: 0,
//   replayRequests: 23,
//   timestamp: '2026-05-08T10:20:00.000Z'
// }
```

---

## Distributed Batch Metrics

### Per-Segment Metrics

| Métrique | Type | Description |
|----------|------|-------------|
| `segmentId` | String | "arch_<epoch>_<random8>" |
| `batchId` | String | ID du batch original |
| `nodeId` | String \| null | Nœud source (null = single-node) |
| `archivedAt` | ISO String | Quand archivé |
| `segmentTimestamp` | ISO String | Timestamp du batch original |
| `sequenceRange` | Object | { start, end } — indices du batch |
| `entriesCount` | Number | Total entrées archivées |
| `rootHash` | String \| null | Hash consolidation global si fourni |
| `compressed` | Boolean | Si latencies → latencyStats |
| `compressionRatioEstimate` | Number | raw_size / compressed_size (>1 = comprssé) |
| `aggregatedMetrics` | Object | { successCount, violationCount, violationRatePercent, byModule } |
| `latencyStats` | Object \| null | { p50, p95, p99, avg, min, max } si latencies |
| `isAuthoritative` | Boolean | INVARIANT: false toujours |

### Archive-Level Metrics

| Métrique | Description |
|----------|-------------|
| `segmentsStored` | Nombre total segments archivés |
| `segmentsEvicted` | Nombre segments expirés + supprimés |
| `totalEntriesArchived` | Sum de all entriesCount archivées |
| `compressionRatioAvg` | Moyenne de compressionRatioEstimate |
| `lastArchiveTimestamp` | ISO datetime du dernier archivage |
| `archiveErrors` | Compteur erreurs (INVALID_COMPACTION, ARCHIVE_FULL) |
| `replayRequests` | Nombre de replay() appelés |
| `createdAt` | ISO datetime création du manager |

---

## Monitoring & Alerting

### Seuils recommandés par charge

| Profil | Capacity Warn | Eviction Check | Compression | Action |
|--------|---|---|---|---|
| Léger (< 100 ops/sec) | 80% | Journalier | Enabled | Monitor alertes |
| Moyen (100-1k) | 85% | Quotidien | Enabled | Alert WARNING si > 85% |
| Élevé (1k-10k) | 90% | Toutes les 4h | Enabled | Alert CRITICAL si >= 100% |
| Critique (> 10k) | 85% | Chaque heure | Mandatory | Escalade immédiate FULL |

### Procédure Alert CRITICAL : Archive Full

```
SYMPTÔME: archive.getArchiveMetrics().segmentsStored >= maxSegments

DIAGNOSTIC:
1. Vérifier archiveErrors — > 0 indique rejets
2. Vérifier segmentsEvicted — croît-il ? (rotation fonctionne?)
3. Vérifier lastArchiveTimestamp — timestamp récent?

ACTIONS:
- Augmenter maxSegments (défaut: 10000) → 20000
- Réduire retentionMs (défaut: 7j) → 3 jours
- Forcer evictExpiredSegments() immédiatement
- Si cluster: augmenter nodes (moins de batches/nœud)

POST-ACTION:
- Vérifier segmentsStored revient < 90% de maxSegments
- Monitorer archiveErrors (devrait = 0)
```

### Procédure Alert WARNING : Retention Breach

```
SYMPTÔME: checkAlerts() retourne RETENTION_BREACH_DETECTED

DIAGNOSTIC:
1. Segment segmentTimestamp < (now - retentionMs)
2. Éviction ne s'est pas exécutée ou retentionMs trop court

ACTIONS:
- Appeler manuellement evictExpiredSegments()
- Vérifier qu'evictExpiredSegments() s'exécute régulièrement
- Augmenter retentionMs si rétention > 7 jours planifiée

POST-ACTION:
- checkAlerts() ne doit plus détecter de breach
- Monitorer lastArchiveTimestamp
```

---

## Troubleshooting

### Archive Full (capacity 100%)

```
SYMPTÔME: archiveErrors > 0 avec "ARCHIVE_FULL"
SIGNES: archiveMetrics.segmentsStored >= maxSegments

CAUSE PROBABLE:
- evictExpiredSegments() ne s'exécute pas assez souvent
- retentionMs trop long → segments ne s'expirent pas
- maxSegments trop petit pour la charge

REMÈDE:
1. Augmenter maxSegments → 20000 (ou 2x current)
2. Réduire retentionMs → 3 jours au lieu de 7
3. Appeler evictExpiredSegments() plus souvent (chaque heure)
4. Vérifier qu'aucun consumer n'est bloqué (bloquant read?)
```

### Compression Disabled Warning

```
SYMPTÔME: checkAlerts() retourne COMPRESSION_DISABLED
SIGNES: totalEntriesArchived > 10000 + compressionEnabled = false

CAUSE: Compression désactivée intentionnellement
REMÈDE:
- Si CPU disponible, réactiver compression (défaut)
- Sinon, accepter compressionRatioAvg ~1.0 (pas de compression)
```

### Replication Lag (segments non archivés)

```
SYMPTÔME: replayRequests === 0 mais proofSystem.compactProofs() s'exécute
SIGNES: archiveMetrics.totalEntriesArchived plateau

CAUSE: archiveClusterBatch() non appelé après compaction
REMÈDE:
1. Vérifier qu'archiveClusterBatch(engine) s'exécute post-compaction
2. Vérifier engine.nodes.size > 0 (au moins 1 nœud actif)
3. Vérifier node.isAlive() pour tous les nœuds
```

---

## Opérations quotidiennes

### Health Check (toutes les heures)

```javascript
function archiveHealthCheck(archive) {
  const metrics = archive.getArchiveMetrics();
  const alerts = archive.checkAlerts();
  
  // Critical conditions
  if (metrics.segmentsStored >= archive.maxSegments * 0.95) {
    console.warn(`⚠️  Archive approaching capacity: ${metrics.segmentsStored}/${archive.maxSegments}`);
  }
  
  // Warnings
  const criticals = alerts.filter(a => a.severity === 'CRITICAL');
  if (criticals.length > 0) {
    console.error(`❌ ${criticals.length} CRITICAL alerts in archive`);
    criticals.forEach(a => console.error(`  - ${a.type}: ${a.message}`));
  }
  
  console.log(`✅ Archive health: ${metrics.segmentsStored} segments, ${metrics.totalEntriesArchived} total entries`);
}
```

### Eviction Shift (chaque 24h ou selon TTL)

```javascript
function dailyEvictionShift(archive) {
  const before = archive.segments.size;
  const result = archive.evictExpiredSegments();
  console.log(`[EVICTION] evicted ${result.evicted}, retained ${result.retained}`);
  console.log(`[EVICTION] memory freed: ~${result.evicted * 100} segments`);
}
```

### Metrics Export (toutes les 5 minutes)

```javascript
function metricsExport(archive) {
  const metrics = archive.getArchiveMetrics();
  // Exporter vers système monitoring (Prometheus, DataDog, etc.)
  // Clé: metrics.segmentsStored, metrics.totalEntriesArchived, metrics.compressionRatioAvg
}
```

---

## Invariants Garantis

### Segments Always Immutable

✔ `Object.isFrozen(segment) === true` pour tous les segments archivés
✔ Tentatives de modification silencieusement ignorées (mode non-strict)
✔ `replaySegment()` retourne le même objet frozen (pas une copie)

### Archive Never Authoritative

✔ `isAuthoritative() → false` toujours
✔ `archive.getArchiveMetrics().isAuthoritative === false`
✔ Aucune décision enforcement basée sur archive

### Real-Time Never Impacted

✔ `archiveCompaction()` ne modifie pas `proofSystem.proofLog`
✔ `evictExpiredSegments()` opère sur `segments` Map seul
✔ `replaySegment()` ne modifie pas `archiveMetrics` (sauf replayRequests++)

### Temporal Index Sorted

✔ Binary search O(log n) pour `getSegmentsByTimeRange()`
✔ Insertion maintient ordre trié automatiquement

---

## Prochaines étapes (PHASE 7.3+)

**PHASE 7.3** : Cross-region batch replication (archive multi-région)
**PHASE 7.4** : Long-term persistence (storage pérenne sur disque)
**PHASE 8.0** : Global observability plane (agrégation multi-cluster)
