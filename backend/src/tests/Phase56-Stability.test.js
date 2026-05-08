/**
 * PHASE 5.6 — Runtime Stabilization Tests
 *
 * Validates 5 stability corrections:
 * 1. EventStreamProcessor throttling bug fix
 * 2. EventAuditTrail memory cap (50k entries)
 * 3. EventMetricsCollector real latency + p95/p99
 * 4. GovernanceEventBus handler isolation
 * 5. HardenedEventBus optional rate-limiting
 */

const assert = require('assert');
const { v4: uuid } = require('uuid');

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * PHASE 1 — Throttling Fix
 * Verify EventStreamProcessor._isThrottled() correctly updates lastThrottleTime
 */
async function testThrottlingFix() {
  console.log('\n=== PHASE 1: Throttling Fix ===');
  try {
    const EventStreamProcessor = require('../core/governance/events/EventStreamProcessor');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    const processor = new EventStreamProcessor({ throttleWindow_ms: 100 });

    // Create test event
    const event1 = GovernanceEvent.violation(
      { message: 'Test throttle 1', validator: 'test' },
      { severity: 'MEDIUM', source: 'test-source' }
    );

    // First call: should not be throttled
    const throttled1 = processor._isThrottled(event1);
    assert(throttled1 === false, 'First call should not be throttled');

    // Second call immediately: should be throttled
    const throttled2 = processor._isThrottled(event1);
    assert(throttled2 === true, 'Second immediate call should be throttled');

    // After window expires: should not be throttled
    await new Promise(resolve => setTimeout(resolve, 150));
    const throttled3 = processor._isThrottled(event1);
    assert(throttled3 === false, 'After window expiry, should not be throttled');

    console.log('✅ Throttling fix verified');
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 1: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 2 — Memory Bounds
 * Verify EventAuditTrail.trail is capped at maxTrailSize
 */
async function testMemoryBounds() {
  console.log('\n=== PHASE 2: Memory Bounds ===');
  try {
    const EventAuditTrail = require('../core/governance/events/EventAuditTrail');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    const maxSize = 100; // Small for testing
    const trail = new EventAuditTrail({ maxTrailSize: maxSize });

    // Append more than maxSize
    for (let i = 0; i < 150; i++) {
      const event = GovernanceEvent.violation(
        { message: `Test ${i}`, validator: 'test' },
        { severity: 'MEDIUM' }
      );
      trail.append(event);
    }

    // Verify size is capped
    assert(trail.trail.length === maxSize, `Trail size should be capped at ${maxSize}`);
    assert(trail.trail.length <= maxSize, 'Trail should not exceed maxSize');

    console.log(`✅ Memory bounded: trail.length = ${trail.trail.length} (max ${maxSize})`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 2: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 3 — Latency Real Values
 * Verify EventMetricsCollector measures real latency and p95/p99
 */
async function testLatencyReal() {
  console.log('\n=== PHASE 3: Latency Real ===');
  try {
    const EventMetricsCollector = require('../core/governance/events/EventMetricsCollector');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    const collector = new EventMetricsCollector();

    // Record events with real latency
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      const event = GovernanceEvent.violation(
        { message: `Test ${i}`, validator: 'test' },
        { severity: 'MEDIUM' }
      );

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));

      collector.recordEvent(event, 'published', startTime);
    }

    const metrics = collector.getMetrics();
    assert(metrics.performance.p95_ms > 0, 'p95 latency should be > 0');
    assert(metrics.performance.p99_ms > 0, 'p99 latency should be > 0');
    assert(metrics.performance.avgLatency_ms > 0, 'avg latency should be > 0');

    console.log(`✅ Latency measured: p95=${metrics.performance.p95_ms}ms, p99=${metrics.performance.p99_ms}ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 3: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 4 — Handler Isolation
 * Verify handler errors are isolated and don't cascade
 */
async function testHandlerIsolation() {
  console.log('\n=== PHASE 4: Handler Isolation ===');
  try {
    const GovernanceEventBus = require('../core/governance/events/GovernanceEventBus');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    const bus = new GovernanceEventBus();

    let handler1Called = false;
    let handler2Called = false;
    let handler3Called = false;

    // Register handlers for VIOLATION events
    bus.subscribe('VIOLATION', () => {
      handler1Called = true;
    });

    bus.subscribe('VIOLATION', () => {
      handler2Called = true;
      throw new Error('Handler 2 throws');
    });

    bus.subscribe('VIOLATION', () => {
      handler3Called = true;
    });

    // Publish violation event
    const event = GovernanceEvent.violation(
      { message: 'Test handler', validator: 'test' },
      { severity: 'MEDIUM' }
    );
    bus.publish(event);

    // All handlers should be called despite handler2 throwing
    assert(handler1Called === true, 'Handler 1 should be called');
    assert(handler2Called === true, 'Handler 2 should be called (but throws)');
    assert(handler3Called === true, 'Handler 3 should be called despite handler 2 error');
    assert(bus.metrics.handlerErrors > 0, 'Handler errors should be tracked');

    console.log(`✅ Handler isolation verified: handlerErrors=${bus.metrics.handlerErrors}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 4: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 5 — Rate Limiting
 * Verify HardenedEventBus rate limiting rejects excess events
 */
async function testRateLimiting() {
  console.log('\n=== PHASE 5: Rate Limiting ===');
  try {
    const { createHardenedEventBus } = require('../core/governance/events');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    // Create bus with 10 events/sec rate limit
    const eventBus = createHardenedEventBus({
      rateLimit: 10,
      rateLimitWindow_ms: 1000
    });

    let publishedCount = 0;
    let rateLimitedCount = 0;

    // Publish 15 events in rapid succession
    for (let i = 0; i < 15; i++) {
      const event = GovernanceEvent.violation(
        { message: `Test ${i}`, validator: 'test' },
        { severity: 'MEDIUM' }
      );
      const result = await eventBus.publish(event);

      if (result.published) {
        publishedCount++;
      } else if (result.reason === 'rate_limited') {
        rateLimitedCount++;
      }
    }

    assert(publishedCount >= 10, 'Should allow at least 10 events');
    assert(rateLimitedCount > 0, 'Should rate-limit excess events');
    assert(eventBus.metrics.rateLimited > 0, 'Rate-limited metric should increment');

    console.log(`✅ Rate limiting enforced: published=${publishedCount}, rate_limited=${rateLimitedCount}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 5: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 6 — Causality (Event Ordering)
 * Verify events maintain chronological order in audit trail
 */
async function testCausality() {
  console.log('\n=== PHASE 6: Causality ===');
  try {
    const EventAuditTrail = require('../core/governance/events/EventAuditTrail');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    const trail = new EventAuditTrail({ maxTrailSize: 1000 });

    // Append events with slight delays
    for (let i = 0; i < 5; i++) {
      const event = GovernanceEvent.violation(
        { message: `Event ${i}`, validator: 'test' },
        { severity: 'MEDIUM' }
      );
      trail.append(event);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Verify sequence is preserved
    const entries = trail.getRange(0, 100);
    for (let i = 0; i < entries.length; i++) {
      assert(
        entries[i].sequence === i + 1,
        `Entry ${i} should have sequence ${i + 1}`
      );
    }

    // Verify hash chain is intact
    const verification = trail.verify();
    assert(verification.valid === true, 'Hash chain should be valid');

    console.log(`✅ Causality preserved: ${entries.length} events, sequences intact`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 6: ${error.message}`);
    throw error;
  }
}

/**
 * PHASE 7 — Long Run Stability
 * Verify system remains stable after 10k events
 */
async function testLongRunStability() {
  console.log('\n=== PHASE 7: Long Run Stability ===');
  try {
    const { createHardenedEventBus, createMonitoringStack } = require('../core/governance/events');
    const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

    const eventBus = createHardenedEventBus({});
    const monitoring = createMonitoringStack({ auditTrail: eventBus.auditTrail });

    // Wire metrics collector
    eventBus.subscribe('VIOLATION', (event) => {
      monitoring.metricsCollector.recordEvent(event, 'success');
    });

    // Publish 10k events
    const startTime = Date.now();
    const eventCount = 10000;

    for (let i = 0; i < eventCount; i++) {
      const severity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)];
      const event = GovernanceEvent.violation(
        { message: `Long run ${i}`, validator: 'test' },
        { severity }
      );
      await eventBus.publish(event);

      if (i % 1000 === 0 && i > 0) {
        console.log(`  ... published ${i} events`);
      }
    }

    const duration = Date.now() - startTime;

    // Verify stability metrics
    const metrics = monitoring.metricsCollector.getMetrics();
    const auditSize = eventBus.auditTrail.trail.length;

    assert(metrics.summary.totalEvents > 0, 'Metrics should be collected');
    assert(auditSize <= 50000, 'Audit trail should be capped');
    assert(auditSize > 0, 'Audit trail should have entries');

    console.log(`✅ Long run complete: ${eventCount} events in ${duration}ms`);
    console.log(`   - AuditTrail size: ${auditSize}`);
    console.log(`   - Metrics collected: ${metrics.summary.totalEvents}`);
    console.log(`   - Throughput: ${Math.round((eventCount / duration) * 1000)} events/sec`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`PHASE 7: ${error.message}`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 5.6 — RUNTIME STABILIZATION TEST SUITE');
  console.log('═'.repeat(70));

  try {
    await testThrottlingFix();
    await testMemoryBounds();
    await testLatencyReal();
    await testHandlerIsolation();
    await testRateLimiting();
    await testCausality();
    await testLongRunStability();

    // Print results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/7 tests`);
    console.log(`❌ FAILED: ${testResults.failed}/7 tests`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n' + '═'.repeat(70));
    if (testResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED — PHASE 5.6 STABILIZATION COMPLETE');
      console.log('✅ READY FOR PHASE 5.7 (Hardening)');
    } else {
      console.log('⚠️  SOME TESTS FAILED — REVIEW ERRORS ABOVE');
    }
    console.log('═'.repeat(70) + '\n');

    process.exit(testResults.failed === 0 ? 0 : 1);
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
