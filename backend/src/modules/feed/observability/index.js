module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    feedRequests: 'counter',
    feedItemsReturned: 'counter',
    feedPersonalizations: 'counter',
  },
};
