/**
 * KernelInvariantRegistry
 * PHASE 8.2 — Versioned Compiled Invariant Registry
 *
 * Immutable storage and retrieval of compiled kernel invariants.
 *
 * CRITICAL:
 * ✔ Versioned schema support
 * ✔ Immutable frozen artifacts
 * ✔ Fast O(1) lookup by ruleId
 * ✔ Atomic version upgrades
 * ✔ Hash-based integrity verification
 */

const crypto = require('crypto');

class KernelInvariantRegistry {
  constructor(options = {}) {
    // Main registry: ruleId → { bytecode, version, schema, hash, registeredAt }
    this.registry = new Map();

    // Version index: schema → { version, rules[] }
    this.schemaVersions = new Map();

    // Integrity hashes: ruleId → hash
    this.integrityHashes = new Map();

    // Schema evolution log (immutable)
    this.evolutionLog = [];
    this.maxEvolutionLog = options.maxEvolutionLog || 1000;

    // Metrics
    this.stats = {
      invariantsRegistered: 0,
      versionUpgrades: 0,
      integrityChecks: 0,
      integrityViolations: 0,
      lastRegistration: null
    };
  }

  /**
   * Register compiled invariant in kernel
   */
  registerInvariant(compiledInvariant) {
    if (!compiledInvariant || !compiledInvariant.ruleId) {
      return { registered: false, reason: 'INVALID_INVARIANT' };
    }

    try {
      const ruleId = compiledInvariant.ruleId;
      const schema = compiledInvariant.schema || 'INVARIANT_1';
      const version = compiledInvariant.version || '1.0';

      // Verify bytecode hash
      const expectedHash = this._computeInvariantHash(compiledInvariant);
      if (compiledInvariant.bytecodeHash && compiledInvariant.bytecodeHash !== expectedHash) {
        this.stats.integrityViolations++;
        return {
          registered: false,
          reason: 'HASH_MISMATCH',
          expected: expectedHash,
          provided: compiledInvariant.bytecodeHash
        };
      }

      // Create immutable registry entry
      const entry = Object.freeze({
        ruleId,
        bytecode: Object.freeze([...compiledInvariant.bytecode]),
        version,
        schema,
        level: compiledInvariant.level || 'INFO',
        hash: expectedHash,
        registeredAt: Date.now()
      });

      // Store in registry
      const wasUpdate = this.registry.has(ruleId);
      this.registry.set(ruleId, entry);
      this.integrityHashes.set(ruleId, expectedHash);

      // Update schema version index
      if (!this.schemaVersions.has(schema)) {
        this.schemaVersions.set(schema, {
          schema,
          version,
          rules: []
        });
      }

      const schemaEntry = this.schemaVersions.get(schema);
      if (!schemaEntry.rules.includes(ruleId)) {
        schemaEntry.rules.push(ruleId);
      }

      // Log evolution
      this._logEvolution({
        type: wasUpdate ? 'UPDATE' : 'REGISTER',
        ruleId,
        schema,
        version,
        hash: expectedHash
      });

      if (wasUpdate) {
        this.stats.versionUpgrades++;
      } else {
        this.stats.invariantsRegistered++;
      }

      this.stats.lastRegistration = Date.now();

      return {
        registered: true,
        ruleId,
        hash: expectedHash,
        schema,
        version
      };
    } catch (err) {
      return {
        registered: false,
        reason: 'REGISTRATION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Retrieve invariant bytecode for execution
   */
  getInvariant(ruleId) {
    const entry = this.registry.get(ruleId);
    if (!entry) {
      return { available: false, reason: 'INVARIANT_NOT_FOUND' };
    }

    return {
      available: true,
      ruleId,
      bytecode: entry.bytecode,
      version: entry.version,
      schema: entry.schema,
      level: entry.level,
      hash: entry.hash
    };
  }

  /**
   * Verify invariant integrity
   */
  verifyInvariant(ruleId) {
    const entry = this.registry.get(ruleId);
    if (!entry) {
      return { verified: false, reason: 'INVARIANT_NOT_FOUND' };
    }

    this.stats.integrityChecks++;

    try {
      const recomputedHash = this._computeInvariantHash(entry);
      const isValid = recomputedHash === entry.hash;

      if (!isValid) {
        this.stats.integrityViolations++;
      }

      return {
        verified: isValid,
        ruleId,
        expectedHash: entry.hash,
        recomputedHash,
        valid: isValid
      };
    } catch (err) {
      return {
        verified: false,
        error: err.message
      };
    }
  }

  /**
   * Get all invariants for schema
   */
  getSchemaInvariants(schema) {
    const schemaEntry = this.schemaVersions.get(schema);
    if (!schemaEntry) {
      return { available: false, reason: 'SCHEMA_NOT_FOUND' };
    }

    const invariants = schemaEntry.rules
      .map(ruleId => this.registry.get(ruleId))
      .filter(inv => inv !== undefined);

    return {
      available: true,
      schema,
      version: schemaEntry.version,
      invariants: invariants.map(inv => ({
        ruleId: inv.ruleId,
        level: inv.level,
        hash: inv.hash
      }))
    };
  }

  /**
   * Upgrade schema version
   */
  upgradeSchema(schema, newVersion) {
    const schemaEntry = this.schemaVersions.get(schema);
    if (!schemaEntry) {
      return { upgraded: false, reason: 'SCHEMA_NOT_FOUND' };
    }

    try {
      const oldVersion = schemaEntry.version;

      // Update version atomically
      const upgraded = Object.freeze({
        ...schemaEntry,
        version: newVersion,
        upgradedAt: Date.now()
      });

      this.schemaVersions.set(schema, upgraded);

      this._logEvolution({
        type: 'SCHEMA_UPGRADE',
        schema,
        oldVersion,
        newVersion
      });

      return {
        upgraded: true,
        schema,
        oldVersion,
        newVersion
      };
    } catch (err) {
      return {
        upgraded: false,
        error: err.message
      };
    }
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const schemaCount = this.schemaVersions.size;
    const totalInvariants = this.registry.size;

    return {
      ...this.stats,
      totalInvariants,
      schemaCount,
      evolutionLogSize: this.evolutionLog.length,
      timestamp: Date.now()
    };
  }

  /**
   * Get evolution history
   */
  getEvolutionHistory(limit = 50) {
    return this.evolutionLog.slice(-limit);
  }

  /**
   * Batch verify all invariants in schema
   */
  verifySchema(schema) {
    const schemaEntry = this.schemaVersions.get(schema);
    if (!schemaEntry) {
      return { verified: false, reason: 'SCHEMA_NOT_FOUND' };
    }

    const results = [];
    let allValid = true;

    for (const ruleId of schemaEntry.rules) {
      const result = this.verifyInvariant(ruleId);
      results.push({
        ruleId,
        valid: result.verified
      });
      if (!result.verified) {
        allValid = false;
      }
    }

    return {
      verified: allValid,
      schema,
      invariantsChecked: results.length,
      results
    };
  }

  /**
   * Internal: Compute invariant hash (bytecode only, same as compiler)
   */
  _computeInvariantHash(invariant) {
    const canonical = JSON.stringify(invariant.bytecode);

    return crypto
      .createHash('sha256')
      .update(canonical)
      .digest('hex');
  }

  /**
   * Internal: Log evolution event
   */
  _logEvolution(event) {
    this.evolutionLog.push({
      ...event,
      timestamp: Date.now(),
      sequence: this.evolutionLog.length
    });

    if (this.evolutionLog.length > this.maxEvolutionLog) {
      this.evolutionLog.shift();
    }
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.registry.clear();
    this.schemaVersions.clear();
    this.integrityHashes.clear();
    this.evolutionLog = [];
    this.stats = {
      invariantsRegistered: 0,
      versionUpgrades: 0,
      integrityChecks: 0,
      integrityViolations: 0,
      lastRegistration: null
    };
  }
}

module.exports = KernelInvariantRegistry;
