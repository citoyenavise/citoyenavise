module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    userFetches: 'counter',
    userUpdates: 'counter',
    userDeletes: 'counter',
  },
};
