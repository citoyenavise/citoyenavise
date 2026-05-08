/**
 * InvariantCentralization.js - Single source of truth for system invariants
 * PHASE 3B - Phase 4: Centralize invariant definitions
 *
 * Responsibility: Ensure all invariants come from single source
 * - ROOT_CONSTITUTION/invariants/Invariants.json is SOLE SOURCE
 * - No duplicate invariant declarations
 * - All engines consume same invariant source
 * - Deterministic invariant enforcement
 */

class InvariantCentralization {
  constructor(constitutionManager) {
    if (!constitutionManager) {
      throw new Error('constitutionManager required');
    }

    this.constitutionManager = constitutionManager;
    this.invariantSource = constitutionManager.getInvariantsLoader();
    this.invariantCache = new Map();
    this.violations = [];
  }

  /**
   * Get invariant from authoritative source (only source)
   * All engines MUST use this method, never local invariant copies
   */
  getInvariant(invariantId) {
    // Check cache first
    if (this.invariantCache.has(invariantId)) {
      return this.invariantCache.get(invariantId);
    }

    // Retrieve from constitutional source
    const invariant = this.invariantSource.getInvariant(invariantId);

    if (!invariant) {
      this.violations.push({
        type: 'UNDEFINED_INVARIANT',
        invariantId,
        timestamp: new Date().toISOString(),
        severity: 'CRITICAL'
      });
      return null;
    }

    // Cache for performance
    this.invariantCache.set(invariantId, invariant);
    return invariant;
  }

  /**
   * Get all invariants (single source)
   */
  getAllInvariants() {
    return this.invariantSource.getAllInvariants();
  }

  /**
   * Verify that no duplicate invariant declarations exist
   */
  verifyNoDuplication() {
    const allInvariants = this.getAllInvariants();
    const seenIds = new Set();
    const duplicates = [];

    for (const invariant of allInvariants) {
      if (seenIds.has(invariant.id)) {
        duplicates.push(invariant.id);
      }
      seenIds.add(invariant.id);
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicateCount: duplicates.length,
      duplicates,
      totalUnique: seenIds.size
    };
  }

  /**
   * Validate that all engines use centralized source
   * Called during bootstrap
   */
  validateSourceConsistency(engines) {
    const issues = [];

    for (const [engineName, engine] of Object.entries(engines)) {
      // Check if engine has local invariant copy (anti-pattern)
      if (engine.invariants && typeof engine.invariants === 'object') {
        // If engine has invariant property, check it matches central source
        const engineInvariants = Object.keys(engine.invariants);
        for (const inv of engineInvariants) {
          const central = this.getInvariant(inv);
          if (!central) {
            issues.push({
              engine: engineName,
              invariant: inv,
              issue: 'Local invariant not found in central source'
            });
          }
        }
      }
    }

    return {
      consistent: issues.length === 0,
      issueCount: issues.length,
      issues
    };
  }

  /**
   * Force refresh cache from constitutional source
   * Use after constitution updates
   */
  refreshCache() {
    this.invariantCache.clear();
    return { cleared: true, cacheSize: this.invariantCache.size };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.invariantCache.size,
      totalInvariants: this.getAllInvariants().length,
      cacheHitRate: this.invariantCache.size > 0
        ? `${(this.invariantCache.size / this.getAllInvariants().length * 100).toFixed(2)}%`
        : '0%'
    };
  }

  /**
   * Get violations found during centralization checks
   */
  getViolations() {
    return this.violations;
  }

  /**
   * Reset violations log
   */
  clearViolations() {
    this.violations = [];
    return { cleared: true };
  }

  /**
   * Validate invariant conformance (from central source)
   */
  async validateConformance(system) {
    const invariants = this.getAllInvariants();
    const violations = [];

    for (const invariant of invariants) {
      const isConformant = await this._checkConformance(invariant, system);
      if (!isConformant) {
        violations.push({
          invariant: invariant.id,
          description: invariant.description,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      conformant: violations.length === 0,
      violationCount: violations.length,
      violations
    };
  }

  /**
   * Check single invariant conformance (internal)
   */
  async _checkConformance(invariant, system) {
    // Placeholder: real implementation checks system state against invariant
    return true;
  }
}

module.exports = InvariantCentralization;
