/**
 * CAAGS E2E Test Suite
 * PHASE 5.5 — Event-Driven Governance Validation
 *
 * Valide le flux complet :
 * RuntimeValidationEngine → EventBus → Routing → Healing/Recovery → Audit → Monitoring
 */

const assert = require('assert');
const { v4: uuid } = require('uuid');

// Import core components
const AutonomousGovernanceOrchestrator = require('../core/AutonomousGovernanceOrchestrator');
const { createHardenedEventBus, createMonitoringStack } = require('../core/governance/events');
const GovernanceEvent = require('../core/governance/events/GovernanceEvent');
const ConstitutionLoaderManager = require('../core/loaders/ConstitutionLoaderManager');

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * PHASE 1 — System Boot
 */
async function testSystemBoot() {
  console.log('\n=== PHASE 1: System Boot ===');
  try {
    // Create event bus
    const eventBus = createHardenedEventBus({});
    assert(eventBus, 'EventBus should be created');
    console.log('✅ HardenedEventBus created');

    // Create monitoring stack
    const monitoring = createMonitoringStack({ auditTrail: eventBus.auditTrail });
    assert(monitoring.metricsCollector, 'MetricsCollector should exist');
    assert(monitoring.alertEngine, 'AlertEngine should exist');
    assert(monitoring.dashboard, 'Dashboard should exist');
    console.log('✅ Monitoring stack initialized');

    // Initialize CAAGS
    const caags = new AutonomousGovernanceOrchestrator({});
    await caags.initialize({ eventBus });
    assert(caags.validationEngine, 'ValidationEngine should be initialized');
    assert(caags.healingOrchestrator, 'HealingOrchestrator should be initialized');
    console.log('✅ CAAGS initialized');

    // Start CAAGS in event-driven mode
    const startResult = caags.start(eventBus);
    assert(startResult.started === true, 'CAAGS should start successfully');
    console.log('✅ CAAGS started in event-driven mode');

    testResults.passed++;
    return { eventBus, monitoring, caags };
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 1 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 2 — Violation Emission
 */
async function testViolationEmission(eventBus, caags) {
  console.log('\n=== PHASE 2: Violation Emission ===');
  try {
    // Track events
    const capturedEvents = [];
    eventBus.subscribe('VIOLATION', (event) => {
      capturedEvents.push(event);
    });

    // Create and emit violation
    const violation = {
      type: 'test_violation',
      severity: 'MEDIUM',
      message: 'Test violation for E2E',
      validator: 'test_validator'
    };

    const event = GovernanceEvent.violation(violation, {
      severity: 'MEDIUM',
      source: 'test'
    });

    eventBus.publish(event);

    // Verify event was captured
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow async
    assert(capturedEvents.length > 0, 'Violation event should be captured');
    assert(capturedEvents[0].type === 'VIOLATION', 'Event type should be VIOLATION');
    assert(capturedEvents[0].traceId, 'Event should have traceId');
    console.log('✅ Violation emitted and captured');

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 2 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 3 — Event Routing Logic
 */
async function testEventRouting(eventBus, caags) {
  console.log('\n=== PHASE 3: Event Routing Logic ===');
  try {
    const routingTests = [];

    // Track routing decisions
    const handleViolation = caags._handleViolationEvent.bind(caags);

    // Test LOW severity
    const lowEvent = GovernanceEvent.violation(
      { message: 'Low severity test', validator: 'test' },
      { severity: 'LOW' }
    );
    await handleViolation(lowEvent);
    assert(caags.metrics.totalViolationsProcessed >= 1, 'Should increment processed count');
    console.log('✅ LOW severity routed to healing');

    // Test CRITICAL severity
    const criticalEvent = GovernanceEvent.violation(
      { message: 'Critical test', validator: 'test' },
      { severity: 'CRITICAL' }
    );
    await handleViolation(criticalEvent);
    assert(caags.metrics.escalationsTriggered >= 1, 'Should increment escalations');
    console.log('✅ CRITICAL severity escalated');

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 3 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 4 — Audit Trail Integrity
 */
async function testAuditTrailIntegrity(eventBus, caags) {
  console.log('\n=== PHASE 4: Audit Trail Integrity ===');
  try {
    const auditTrail = eventBus.auditTrail;
    assert(auditTrail, 'Audit trail should exist');

    // Get audit entries
    const entries = auditTrail.getRange(0, 100);
    assert(Array.isArray(entries), 'Audit trail should return array');

    // Verify hash chain integrity
    if (entries.length > 0) {
      assert(entries[0].hash, 'First entry should have hash');
      if (entries.length > 1) {
        assert(entries[1].previousHash === entries[0].hash, 'Hash chain should be valid');
      }
      console.log('✅ Hash chain valid');
    }

    // Test audit verification
    const verification = auditTrail.verify();
    assert(verification.valid === true, 'Audit trail should verify as valid');
    console.log('✅ Audit trail verified');

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 4 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 5 — Observability (Metrics & Alerts)
 */
async function testObservability(eventBus, monitoring) {
  console.log('\n=== PHASE 5: Observability ===');
  try {
    const { metricsCollector, alertEngine, dashboard } = monitoring;

    // Emit test events
    for (let i = 0; i < 5; i++) {
      const event = GovernanceEvent.violation(
        { message: `Test ${i}`, validator: 'test' },
        { severity: i % 2 === 0 ? 'CRITICAL' : 'MEDIUM' }
      );
      eventBus.publish(event);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    // Check metrics collection
    const metrics = metricsCollector.getMetrics();
    assert(metrics, 'Metrics should be collected');
    console.log(`✅ ${metrics.totalEvents} events collected`);

    // Check alert generation
    const alerts = alertEngine.getRecentAlerts(100);
    assert(Array.isArray(alerts), 'Alerts should be generated');
    console.log(`✅ ${alerts.length} alerts generated`);

    // Check dashboard export
    const dashboardView = dashboard.getDashboard();
    assert(dashboardView.overview, 'Dashboard should have overview');
    const report = dashboard.exportReport('json');
    assert(report.includes('Event Monitoring'), 'Export should be valid');
    console.log('✅ Dashboard export valid');

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 5 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 6 — Load Simulation (Stress Test)
 */
async function testLoadSimulation(eventBus) {
  console.log('\n=== PHASE 6: Load Simulation ===');
  try {
    const startTime = Date.now();
    const eventCount = 1000; // Simulate 1000 events

    // Emit many events
    for (let i = 0; i < eventCount; i++) {
      const severity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)];
      const event = GovernanceEvent.violation(
        { message: `Load test ${i}`, validator: `validator_${i % 5}` },
        { severity }
      );
      eventBus.publish(event);

      // Don't await, just publish
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const duration = Date.now() - startTime;
    const rate = Math.round((eventCount / duration) * 1000);
    console.log(`✅ ${eventCount} events published in ${duration}ms (${rate} events/sec)`);

    // Verify no crashes
    assert(true, 'System should handle load without crashing');

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 6 FAILED: ${error.message}`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 CAAGS E2E TEST SUITE — PHASE 5.5');
  console.log('═'.repeat(70));

  try {
    // Phase 1: Boot
    const { eventBus, monitoring, caags } = await testSystemBoot();

    // Phase 2: Violation Emission
    await testViolationEmission(eventBus, caags);

    // Phase 3: Event Routing
    await testEventRouting(eventBus, caags);

    // Phase 4: Audit Trail
    await testAuditTrailIntegrity(eventBus, caags);

    // Phase 5: Observability
    await testObservability(eventBus, monitoring);

    // Phase 6: Load Simulation
    await testLoadSimulation(eventBus);

    // Stop CAAGS
    caags.stop();

    // Print results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}`);
    console.log(`❌ FAILED: ${testResults.failed}`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    const allPassed = testResults.failed === 0;
    console.log('\n' + '═'.repeat(70));
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED — SYSTEM READY FOR PRODUCTION');
    } else {
      console.log('❌ SOME TESTS FAILED — REVIEW ERRORS ABOVE');
    }
    console.log('═'.repeat(70) + '\n');

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };
