/**
 * Full CAAGS loop test
 */

(async () => {
  try {
    const AGO = require('./src/core/AutonomousGovernanceOrchestrator');
    const ago = new AGO({ loopInterval_ms: 2000 });
    console.log('✅ AutonomousGovernanceOrchestrator instantiated');

    const result = await ago.initialize();
    console.log('✅ CAAGS initialized');

    const startResult = ago.start();
    console.log('✅ CAAGS loop started:', startResult);

    // Let it run for a few ticks
    await new Promise(resolve => setTimeout(resolve, 6000));

    const status = ago.getStatus();
    console.log('✅ Status after 6s:', JSON.stringify({
      loopActive: status.loopActive,
      loopTicks: status.metrics.loopTicks,
      systemConnected: status.systemConnected
    }, null, 2));

    const stopResult = ago.stop();
    console.log('✅ CAAGS stopped:', stopResult);

    console.log('✅ Full CAAGS test complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
