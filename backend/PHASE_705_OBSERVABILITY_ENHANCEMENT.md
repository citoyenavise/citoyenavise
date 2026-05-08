# PHASE 7.0.5 — Batch Layer Optimization & Observability Enhancement

## Vue d'ensemble

PHASE 7.0.5 consolide la couche batch implémentée en PHASE 7.0.4 et ajoute une couche d'observabilité enrichie sans impact sur l'enforcement Real-Time.

**Propriété centrale (INVARIANT)** : _Le batch n'influence JAMAIS les décisions d'enforcement Real-Time._

---

## Architecture Dual-Layer

```
┌─────────────────────────────────────────────────────────────┐
│  REAL-TIME ENFORCEMENT LAYER (Authoritative, Synchronous)   │
├─────────────────────────────────────────────────────────────┤
│  ArchitectureEnforcementEngine                              │
│    validateModule, validateEvent, validateDependency, ...   │
│    ↓ (calls proofSystem.captureDecision)                    │
│  EnforcementProofSystem.proofLog                            │
│    - SHA-256 chaining (previousHash linking)                │
│    - Immutable Object.freeze()                              │
│    - AUTHORITATIVE source of truth                          │
│    - Verify chain integrity: verify()                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BATCH LAYER (Non-Authoritative, Asynchronous)              │
├─────────────────────────────────────────────────────────────┤
│  EnforcementProofSystem.batchProcessingBuffer                │
│    - No SHA-256 chain (for speed)                           │
│    - Separate batchSequence counter                         │
│    - Auto-compact by threshold (default: 80% of 5000)       │
│    - compactProofs() → aggregated metrics                   │
│                                                             │
│  BatchLayerOptimization                                      │
│    - getEnhancedMetrics() with p50/p95/p99                  │
│    - checkAlerts() on thresholds                            │
│    - getDiagnostics() for troubleshooting                   │
│    - isAuthoritative() → ALWAYS false                       │
└─────────────────────────────────────────────────────────────┘
```

### Propriété d'Isolation

- **Real-Time Path**: Synchrone, bloquante (enforcement path)
  - `captureDecision()` → sync → retourne proof entry
  - Décisions d'enforcement basées UNIQUEMENT sur this.proofLog

- **Batch Path**: Asynchrone, non-bloquante (observabilité)
  - `batchProcessingBuffer` enfilé fire-and-forget
  - `BatchLayerOptimization.checkAlerts()` jamais appelé par enforcement
  - Auto-compaction ne perturbe pas real-time

---

## API — EnforcementProofSystem.js (Modifications PHASE 7.0.5)

### Nouvelles métriques

```javascript
this.metrics = {
  // ... existantes ...
  batchAutoCompactCount: 0,     // Nombre de auto-compactions (overflow)
  lastFlushTimestamp: null,      // ISO string du dernier flush
  lastFlushDurationMs: 0         // Durée du compactProofs() en ms
};
```

### Méthode fixe : `verifyBatch()`

```javascript
verifyBatch()
// Retour: { valid: boolean, entriesVerified: number, isAuthoritative: false, message? }

// PHASE 7.0.5: Bug fix — relative sequence check (not absolute from 1)
// Avant: entry.batchSequence !== (i + 1) ← cassait après premier flush
// Après: entry.batchSequence !== prev.batchSequence + 1 ← ok après flush
```

### Sécurité : `proofFlushRate`

```javascript
// PHASE 7.0.5: Null-safe calculation
const elapsed = this.metrics.lastCaptureTime
  ? Math.max(1, (Date.now() - this.metrics.lastCaptureTime) / 1000)
  : 1;
const flushRate = flushCount / elapsed; // Never NaN/Infinity
```

---

## API — BatchLayerOptimization.js (NEW)

**Fichier** : `backend/src/core/governance/enforcement/BatchLayerOptimization.js`

**Constructeur**
```javascript
new BatchLayerOptimization(proofSystem, options = {})
  - proofSystem: EnforcementProofSystem instance (read-only reference)
  - options.violationRatePercent: seuil violation (défaut: 30)
  - options.p95LatencyMs: seuil latence (défaut: 100)
  - options.batchQueueFillPercent: seuil queue (défaut: 90)
  - options.maxAlerts: historique max (défaut: 1000)
  - options.maxCompactionHistory: historique compactions (défaut: 100)
```

### Méthodes publiques

| Méthode | Signature | Retour |
|---------|-----------|--------|
| `isAuthoritative()` | `() → boolean` | **TOUJOURS `false`** (INVARIANT) |
| `getEnhancedMetrics()` | `() → object` | Métriques enrichies avec p50/p95/p99 |
| `checkAlerts()` | `() → Alert[]` | Alertes nouvellement déclenchées |
| `getAlerts(n=50)` | `(number) → Alert[]` | N dernières alertes |
| `getAllAlerts()` | `() → Alert[]` | Toutes les alertes |
| `clearAlerts()` | `() → void` | Effacer historique (tests) |
| `getSummary()` | `() → object` | Snapshot combiné (metrics + alerts) |
| `recordCompaction(result)` | `(object) → void` | Enregistrer événement flush |
| `getCompactionHistory(n=20)` | `(number) → object[]` | N derniers compactions |
| `getDiagnostics()` | `() → object` | État complet pour troubleshooting |
| `reset()` | `() → void` | Réinitialiser (tests) |

### `getEnhancedMetrics()` — Structure

```javascript
{
  isAuthoritative: false,              // INVARIANT
  chainLength: number,                 // proofLog.length
  totalCaptured: number,               // total decisions
  successCount: number,                // ALLOWED decisions
  violationCount: number,              // BLOCKED decisions
  successRate: number,                 // % (0-100)
  violationRate: number,               // % (0-100)
  batchQueueDepth: number,             // current queue size
  batchQueueFillPercent: number,       // % (0-100)
  batchFlushed: number,                // total flushed
  batchAutoCompactCount: number,       // auto-compactions triggered
  lastFlushTimestamp: string | null,   // ISO datetime
  lastFlushDurationMs: number,         // ms
  proofFlushRate: number,              // proofs/sec
  proofSystemErrors: number,           // internal errors
  latencyPercentiles: {                // PER ACTION
    [action]: {
      p50: number,                     // 50th percentile
      p95: number,                     // 95th percentile
      p99: number,                     // 99th percentile
      avg: number,                     // average
      count: number,                   // sample count
      min: number,                     // minimum
      max: number                      // maximum
    }
  },
  byModule: {                          // PER MODULE
    [module]: { success, violation, count }
  },
  timestamp: string                    // ISO datetime
}
```

### Alerts — Types

| Type | Condition | Sévérité | Exemple |
|------|-----------|----------|---------|
| `VIOLATION_RATE` | `violationCount / total > 30%` | WARNING | "Violation rate 42.5% exceeds threshold 30%" |
| `LATENCY_P95` | `p95(latencies[action]) > 100ms` | WARNING | "p95 latency for 'validateModule' = 145ms exceeds threshold 100ms" |
| `BATCH_QUEUE_FULL` | `batchQueueDepth / maxSize > 90%` | CRITICAL | "Batch queue at 95.2% capacity" |

Toutes les alertes incluent :
```javascript
{
  type: string,                        // VIOLATION_RATE, LATENCY_P95, etc.
  severity: 'WARNING' | 'CRITICAL',    // Niveau
  value: number,                       // Valeur observée
  threshold: number,                   // Seuil configuré
  message: string,                     // Détail
  timestamp: string,                   // ISO datetime
  isAuthoritative: false               // INVARIANT
}
```

---

## Intégration dans ArchitectureEnforcementEngine

```javascript
// Constructor
this.proofSystem = new EnforcementProofSystem();
this.batchLayer = new BatchLayerOptimization(this.proofSystem);

// Périodiquement (ex. chaque 10 secondes)
const alerts = this.batchLayer.checkAlerts();
const summary = this.batchLayer.getSummary();

// Pour le reporting
getReport() {
  return {
    metrics: { ...this.metrics },
    proofSystemStats: this.proofSystem.getMetrics(),
    batchLayerStats: this.batchLayer.getEnhancedMetrics(),  // NEW
    batchAlerts: this.batchLayer.getAllAlerts(),             // NEW
    timestamp: new Date().toISOString()
  };
}
```

---

## RUNBOOK — Opérations quotidiennes

### 1. Monitoring — Alertes et seuils

**Alertes attendues en fonctionnement normal** :
- Zéro `BATCH_QUEUE_FULL` (la file batch ne devrait jamais atteindre 90%)
- `VIOLATION_RATE` occasionnel si architecture change (normal)
- `LATENCY_P95` temporaire lors de pics de charge

**Actions sur alerte CRITICAL (BATCH_QUEUE_FULL)** :
```bash
# 1. Vérifier batchAutoCompactCount — si > 5/minute, compression insuffisante
# 2. Augmenter maxBatchBufferSize (défaut: 5000) ou réduire flushThreshold
# 3. Vérifier qu'aucun consumer de batch n'est bloqué
# 4. Envisager réduction du seuil de flush auto (80% → 60%)
```

### 2. Diagnostic

```javascript
// Dans logs ou dashboard
const diagnostics = batchLayer.getDiagnostics();
console.log({
  proofSystemStatus: diagnostics.proofSystemStatus,
  batchStatus: diagnostics.batchStatus,
  alertStatus: diagnostics.alertStatus
});

// Résultat attend :
{
  proofSystemStatus: {
    totalCaptured: 10000,
    chainLength: 10000,
    proofSystemErrors: 0
  },
  batchStatus: {
    queueDepth: 234,            // < maxSize (5000)
    fillPercent: 4.68,          // < 90%
    autoCompactCount: 0,        // < 5/minute
    lastFlushTimestamp: "2026-05-08T10:15:23.456Z",
    lastFlushDurationMs: 12     // < 50ms normal
  },
  alertStatus: {
    total: 2,                   // historique
    active: ['VIOLATION_RATE']  // alertes courantes
  }
}
```

### 3. Maintenance — Flush manuel

```javascript
// Forcer flush batch (ex. avant shutdown)
const result = proofSystem.compactProofs();
console.log(`Flushed ${result.flushed} batch entries`);

// Enregistrer dans compaction history
batchLayer.recordCompaction(result);

// Vérifier intégrité
const batchVerify = proofSystem.verifyBatch();
console.assert(batchVerify.valid, 'Batch structure corrupted!');

// Vérifier que real-time unaffected
const rtVerify = proofSystem.verify();
console.assert(rtVerify.valid, 'Real-time chain corrupted!');
```

### 4. Gestion des alertes

```javascript
// Récupérer alertes récentes
const recent = batchLayer.getAlerts(10);

// Filtrer par sévérité
const critical = batchLayer.getAllAlerts().filter(a => a.severity === 'CRITICAL');

// Effacer après traitement (si manuellement résolu)
batchLayer.clearAlerts();

// Tendre vers zéro erreurs proofSystem
const metrics = proofSystem.getMetrics();
if (metrics.proofSystemErrors > 0) {
  console.warn(`⚠️  ${metrics.proofSystemErrors} internal errors in proof system`);
  // Diagnostiquer et reporthétiser au team
}
```

### 5. Benchmarking des seuils

**Réglages recommandés par profil de charge** :

| Profil | violationRatePercent | p95LatencyMs | batchQueueFillPercent |
|--------|---------------------|--------------|----------------------|
| Faible (< 100 ops/sec) | 50 | 200 | 95 |
| Moyen (100-1k ops/sec) | 30 | 100 | 90 |
| Élevé (1k-10k ops/sec) | 20 | 50 | 85 |
| Critique (> 10k ops/sec) | 10 | 25 | 80 |

Ajuster les seuils via options du constructeur :
```javascript
const batchLayer = new BatchLayerOptimization(proofSystem, {
  violationRatePercent: 20,
  p95LatencyMs: 50,
  batchQueueFillPercent: 85
});
```

---

## Tests — Vérification

```bash
cd backend

# Tests existants (Phase 7.0.5 scaling)
node src/tests/Phase705-ProofScaling.test.js
# Attendu: 6/6 PASSED

# Nouveaux tests (Phase 7.0.5 batch layer)
node src/tests/Phase705-BatchLayer.test.js
# Attendu: 6/6 PASSED

# Tous ensemble
npm test -- Phase705
```

### Critères de succès

- ✅ `Phase705-ProofScaling.test.js` : 6/6 (existant, inchangé)
- ✅ `Phase705-BatchLayer.test.js` : 6/6 (new)
  - TEST 1: `isAuthoritative() === false` toujours
  - TEST 2: p50/p95/p99 correctes
  - TEST 3: `VIOLATION_RATE` alerte déclenchée
  - TEST 4: `LATENCY_P95` alerte déclenchée
  - TEST 5: Métriques enrichies cohérentes
  - TEST 6: Batch ≠ Real-Time (indépendance)
- ✅ `verifyBatch()` valide après plusieurs flush successifs
- ✅ `proofFlushRate` jamais NaN/Infinity
- ✅ Zéro `batchAutoCompactCount` sur charge normale (< 5000 entries/flush)

---

## Propriété INVARIANT — Preuve formelle

**INVARIANT** : _Le batch n'influence JAMAIS les décisions Real-Time._

**Preuve** :

1. `BatchLayerOptimization.isAuthoritative() → false` (toujours)
2. `ArchitectureEnforcementEngine.validateModule()` n'utilise JAMAIS `batchLayer` pour décisions
3. `batchProcessingBuffer` est **write-only** depuis `captureDecision()` (appends)
4. `batchProcessingBuffer` ne participe pas à `verify()` (real-time chain check)
5. `compactProofs()` ne modifie JAMAIS `proofLog` (real-time chain)
6. `BatchLayerOptimization` est une **référence read-only** vers `proofSystem`
7. Donc : _Aucun chemin d'exécution dans enforcement ne lit/modifie batch state_

**QED** ✓

---

## Fichiers touchés

| Fichier | Modification | Critère |
|---------|-------------|---------|
| `EnforcementProofSystem.js` | Fix `verifyBatch()`, `proofFlushRate`, ajouter métriques | Tests 6/6 |
| `BatchLayerOptimization.js` | NEW classe standalone | Tests 6/6 |
| `Phase705-BatchLayer.test.js` | NEW 6 tests | 6/6 |
| `ArchitectureEnforcementEngine.js` | (Optional) intégrer BatchLayerOptimization | Not blocking |

---

## Troubleshooting

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `proofFlushRate` = 0 | `lastCaptureTime === null` | Normal au startup; vérifier après 1 minute |
| `verifyBatch()` fails after flush | Ancien bug (absolue check) | ✅ Fixé en PHASE 7.0.5 |
| Alertes constantes VIOLATION_RATE | Threshold trop bas | Augmenter `violationRatePercent` |
| Alertes LATENCY_P95 persistantes | Système surchargé | Vérifier CPU/memory, réduire charge |
| `batchAutoCompactCount` > 5/min | Buffer trop petit ou flush trop rare | Augmenter `maxBatchBufferSize` ou réduire `flushThreshold` |
| `proofSystemErrors` > 0 | Heap memory ou corruption | Redémarrer, examiner logs, escalade |

---

## Prochaines étapes (PHASE 7.1+)

- **PHASE 7.1** : Distribuée batch across cluster (réplication asynchrone inter-nodes)
- **PHASE 7.2** : Long-term archive de batch (historique pérenne)
- **PHASE 8.0** : Global observability plane (agrégation multi-région)
