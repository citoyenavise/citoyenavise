/**
 * GovernancePoliciesLoader.js - Load and validate GovernancePolicies.json
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load governance policies from constitution
 * - Parse GovernancePolicies.json
 * - Build policy index
 * - Provide policy enforcement access
 */

const fs = require('fs');
const path = require('path');

class GovernancePoliciesLoader {
  constructor() {
    this.policiesPath = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/governance-policies/GovernancePolicies.json');
    this.policies = null;
    this.policyIndex = new Map();
    this.sealed = false;
  }

  /**
   * Load and parse GovernancePolicies.json
   */
  async load() {
    if (this.sealed) {
      throw new Error('GovernancePoliciesLoader already sealed. Cannot load again.');
    }

    try {
      const content = fs.readFileSync(this.policiesPath, 'utf8');
      const policySet = JSON.parse(content);

      if (!policySet.sealed || !policySet.immutable || !policySet.read_only) {
        throw new Error('GovernancePolicies.json is not properly sealed');
      }

      this.policies = policySet.policies || [];
      this._buildIndex();
      this.sealed = true;

      return {
        success: true,
        policyCount: this.policies.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load GovernancePolicies: ${error.message}`);
    }
  }

  /**
   * Build searchable index of policies
   */
  _buildIndex() {
    for (const policy of this.policies) {
      this.policyIndex.set(policy.id, {
        id: policy.id,
        name: policy.name,
        description: policy.description,
        rules: policy.rules || [],
        enforcement_level: policy.enforcement_level,
        violation_response: policy.violation_response
      });
    }
  }

  /**
   * Get policy by id
   */
  getPolicy(policyId) {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return this.policyIndex.get(policyId);
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return Array.from(this.policyIndex.values());
  }

  /**
   * Get policies by enforcement level
   */
  getPoliciesByEnforcementLevel(level) {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return Array.from(this.policyIndex.values())
      .filter(p => p.enforcement_level === level);
  }

  /**
   * Get mandatory policies
   */
  getMandatoryPolicies() {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return Array.from(this.policyIndex.values())
      .filter(p => p.enforcement_level === 'MANDATORY');
  }

  /**
   * Get violation response for policy
   */
  getViolationResponse(policyId) {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }

    const policy = this.policyIndex.get(policyId);
    if (!policy) {
      return null;
    }
    return policy.violation_response;
  }

  /**
   * Get all rules for policy
   */
  getPolicyRules(policyId) {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }

    const policy = this.policyIndex.get(policyId);
    if (!policy) {
      return [];
    }
    return policy.rules;
  }

  /**
   * Check if policy exists
   */
  policyExists(policyId) {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return this.policyIndex.has(policyId);
  }

  /**
   * Get policy count
   */
  getPolicyCount() {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return this.policyIndex.size;
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('GovernancePoliciesLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      policy_count: this.policyIndex.size,
      mandatory_policy_count: Array.from(this.policyIndex.values())
        .filter(p => p.enforcement_level === 'MANDATORY').length,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = GovernancePoliciesLoader;
