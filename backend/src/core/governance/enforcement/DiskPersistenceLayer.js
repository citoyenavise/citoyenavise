/**
 * DiskPersistenceLayer
 * PHASE 8.0 — Disk-Based Persistence & Distributed Transaction Logging
 *
 * Abstract backend for durable storage with support for:
 * - RocksDB: Local, high-performance embedded database
 * - SQLite: Portable, ACID-compliant
 * - S3: Cloud-based, scalable storage
 *
 * All operations are observability-only, never authoritative.
 * INVARIANT: Real-Time enforcement never blocked by persistence operations.
 */

const crypto = require('crypto');
const zlib = require('zlib');

class DiskPersistenceLayer {
  constructor(options = {}) {
    this.backendType = options.backendType || 'ROCKSDB'; // ROCKSDB | SQLITE | S3
    this.backendPath = options.backendPath || './db/persist';
    this.enableCompression = options.enableCompression !== false;
    this.compressionLevel = options.compressionLevel || 6; // 1-9
    this.cacheSizeBytes = options.cacheSizeBytes || 100 * 1024 * 1024; // 100MB default

    // In-memory simulation (for production, would use actual RocksDB/SQLite libraries)
    this.store = new Map(); // key → { value, compressed, compressedSize, originalSize }
    this.backupSnapshots = new Map(); // backupId → snapshot of store at time
    this.compactionLog = [];

    this.persistenceMetrics = {
      keysStored: 0,
      diskUsageBytes: 0,
      readCount: 0,
      writeCount: 0,
      compressionRatio: 1.0,
      avgReadLatencyMs: 0,
      avgWriteLatencyMs: 0,
      cacheHitRate: 0,
      backupCount: 0,
      lastBackupTime: null,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  /**
   * Select persistence backend
   */
  selectBackend(backendType, options = {}) {
    if (!['ROCKSDB', 'SQLITE', 'S3'].includes(backendType)) {
      return { selected: false, reason: 'INVALID_BACKEND' };
    }

    this.backendType = backendType;
    this.backendPath = options.path || this.backendPath;

    return {
      selected: true,
      backend: backendType,
      path: this.backendPath,
      isAuthoritative: false
    };
  }

  /**
   * Store key-value pair with optional compression
   */
  put(key, value, options = {}) {
    if (!key) {
      return { stored: false, reason: 'NO_KEY' };
    }

    const t0 = Date.now();

    // Serialize value
    const serialized = JSON.stringify(value);
    let finalValue = serialized;
    let compressed = false;
    let compressedSize = serialized.length;
    let originalSize = serialized.length;

    // Compress if enabled and beneficial
    if (this.enableCompression && serialized.length > 1024) {
      try {
        const compressed_data = zlib.deflateSync(serialized, { level: this.compressionLevel });
        if (compressed_data.length < serialized.length * 0.9) {
          finalValue = compressed_data.toString('base64');
          compressed = true;
          compressedSize = compressed_data.length;
          originalSize = serialized.length;
        }
      } catch (e) {
        // Fall back to uncompressed
      }
    }

    // Store entry
    this.store.set(key, {
      value: finalValue,
      compressed,
      compressedSize,
      originalSize,
      timestamp: new Date().toISOString(),
      hash: crypto.createHash('sha256').update(serialized).digest('hex')
    });

    const latency = Date.now() - t0;

    // Update metrics
    this.persistenceMetrics.writeCount++;
    this.persistenceMetrics.keysStored = this.store.size;
    this.persistenceMetrics.diskUsageBytes += compressedSize;
    this.persistenceMetrics.avgWriteLatencyMs =
      (this.persistenceMetrics.avgWriteLatencyMs + latency) / 2;

    // Update compression ratio
    const totalCompressed = Array.from(this.store.values())
      .reduce((sum, e) => sum + e.compressedSize, 0);
    const totalOriginal = Array.from(this.store.values())
      .reduce((sum, e) => sum + e.originalSize, 0);
    this.persistenceMetrics.compressionRatio =
      totalOriginal > 0 ? totalCompressed / totalOriginal : 1.0;

    return {
      stored: true,
      key,
      size: compressedSize,
      compressed,
      compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1.0,
      latencyMs: latency,
      isAuthoritative: false
    };
  }

  /**
   * Retrieve key-value pair (decompress if needed)
   */
  get(key) {
    if (!this.store.has(key)) {
      return { retrieved: false, reason: 'KEY_NOT_FOUND' };
    }

    const t0 = Date.now();
    const entry = this.store.get(key);

    let value = entry.value;

    // Decompress if needed
    if (entry.compressed) {
      try {
        const decompressed = zlib.inflateSync(Buffer.from(value, 'base64'));
        value = decompressed.toString();
      } catch (e) {
        return { retrieved: false, reason: 'DECOMPRESSION_FAILED' };
      }
    }

    const latency = Date.now() - t0;

    // Update metrics
    this.persistenceMetrics.readCount++;
    this.persistenceMetrics.avgReadLatencyMs =
      (this.persistenceMetrics.avgReadLatencyMs + latency) / 2;

    return {
      retrieved: true,
      key,
      value: JSON.parse(value),
      compressed: entry.compressed,
      latencyMs: latency,
      hash: entry.hash,
      isAuthoritative: false
    };
  }

  /**
   * Delete key
   */
  delete(key) {
    if (!this.store.has(key)) {
      return { deleted: false, reason: 'KEY_NOT_FOUND' };
    }

    const entry = this.store.get(key);
    this.store.delete(key);
    this.persistenceMetrics.keysStored = this.store.size;
    this.persistenceMetrics.diskUsageBytes -= entry.compressedSize;

    return {
      deleted: true,
      key,
      freedBytes: entry.compressedSize,
      isAuthoritative: false
    };
  }

  /**
   * Scan by key prefix
   */
  range(prefix) {
    const results = [];
    for (const [key, entry] of this.store) {
      if (key.startsWith(prefix)) {
        results.push({
          key,
          size: entry.compressedSize,
          compressed: entry.compressed,
          timestamp: entry.timestamp
        });
      }
    }
    return {
      found: results.length,
      entries: results,
      isAuthoritative: false
    };
  }

  /**
   * Full table scan
   */
  scan(options = {}) {
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const entries = Array.from(this.store.entries())
      .slice(offset, offset + limit)
      .map(([key, entry]) => ({
        key,
        size: entry.compressedSize,
        timestamp: entry.timestamp,
        hash: entry.hash
      }));

    return {
      entries,
      total: this.store.size,
      offset,
      limit,
      isAuthoritative: false
    };
  }

  /**
   * Compact storage (defragmentation)
   */
  compact() {
    const t0 = Date.now();
    let freedBytes = 0;

    // In real RocksDB, this triggers compaction
    // In simulation, we rebuild store (optimization)
    const newStore = new Map();
    for (const [key, entry] of this.store) {
      newStore.set(key, entry);
    }
    this.store = newStore;

    const latency = Date.now() - t0;
    this.compactionLog.push({
      timestamp: new Date().toISOString(),
      latencyMs: latency,
      freedBytes
    });

    return {
      compacted: true,
      latencyMs: latency,
      freedBytes,
      isAuthoritative: false
    };
  }

  /**
   * Create full backup
   */
  backup(options = {}) {
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Create snapshot of current store
    const snapshot = new Map();
    for (const [key, entry] of this.store) {
      snapshot.set(key, { ...entry });
    }

    this.backupSnapshots.set(backupId, {
      snapshot,
      timestamp: new Date().toISOString(),
      entriesCount: this.store.size,
      diskUsageBytes: this.persistenceMetrics.diskUsageBytes
    });

    this.persistenceMetrics.backupCount++;
    this.persistenceMetrics.lastBackupTime = new Date().toISOString();

    return {
      backed_up: true,
      backupId,
      entriesCount: this.store.size,
      diskUsageBytes: this.persistenceMetrics.diskUsageBytes,
      isAuthoritative: false
    };
  }

  /**
   * Restore from backup
   */
  restore(backupId) {
    if (!this.backupSnapshots.has(backupId)) {
      return { restored: false, reason: 'BACKUP_NOT_FOUND' };
    }

    const backup = this.backupSnapshots.get(backupId);
    this.store.clear();

    // Restore entries
    for (const [key, entry] of backup.snapshot) {
      this.store.set(key, { ...entry });
    }

    this.persistenceMetrics.keysStored = this.store.size;
    this.persistenceMetrics.diskUsageBytes = backup.diskUsageBytes;

    return {
      restored: true,
      backupId,
      entriesCount: backup.entriesCount,
      restoredAt: backup.timestamp,
      isAuthoritative: false
    };
  }

  /**
   * Get persistence metrics
   */
  getPersistenceMetrics() {
    return Object.freeze({
      isAuthoritative: false,
      backend: this.backendType,
      keysStored: this.persistenceMetrics.keysStored,
      diskUsageBytes: this.persistenceMetrics.diskUsageBytes,
      readCount: this.persistenceMetrics.readCount,
      writeCount: this.persistenceMetrics.writeCount,
      compressionRatio: this.persistenceMetrics.compressionRatio,
      avgReadLatencyMs: this.persistenceMetrics.avgReadLatencyMs.toFixed(2),
      avgWriteLatencyMs: this.persistenceMetrics.avgWriteLatencyMs.toFixed(2),
      cacheHitRate: this.persistenceMetrics.cacheHitRate,
      backupCount: this.persistenceMetrics.backupCount,
      lastBackupTime: this.persistenceMetrics.lastBackupTime,
      timestamp: new Date().toISOString(),
      createdAt: this.persistenceMetrics.createdAt
    });
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    const newAlerts = [];
    const metrics = this.persistenceMetrics;

    // DISK_USAGE_HIGH
    const capacityUsage = metrics.diskUsageBytes / (10 * 1024 * 1024 * 1024); // assume 10GB limit
    if (capacityUsage > 0.85) {
      const alert = Object.freeze({
        type: 'DISK_USAGE_HIGH',
        severity: 'WARNING',
        value: (capacityUsage * 100).toFixed(1),
        threshold: 85,
        message: `Disk usage ${(capacityUsage * 100).toFixed(1)}% > 85%`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // WRITE_LATENCY_HIGH
    if (metrics.avgWriteLatencyMs > 500) {
      const alert = Object.freeze({
        type: 'WRITE_LATENCY_HIGH',
        severity: 'WARNING',
        value: metrics.avgWriteLatencyMs.toFixed(2),
        threshold: 500,
        message: `Write latency ${metrics.avgWriteLatencyMs.toFixed(2)}ms > 500ms`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // COMPRESSION_POOR
    if (metrics.compressionRatio > 0.9) {
      const alert = Object.freeze({
        type: 'COMPRESSION_POOR',
        severity: 'INFO',
        value: (metrics.compressionRatio * 100).toFixed(1),
        message: `Compression ratio ${(metrics.compressionRatio * 100).toFixed(1)}% (little benefit)`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // Cap alert history
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    return newAlerts;
  }

  /**
   * Get all historical alerts
   */
  getAllAlerts() {
    return [...this.alerts];
  }

  /**
   * INVARIANT: never authoritative
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Reset state (tests)
   */
  reset() {
    this.store.clear();
    this.backupSnapshots.clear();
    this.compactionLog = [];
    this.persistenceMetrics = {
      keysStored: 0,
      diskUsageBytes: 0,
      readCount: 0,
      writeCount: 0,
      compressionRatio: 1.0,
      avgReadLatencyMs: 0,
      avgWriteLatencyMs: 0,
      cacheHitRate: 0,
      backupCount: 0,
      lastBackupTime: null,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }
}

module.exports = DiskPersistenceLayer;
