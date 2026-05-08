/**
 * ChecksumVerifier.js - Verify integrity of constitutional files
 * Immutability & Sealing - PHASE 1.2 STEP 8
 *
 * Responsibility: Validate checksums of constitutional declarations
 * - Generate checksums for all constitutional files
 * - Verify integrity on load
 * - Detect unauthorized modifications
 * - Track file signatures
 */

const crypto = require('crypto');

class ChecksumVerifier {
  constructor(options = {}) {
    this.checksums = new Map();
    this.verificationLog = [];
    this.integrityStatus = new Map();

    this.config = {
      algorithm: options.algorithm || 'sha256',
      trackHistory: options.trackHistory !== false,
      strictMode: options.strictMode !== false,
      maxLogSize: options.maxLogSize || 10000
    };

    this.metrics = {
      totalFilesChecked: 0,
      filesVerified: 0,
      integrityViolations: 0,
      averageVerificationTime_ms: 0
    };
  }

  /**
   * Generate checksum for file content
   */
  generateChecksum(content) {
    if (typeof content === 'object') {
      content = JSON.stringify(content);
    }

    const hash = crypto.createHash(this.config.algorithm);
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Register constitutional file with checksum
   */
  registerFile(filename, content) {
    const checksum = this.generateChecksum(content);

    this.checksums.set(filename, {
      filename,
      checksum,
      algorithm: this.config.algorithm,
      registeredAt: new Date().toISOString(),
      registeredTimestamp: Date.now(),
      verificationCount: 0,
      lastVerified: null,
      violations: 0
    });

    return {
      registered: true,
      filename,
      checksum,
      algorithm: this.config.algorithm
    };
  }

  /**
   * Verify file integrity
   */
  verifyIntegrity(filename, content) {
    const startTime = Date.now();
    const registered = this.checksums.get(filename);

    if (!registered) {
      return {
        success: false,
        filename,
        reason: 'File not registered',
        verified: false
      };
    }

    const currentChecksum = this.generateChecksum(content);
    const checksumMatch = currentChecksum === registered.checksum;

    const verification = {
      filename,
      timestamp: new Date().toISOString(),
      registered_checksum: registered.checksum,
      current_checksum: currentChecksum,
      verified: checksumMatch,
      duration_ms: Date.now() - startTime
    };

    this.metrics.totalFilesChecked++;

    if (checksumMatch) {
      this.metrics.filesVerified++;
      registered.verificationCount++;
      registered.lastVerified = new Date().toISOString();
    } else {
      this.metrics.integrityViolations++;
      registered.violations++;
      verification.violation = true;
      verification.severity = 'CRITICAL';
      verification.message = `Checksum mismatch for ${filename}`;
    }

    // Log verification
    if (this.config.trackHistory) {
      this.verificationLog.push(verification);
      if (this.verificationLog.length > this.config.maxLogSize) {
        this.verificationLog.shift();
      }
    }

    return {
      success: checksumMatch,
      filename,
      verified: checksumMatch,
      registeredChecksum: registered.checksum,
      currentChecksum,
      verification
    };
  }

  /**
   * Verify all registered files
   */
  verifyAllFiles(fileContents) {
    const results = [];
    const startTime = Date.now();

    for (const [filename, registered] of this.checksums) {
      const content = fileContents[filename];

      if (!content) {
        results.push({
          filename,
          verified: false,
          reason: 'Content not provided'
        });
        continue;
      }

      const result = this.verifyIntegrity(filename, content);
      results.push({
        filename,
        verified: result.verified,
        checksum: result.currentChecksum
      });
    }

    const totalTime = Date.now() - startTime;

    return {
      timestamp: new Date().toISOString(),
      filesChecked: results.length,
      filesVerified: results.filter(r => r.verified).length,
      filesCorrupted: results.filter(r => !r.verified).length,
      duration_ms: totalTime,
      results,
      allVerified: results.every(r => r.verified)
    };
  }

  /**
   * Get file checksum
   */
  getChecksum(filename) {
    const registered = this.checksums.get(filename);
    return registered ? registered.checksum : null;
  }

  /**
   * Get integrity status
   */
  getIntegrityStatus(filename) {
    const registered = this.checksums.get(filename);

    if (!registered) {
      return null;
    }

    return {
      filename,
      checksum: registered.checksum,
      registeredAt: registered.registeredAt,
      verificationCount: registered.verificationCount,
      violations: registered.violations,
      lastVerified: registered.lastVerified,
      integrity: registered.violations === 0 ? 'VALID' : 'COMPROMISED'
    };
  }

  /**
   * Get all integrity statuses
   */
  getAllIntegrityStatuses() {
    const statuses = [];

    for (const [filename, registered] of this.checksums) {
      statuses.push({
        filename,
        checksum: registered.checksum,
        verificationCount: registered.verificationCount,
        violations: registered.violations,
        integrity: registered.violations === 0 ? 'VALID' : 'COMPROMISED',
        lastVerified: registered.lastVerified
      });
    }

    return statuses;
  }

  /**
   * Get verification log
   */
  getVerificationLog(limit = 50) {
    return this.verificationLog.slice(-limit);
  }

  /**
   * Get violation report
   */
  getViolationReport() {
    const violations = this.verificationLog.filter(v => v.violation);

    return {
      timestamp: new Date().toISOString(),
      totalViolations: violations.length,
      violations: violations.slice(-20),
      byFile: this._groupViolationsByFile(violations),
      severity: violations.length > 0 ? 'CRITICAL' : 'NONE'
    };
  }

  /**
   * Group violations by file
   */
  _groupViolationsByFile(violations) {
    const grouped = {};

    for (const violation of violations) {
      if (!grouped[violation.filename]) {
        grouped[violation.filename] = 0;
      }
      grouped[violation.filename]++;
    }

    return grouped;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    const recentVerifications = this.verificationLog.slice(-100);

    if (recentVerifications.length > 0) {
      const totalTime = recentVerifications.reduce((sum, v) => sum + v.duration_ms, 0);
      this.metrics.averageVerificationTime_ms = Math.round(totalTime / recentVerifications.length);
    }

    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      registeredFiles: this.checksums.size,
      violationRate_percent: this.metrics.totalFilesChecked > 0
        ? (this.metrics.integrityViolations / this.metrics.totalFilesChecked * 100).toFixed(2)
        : '0'
    };
  }

  /**
   * Generate integrity report
   */
  generateIntegrityReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        registeredFiles: this.checksums.size,
        filesVerified: this.metrics.filesVerified,
        integrityViolations: this.metrics.integrityViolations,
        allValid: this.metrics.integrityViolations === 0
      },
      fileStatuses: this.getAllIntegrityStatuses(),
      violations: this.getViolationReport(),
      metrics: this.getMetrics()
    };
  }

  /**
   * Export checksums (for backup/audit)
   */
  exportChecksums() {
    const checksums = {};

    for (const [filename, registered] of this.checksums) {
      checksums[filename] = {
        checksum: registered.checksum,
        algorithm: registered.algorithm,
        registeredAt: registered.registeredAt,
        verificationCount: registered.verificationCount,
        violations: registered.violations
      };
    }

    return {
      timestamp: new Date().toISOString(),
      algorithm: this.config.algorithm,
      checksums
    };
  }

  /**
   * Reset verifier
   */
  reset() {
    this.verificationLog = [];
    this.metrics = {
      totalFilesChecked: 0,
      filesVerified: 0,
      integrityViolations: 0,
      averageVerificationTime_ms: 0
    };

    return { reset: true };
  }
}

module.exports = ChecksumVerifier;
