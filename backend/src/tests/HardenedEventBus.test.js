/**
 * HardenedEventBus Transport Layer Tests
 * PHASE 5.7 v2 — Validates strict pipeline: TTL → Idempotency → Loops → RateLimit
 */

const assert = require('assert');
const { v4: uuid } = require('uuid');
const HardenedEventBus = require('../core/governance/events/HardenedEventBus');
const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

/**
 * Helper: Create mock event with custom TTL properties (for testing expiration)
 */
function createMockEvent(overrides = {}) {
  const baseEvent = {
    id: uuid(),
    type: 'VIOLATION',
    severity: 'HIGH',
    source: 'test',
    traceId: uuid(),
    createdAt: Date.now(),
    ttlMs: 5 * 60 * 1000, // 5 min default
    isExpired() {
      return Date.now() - this.createdAt > this.ttlMs;
    },
    ...overrides
  };
  return baseEvent;
}

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * TEST 1: TTL Enforcement — Expired events are dropped immediately
 */
async function testTTLEnforcement() {
  console.log('\n=== TEST 1: TTL Enforcement ===');
  try {
    const bus = new HardenedEventBus();

    // Create event with 100ms TTL using factory method
    const event = GovernanceEvent.violation(
      { message: 'TTL test', validator: 'test' },
      { severity: 'HIGH', source: 'test', ttl: 100 }
    );

    // Publish immediately: should succeed
    const result1 = await bus.publish(event);
    assert(result1.published === true, 'Event should publish before TTL expires');

    // Create mock expired event (not frozen, allows TTL manipulation)
    const expiredEvent = createMockEvent({
      id: uuid(),
      type: 'VIOLATION',
      ttlMs: 100,
      createdAt: Date.now() - 200 // Expired: 200ms old, TTL 100ms
    });

    const result2 = await bus.publish(expiredEvent);
    assert(result2.published === false, 'Expired event should be rejected');
    assert(result2.reason === 'expired', 'Reason should be expired');
    assert(bus.metrics.eventsExpired >= 1, 'eventsExpired metric should increment');

    console.log(`✅ TTL enforcement verified: expiredEvents=${bus.metrics.eventsExpired}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Idempotency — Same eventId is rejected on second publish
 */
async function testIdempotency() {
  console.log('\n=== TEST 2: Idempotency (Duplicate Detection) ===');
  try {
    const bus = new HardenedEventBus({ idempotencyWindow_ms: 5000 });

    const event = GovernanceEvent.violation(
      { message: 'Idempotency test', validator: 'test' },
      { severity: 'MEDIUM', source: 'test' }
    );

    // First publish: should succeed
    const result1 = await bus.publish(event);
    assert(result1.published === true, 'First publish should succeed');

    // Second publish with same event.id: should be rejected
    const result2 = await bus.publish(event);
    assert(result2.published === false, 'Second publish should be rejected (duplicate)');
    assert(result2.reason === 'duplicate', 'Reason should be duplicate');
    assert(bus.metrics.duplicatesRejected >= 1, 'duplicatesRejected metric should increment');

    console.log(`✅ Idempotency verified: duplicatesRejected=${bus.metrics.duplicatesRejected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Loop Detection — Exceeding maxPublishesPerTraceId triggers detection
 */
async function testLoopDetection() {
  console.log('\n=== TEST 3: Loop Detection ===');
  try {
    const bus = new HardenedEventBus({ maxPublishesPerTraceId: 5 });
    const traceId = uuid();

    let loopDetected = false;
    let loopDetectionCount = 0;

    // Publish events with same traceId until loop is detected
    for (let i = 0; i < 10; i++) {
      const event = GovernanceEvent.violation(
        { message: `Loop test ${i}`, validator: 'test' },
        { severity: 'MEDIUM', source: 'test', traceId }
      );

      const result = await bus.publish(event);
      if (result.published === false && result.reason === 'loop_detected') {
        loopDetected = true;
        loopDetectionCount = i;
        break;
      }
    }

    assert(loopDetected === true, 'Loop should be detected after maxPublishesPerTraceId');
    assert(loopDetectionCount >= 5, `Loop should be detected at iteration >= 5 (actual: ${loopDetectionCount})`);
    assert(bus.metrics.loopsDetected >= 1, 'loopsDetected metric should increment');

    console.log(`✅ Loop detection verified: detected at iteration ${loopDetectionCount}, total=${bus.metrics.loopsDetected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Rate Limiting — Exceeding event rate triggers backpressure
 */
async function testRateLimiting() {
  console.log('\n=== TEST 4: Rate Limiting ===');
  try {
    // 3 events per second max
    const bus = new HardenedEventBus({
      rateLimit: 3,
      rateLimitWindow_ms: 1000
    });

    const events = [];
    for (let i = 0; i < 5; i++) {
      events.push(GovernanceEvent.violation(
        { message: `Rate limit test ${i}`, validator: 'test' },
        { severity: 'LOW', source: 'test' }
      ));
    }

    let rateLimitedCount = 0;
    for (const event of events) {
      const result = await bus.publish(event);
      if (result.published === false && result.reason === 'rate_limited') {
        rateLimitedCount++;
      }
    }

    assert(rateLimitedCount >= 2, 'At least 2 events should be rate-limited (>3/sec)');
    assert(bus.metrics.rateLimited >= 2, 'rateLimited metric should reflect rejections');

    console.log(`✅ Rate limiting verified: limited=${bus.metrics.rateLimited}/5 events`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Pipeline Order — TTL checked BEFORE idempotency
 * (Expired event should not increment duplicatesRejected, only eventsExpired)
 */
async function testPipelineOrder() {
  console.log('\n=== TEST 5: Pipeline Order (TTL Before Idempotency) ===');
  try {
    const bus = new HardenedEventBus({ idempotencyWindow_ms: 5000 });

    // Create mock expired event (not a GovernanceEvent, so no Object.freeze())
    const expiredEvent = createMockEvent({
      id: uuid(),
      type: 'VIOLATION',
      ttlMs: 100,
      createdAt: Date.now() - 200 // Expired
    });

    const beforeDuplicates = bus.metrics.duplicatesRejected || 0;
    const beforeExpired = bus.metrics.eventsExpired || 0;

    // Publish expired event
    const result = await bus.publish(expiredEvent);

    const afterDuplicates = bus.metrics.duplicatesRejected || 0;
    const afterExpired = bus.metrics.eventsExpired || 0;

    // Expired event should ONLY increment eventsExpired, NOT duplicatesRejected
    assert(result.reason === 'expired', 'Reason should be expired');
    assert(afterExpired === beforeExpired + 1, 'eventsExpired should increment');
    assert(afterDuplicates === beforeDuplicates, 'duplicatesRejected should NOT increment');

    console.log(`✅ Pipeline order verified: TTL checked first, expiredMetric=${afterExpired}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Idempotency Window Expiration
 * Ids older than idempotencyWindow_ms should be garbage-collected
 */
async function testIdempotencyWindowExpiration() {
  console.log('\n=== TEST 6: Idempotency Window Expiration ===');
  try {
    const bus = new HardenedEventBus({ idempotencyWindow_ms: 200 });

    const event1 = GovernanceEvent.violation(
      { message: 'Window test 1', validator: 'test' },
      { severity: 'LOW', source: 'test' }
    );

    // First publish: should succeed
    const result1 = await bus.publish(event1);
    assert(result1.published === true, 'First publish should succeed');

    // Immediate second publish: should be rejected (within window)
    const result2 = await bus.publish(event1);
    assert(result2.published === false && result2.reason === 'duplicate', 'Immediate duplicate should be rejected');

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 250));

    // After window expires, same eventId should be publishable again
    const result3 = await bus.publish(event1);
    assert(result3.published === true, 'After window expiration, same eventId should be publishable');

    console.log(`✅ Idempotency window expiration verified`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 HARDENED EVENT BUS TRANSPORT LAYER TEST SUITE');
  console.log('═'.repeat(70));

  try {
    await testTTLEnforcement();
    await testIdempotency();
    await testLoopDetection();
    await testRateLimiting();
    await testPipelineOrder();
    await testIdempotencyWindowExpiration();

    // Print results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log(`❌ FAILED: ${testResults.failed}/6 tests`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n' + '═'.repeat(70));
    if (testResults.failed === 0) {
      console.log('🎉 ALL TRANSPORT TESTS PASSED — PHASE 5.7 TRANSPORT LAYER VALIDATED');
      console.log('✅ READY FOR ORCHESTRATOR PHASE B');
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
