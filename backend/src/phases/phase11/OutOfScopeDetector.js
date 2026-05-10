/**
 * PHASE 11.9 — OutOfScopeDetector
 * Out-of-Scope Request Detection & Rejection
 * ~310 LOC
 */

'use strict';

class OutOfScopeDetector {
  constructor(definedScope = [], options = {}) {
    this.definedScope = Object.freeze([...definedScope]);
    this.detectorMetrics = {
      requestsAnalyzed: 0,
      outOfScopeDetected: 0,
      createdAt: new Date().toISOString()
    };
  }

  // ============================================================================
  // Main API: detectOutOfScopeRequest
  // ============================================================================

  detectOutOfScopeRequest(request) {
    try {
      if (!request) {
        return Object.freeze({
          out_of_scope: false,
          isAuthoritative: false
        });
      }

      const outOfScope = !this.definedScope.includes(request.scope_id || 'unknown');

      this.detectorMetrics.requestsAnalyzed++;
      if (outOfScope) {
        this.detectorMetrics.outOfScopeDetected++;
      }

      return Object.freeze({
        out_of_scope: outOfScope,
        request_rejected: outOfScope,
        reason: outOfScope ? 'OUTSIDE_SYSTEM_BOUNDARY' : 'WITHIN_SCOPE',
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        out_of_scope: true,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: rejectOutOfScopeAttempt
  // ============================================================================

  rejectOutOfScopeAttempt(attempt) {
    try {
      if (!attempt) {
        return Object.freeze({
          rejected: false,
          isAuthoritative: false
        });
      }

      return Object.freeze({
        rejected: true,
        attempt_blocked: true,
        reason: 'OUT_OF_DEFINED_SCOPE',
        system_boundary_maintained: true,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        rejected: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.detectorMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = OutOfScopeDetector;
