# Archive Metrics Documentation (PHASE 7.2)

## ArchiveSegment Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-----------|
| `segmentId` | String | "arch_<epoch>_<random8>" | Unique per segment, immutable |
| `batchId` | String | Original batch identifier | From compactProofs() |
| `nodeId` | String \| null | Source BatchNode ID | null if single-node archive |
| `archivedAt` | ISO String | Timestamp when archived | Set at archiveCompaction() |
| `segmentTimestamp` | ISO String | Original batch timestamp | From compacted.timestamp |
| `sequenceRange` | Object | { start, end } sequence indices | Frozen nested object |
| `entriesCount` | Number | Count of batch entries | >= 0 |
| `rootHash` | String \| null | Global consolidation hash | From consolidateClusterProofs() if provided |
| `compressed` | Boolean | Compression flag | true if latencies present + compressionEnabled |
| `compressionRatioEstimate` | Number | raw_size / compressed_size | >= 1.0 (1.0 = no compression) |
| `aggregatedMetrics` | Object | { successCount, violationCount, violationRatePercent, byModule } | Frozen nested object |
| `latencyStats` | Object \| null | { p50, p95, p99, avg, min, max } | null if no latencies in input |
| `isAuthoritative` | Boolean | INVARIANT flag | Always false |

## Archive-Level Metrics

### BatchArchiveManager.archiveMetrics

| Metric | Type | Description | Initial Value | Updated By |
|--------|------|-------------|---|---|
| `segmentsStored` | Number | Total segments in archive | 0 | archiveCompaction(), archiveClusterBatch() |
| `segmentsEvicted` | Number | Cumulative evicted segments | 0 | evictExpiredSegments() |
| `totalEntriesArchived` | Number | Sum of all entriesCount | 0 | archiveCompaction(), archiveClusterBatch() |
| `compressionRatioSum` | Number | Sum of all compressionRatioEstimate | 0 | archiveCompaction(), archiveClusterBatch() |
| `lastArchiveTimestamp` | ISO String \| null | ISO timestamp of last archive | null | archiveCompaction(), archiveClusterBatch() |
| `archiveErrors` | Number | Cumulative errors (INVALID, FULL) | 0 | archiveCompaction() on reject |
| `replayRequests` | Number | Cumulative replay() calls | 0 | replaySegment() |
| `createdAt` | ISO String | Manager creation timestamp | Set at constructor | None |

### Computed Metrics

| Metric | Formula | Type | Example |
|--------|---------|------|---------|
| `compressionRatioAvg` | `compressionRatioSum / segmentsStored` | Number | 1.8 (80% compressed) |
| `segmentsRetained` | `segments.size` | Number | 1234 |
| `capacityUsagePercent` | `(segments.size / maxSegments) * 100` | Number | 45.2 |
| `evictionRateDailyEstimate` | `segmentsEvicted / (age in days)` | Number | 5 segments/day |

## Alert Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | String | ARCHIVE_CAPACITY_HIGH \| ARCHIVE_FULL \| RETENTION_BREACH_DETECTED \| COMPRESSION_DISABLED |
| `severity` | String | WARNING \| CRITICAL \| INFO |
| `value` | Number | Observed metric value |
| `threshold` | Number | Threshold that triggered alert |
| `message` | String | Human-readable description |
| `timestamp` | ISO String | Alert creation time |
| `isAuthoritative` | Boolean | Always false (INVARIANT) |

## Alert Conditions

### ARCHIVE_CAPACITY_HIGH (WARNING)

- **Condition** : `segments.size > maxSegments * 0.9`
- **Threshold** : 90% capacity
- **Value** : Percentage (0.0 to 1.0)
- **Message** : `"Archive capacity at 95.3% (9530/10000 segments)"`
- **Action** : Increase maxSegments or reduce retention

### ARCHIVE_FULL (CRITICAL)

- **Condition** : `segments.size >= maxSegments`
- **Threshold** : 100% capacity
- **Value** : Current segment count
- **Message** : `"Archive is FULL: 10000/10000 segments"`
- **Action** : Immediate action required — stop archiving or evict

### RETENTION_BREACH_DETECTED (WARNING)

- **Condition** : Any segment where `segmentTimestamp < (now - retentionMs)`
- **Threshold** : retentionMs
- **Value** : Offending segment entriesCount
- **Message** : `"Segment arch_1234567890_abc123de is older than retention period"`
- **Action** : Run evictExpiredSegments() or extend retention

### COMPRESSION_DISABLED (INFO)

- **Condition** : `compressionEnabled === false && totalEntriesArchived > 10000`
- **Threshold** : 10000 entries
- **Value** : totalEntriesArchived
- **Message** : `"Compression is disabled but archive has 15234 entries"`
- **Action** : Enable compression if CPU available (optional)

## Recommended Thresholds by Deployment Size

### Small (< 100 ops/sec)

```javascript
const archive = new BatchArchiveManager({
  retentionMs:    7 * 24 * 60 * 60 * 1000,  // 7 days
  maxSegments:    1000,
  maxAlerts:      500
});
```

- Eviction check: Daily
- Capacity warning: 80%
- Expected daily segments: < 50
- Expected compression ratio: 1.5x

### Medium (100-1k ops/sec)

```javascript
const archive = new BatchArchiveManager({
  retentionMs:    3 * 24 * 60 * 60 * 1000,  // 3 days (shorter to fit)
  maxSegments:    5000,
  maxAlerts:      1000
});
```

- Eviction check: Every 12 hours
- Capacity warning: 85%
- Expected daily segments: 200-500
- Expected compression ratio: 1.8x

### Large (1k-10k ops/sec)

```javascript
const archive = new BatchArchiveManager({
  retentionMs:    2 * 24 * 60 * 60 * 1000,  // 2 days
  maxSegments:    10000,
  maxAlerts:      2000
});
```

- Eviction check: Every 6 hours
- Capacity warning: 90%
- Expected daily segments: 1k-2k
- Expected compression ratio: 2.0x
- Recommend: Manual eviction trigger before reaching 95%

### Critical (> 10k ops/sec)

```javascript
const archive = new BatchArchiveManager({
  retentionMs:    1 * 24 * 60 * 60 * 1000,  // 1 day
  maxSegments:    20000,
  maxAlerts:      5000
});
```

- Eviction check: Every 2 hours or on-demand
- Capacity warning: 85%
- Expected daily segments: 5k-20k
- Expected compression ratio: 2.2x
- Recommend: Async background eviction + external persistence

## Latency Stats Distribution

For latency percentiles, assuming uniform/normal distribution of request times:

| Array Size | p50 Expected | p95 Expected | p99 Expected | Example |
|---|---|---|---|---|
| 10 | ~5th element | ~9th element | ~10th element | [1..10]: p50≈5, p95≈10, p99≈10 |
| 100 | ~50th element | ~95th element | ~99th element | [1..100]: p50≈50, p95≈95, p99≈99 |
| 1000 | ~500th | ~950th | ~990th | [1..1000]: p50≈500, p95≈950, p99≈990 |

### Percentile Formula

```javascript
function percentile(sorted, p) {
  return sorted[Math.floor(p * (sorted.length - 1))];
}
// p in range [0, 1]
// For p=0.95, returns approximately the 95th percentile
```

## Compression Ratio Interpretation

| Ratio | Meaning | Use Case |
|-------|---------|----------|
| 1.0 | No compression | Compression disabled or latencies = empty |
| 1.2 - 1.5 | Low compression | Few latencies or high variance (can't compress well) |
| 1.5 - 2.0 | Medium compression | Typical case (latencies compress to percentiles) |
| 2.0+ | High compression | Many similar latencies (good compression pattern) |

### Compression Benefit Calculation

```
Raw JSON size = JSON.stringify(aggregatedMetrics + latencies array)
Compressed JSON size = JSON.stringify(aggregatedMetrics + latencyStats)

Compression ratio = raw_size / compressed_size
Space saved = raw_size - compressed_size
Percent saved = ((raw_size - compressed_size) / raw_size) * 100%

Example:
  raw_size = 500 bytes
  compressed_size = 250 bytes
  ratio = 2.0
  savings = 250 bytes (50%)
```

## Monitoring Dashboard Recommendations

### Key Metrics to Display

1. **Archive Status** : `segmentsStored / maxSegments` (gauge)
2. **Archive Growth** : `totalEntriesArchived` (counter)
3. **Eviction Rate** : `segmentsEvicted` (counter, delta/hour)
4. **Compression Efficiency** : `compressionRatioAvg` (gauge)
5. **Replay Activity** : `replayRequests` (counter, delta/hour)
6. **Error Rate** : `archiveErrors` (counter, delta/hour)
7. **Last Archive** : `lastArchiveTimestamp` (timestamp)
8. **Alert Count** : `getAllAlerts().length` (gauge)

### Alert Dashboard

- **CRITICAL** (ARCHIVE_FULL) : Page on-call immediately
- **WARNING** (CAPACITY_HIGH, RETENTION_BREACH) : Alert in team channel
- **INFO** (COMPRESSION_DISABLED) : Log only, no page

### SLA Targets

| Metric | Target | Consequence if Breached |
|--------|--------|---|
| archiveErrors | = 0 | Data loss risk (rejected archives) |
| segmentsEvicted < 5/day | Normal | Retention not expiring as expected |
| lastArchiveTimestamp < 5 min old | Normal | Archiving stalled (no new batches?) |
| replayRequests > 100/day | Alert on trend | Possible audit burden increasing |

## Export/Import Format (Future)

### ArchiveSegment JSON Schema

```json
{
  "segmentId": "arch_1714152623000_a1b2c3d4",
  "batchId": "batch_1714152620000_a1b2c3d4",
  "nodeId": "batch-node-1",
  "archivedAt": "2026-05-08T10:15:23.456Z",
  "segmentTimestamp": "2026-05-08T10:15:20.000Z",
  "sequenceRange": {"start": 1, "end": 100},
  "entriesCount": 100,
  "rootHash": "sha256hash...",
  "compressed": true,
  "compressionRatioEstimate": 1.8,
  "aggregatedMetrics": {
    "successCount": 95,
    "violationCount": 5,
    "violationRatePercent": 5.0,
    "byModule": {"API": {"success": 95, "violation": 5}}
  },
  "latencyStats": {
    "p50": 45, "p95": 95, "p99": 99,
    "avg": 48.5, "min": 10, "max": 100
  },
  "isAuthoritative": false
}
```

This format is suitable for JSON export to external storage systems (S3, database, etc.) for long-term persistence beyond PHASE 7.2 in-memory archive.
