/**
 * GovernanceAuditLogger.js - Log all governance actions and decisions
 * PHASE 1.5: Observability Layer
 *
 * Responsibility: Create complete audit trail of all governance decisions
 * - Log all constitutional declarations
 * - Log all validation decisions
 * - Log all enforcement actions
 * - Log all state changes
 * - Maintain immutable audit trail
 */

const fs = require('fs');
const path = require('path');

class GovernanceAuditLogger {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
    this.auditLog = [];
    this.auditFilePath = path.join(__dirname, '../../..', 'audit_trail.jsonl');
    this.maxInMemoryEntries = 10000;
    this.startTime = Date.now();
    this.entryCount = 0;
  }

  /**
   * Log a governance action
   */
  logAction(action, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      sequenceNumber: ++this.entryCount,
      action,
      details,
      context: {
        uptime_ms: Date.now() - this.startTime
      }
    };

    this.auditLog.push(entry);

    // Keep only recent entries in memory
    if (this.auditLog.length > this.maxInMemoryEntries) {
      this.auditLog.shift();
    }

    // Persist to file (append)
    this._persistEntry(entry);

    return entry;
  }

  /**
   * Log validation decision
   */
  logValidationDecision(validator, valid, violations = [], metrics = {}) {
    return this.logAction('VALIDATION', {
      validator,
      valid,
      violationCount: violations.length,
      violations: violations.slice(0, 10), // Log first 10
      metrics
    });
  }

  /**
   * Log enforcement decision
   */
  logEnforcementDecision(operation, allowed, reason, details = {}) {
    return this.logAction('ENFORCEMENT', {
      operation,
      allowed,
      reason,
      ...details
    });
  }

  /**
   * Log permission check
   */
  logPermissionCheck(principal, resource, action, granted, reason = '') {
    return this.logAction('PERMISSION_CHECK', {
      principal,
      resource,
      action,
      granted,
      reason
    });
  }

  /**
   * Log state transition
   */
  logStateTransition(entity, fromState, toState, context = {}) {
    return this.logAction('STATE_TRANSITION', {
      entity,
      fromState,
      toState,
      context
    });
  }

  /**
   * Log service injection
   */
  logServiceInjection(serviceName, requesterModule, successful, details = {}) {
    return this.logAction('SERVICE_INJECTION', {
      service: serviceName,
      requester: requesterModule,
      successful,
      ...details
    });
  }

  /**
   * Log resource usage
   */
  logResourceUsage(resourceType, current, limit, percentageUsed) {
    return this.logAction('RESOURCE_USAGE', {
      resourceType,
      current,
      limit,
      percentageUsed
    });
  }

  /**
   * Log invariant check
   */
  logInvariantCheck(invariantId, valid, violations = []) {
    return this.logAction('INVARIANT_CHECK', {
      invariant: invariantId,
      valid,
      violationCount: violations.length,
      violations
    });
  }

  /**
   * Log dependency validation
   */
  logDependencyValidation(module, dependencies, valid, issues = []) {
    return this.logAction('DEPENDENCY_VALIDATION', {
      module,
      dependencyCount: dependencies.length,
      valid,
      issues
    });
  }

  /**
   * Log bootstrap event
   */
  logBootstrapEvent(phase, status, duration_ms, details = {}) {
    return this.logAction('BOOTSTRAP', {
      phase,
      status,
      duration_ms,
      ...details
    });
  }

  /**
   * Log critical violation
   */
  logCriticalViolation(violationType, description, context = {}) {
    return this.logAction('CRITICAL_VIOLATION', {
      type: violationType,
      description,
      context
    });
  }

  /**
   * Persist entry to file
   */
  _persistEntry(entry) {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.auditFilePath, line, 'utf8');
    } catch (error) {
      console.error('Failed to persist audit entry:', error);
    }
  }

  /**
   * Get all audit entries
   */
  getAllEntries() {
    return [...this.auditLog];
  }

  /**
   * Get entries by action type
   */
  getEntriesByAction(actionType, limit = 100) {
    return this.auditLog
      .filter(e => e.action === actionType)
      .slice(-limit);
  }

  /**
   * Get entries in time range
   */
  getEntriesByTimeRange(startTime, endTime, limit = 1000) {
    return this.auditLog
      .filter(e => e.timestampMs >= startTime && e.timestampMs <= endTime)
      .slice(0, limit);
  }

  /**
   * Get recent entries
   */
  getRecentEntries(limit = 50) {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get violation entries
   */
  getViolationEntries(limit = 100) {
    return this.auditLog
      .filter(e =>
        e.action === 'VALIDATION' && !e.details.valid ||
        e.action === 'ENFORCEMENT' && !e.details.allowed ||
        e.action === 'CRITICAL_VIOLATION'
      )
      .slice(-limit);
  }

  /**
   * Get audit statistics
   */
  getStatistics() {
    const stats = {
      totalEntries: this.entryCount,
      entriesInMemory: this.auditLog.length,
      uptime_ms: Date.now() - this.startTime,
      actionCounts: {},
      violationCount: 0
    };

    for (const entry of this.auditLog) {
      stats.actionCounts[entry.action] = (stats.actionCounts[entry.action] || 0) + 1;

      if (entry.action === 'CRITICAL_VIOLATION' ||
          (entry.action === 'VALIDATION' && !entry.details.valid) ||
          (entry.action === 'ENFORCEMENT' && !entry.details.allowed)) {
        stats.violationCount++;
      }
    }

    return stats;
  }

  /**
   * Export audit trail to file
   */
  exportAuditTrail(filename) {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        systemUptime_ms: Date.now() - this.startTime,
        totalEntries: this.entryCount,
        entries: this.auditLog
      };

      fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
      return { success: true, filename, entryCount: this.entryCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit trail summary
   */
  getSummary() {
    const stats = this.getStatistics();
    const violations = this.getViolationEntries(5);

    return {
      statistics: stats,
      recentViolations: violations,
      auditFileSize: this._getAuditFileSize(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get audit file size
   */
  _getAuditFileSize() {
    try {
      const stats = fs.statSync(this.auditFilePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Clear in-memory audit log (keep file)
   */
  clearMemory() {
    const clearedCount = this.auditLog.length;
    this.auditLog = [];
    return { clearedEntries: clearedCount };
  }
}

module.exports = GovernanceAuditLogger;
