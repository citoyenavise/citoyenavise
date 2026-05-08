/**
 * Quick test for CAAGS initialization
 */

(async () => {
  try {
    const AGO = require('./src/core/AutonomousGovernanceOrchestrator');
    const ago = new AGO({});
    console.log('✅ AutonomousGovernanceOrchestrator instantiated');

    const result = await ago.initialize();
    console.log('✅ CAAGS initialized:', JSON.stringify(result, null, 2));

    const status = ago.getStatus();
    console.log('✅ Initial status:', JSON.stringify({
      loopActive: status.loopActive,
      layers: status.layers,
      systemConnected: status.systemConnected
    }, null, 2));

    ago.stop();
    console.log('✅ CAAGS initialization test complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
