#!/usr/bin/env node

/**
 * Security Check Script
 *
 * Performs comprehensive security checks:
 * 1. npm audit - Detects known vulnerabilities in dependencies
 * 2. Parses results and fails if vulnerabilities found
 *
 * Usage: node scripts/security-check.js [backend|frontend|all]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIT_LEVEL = 'moderate'; // moderate, high, critical

function log(message, level = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };

  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warn: '⚠️',
    error: '❌'
  };

  console.log(`${colors[level]}${prefix[level]} ${message}${colors.reset}`);
}

function runAudit(projectPath, projectName) {
  log(`Scanning ${projectName} for vulnerabilities...`, 'info');

  try {
    // Run npm audit and get JSON output
    const auditOutput = execSync(`cd "${projectPath}" && npm audit --json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'] // Suppress stderr
    });

    const auditData = JSON.parse(auditOutput);

    // Count vulnerabilities by severity
    const vulnerabilities = auditData.vulnerabilities || {};
    const metadata = auditData.metadata || {};

    const criticalCount = metadata.vulnerabilities?.critical || 0;
    const highCount = metadata.vulnerabilities?.high || 0;
    const moderateCount = metadata.vulnerabilities?.moderate || 0;
    const lowCount = metadata.vulnerabilities?.low || 0;

    log(
      `${projectName} audit results: ${criticalCount} critical, ${highCount} high, ${moderateCount} moderate, ${lowCount} low`,
      'info'
    );

    // Fail if critical or high severity vulnerabilities
    if (criticalCount > 0 || highCount > 0) {
      log(
        `${projectName} has ${criticalCount} critical and ${highCount} high severity vulnerabilities`,
        'error'
      );
      return false;
    }

    // Warn if moderate vulnerabilities
    if (moderateCount > 0) {
      log(
        `${projectName} has ${moderateCount} moderate severity vulnerabilities (advisory only)`,
        'warn'
      );
    }

    log(`${projectName} passed security check ✓`, 'success');
    return true;

  } catch (error) {
    // npm audit returns exit code 1 if vulnerabilities found
    // Parse the error output if available
    try {
      const auditOutput = error.stdout || error.message;
      const auditData = JSON.parse(auditOutput);
      const metadata = auditData.metadata || {};

      const criticalCount = metadata.vulnerabilities?.critical || 0;
      const highCount = metadata.vulnerabilities?.high || 0;
      const moderateCount = metadata.vulnerabilities?.moderate || 0;
      const lowCount = metadata.vulnerabilities?.low || 0;

      log(
        `${projectName} audit results: ${criticalCount} critical, ${highCount} high, ${moderateCount} moderate, ${lowCount} low`,
        'info'
      );

      // Fail if critical or high severity vulnerabilities
      if (criticalCount > 0 || highCount > 0) {
        log(
          `${projectName} has ${criticalCount} critical and ${highCount} high severity vulnerabilities`,
          'error'
        );
        return false;
      }

      log(`${projectName} passed security check ✓`, 'success');
      return true;

    } catch (parseError) {
      log(`Error parsing npm audit output for ${projectName}`, 'error');
      return false;
    }
  }
}

function runSecurityCheck(target = 'all') {
  const projectRoot = path.join(__dirname, '..');

  log('🔒 Security Check Starting...', 'info');
  log(`Audit Level: ${AUDIT_LEVEL}`, 'info');
  console.log('');

  let results = {};

  // Check backend
  if (target === 'all' || target === 'backend') {
    const backendPath = path.join(projectRoot, 'backend');
    results.backend = runAudit(backendPath, 'Backend');
    console.log('');
  }

  // Check frontend
  if (target === 'all' || target === 'frontend') {
    const frontendPath = path.join(projectRoot, 'frontend');
    results.frontend = runAudit(frontendPath, 'Frontend');
    console.log('');
  }

  // Summary
  log('Security Check Summary', 'info');
  const allPassed = Object.values(results).every(result => result !== false);

  if (allPassed) {
    log('All security checks passed! ✓', 'success');
    process.exit(0);
  } else {
    log('Some security checks failed! Fix vulnerabilities before proceeding.', 'error');
    process.exit(1);
  }
}

// Main execution
const target = process.argv[2] || 'all';

if (!['all', 'backend', 'frontend'].includes(target)) {
  log(`Invalid target: ${target}. Use 'all', 'backend', or 'frontend'`, 'error');
  process.exit(1);
}

runSecurityCheck(target);
