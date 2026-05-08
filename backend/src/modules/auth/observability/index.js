module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    registrationAttempts: 'counter',
    loginAttempts: 'counter',
    loginFailures: 'counter',
    tokenRefreshes: 'counter',
    activeSessions: 'gauge',
  },
  alerts: [
    {
      name: 'high_failed_logins',
      threshold: 5,
      window: '5m',
      severity: 'warning',
    },
  ],
};
