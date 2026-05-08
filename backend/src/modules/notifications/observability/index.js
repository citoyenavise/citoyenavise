module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    notificationsSent: 'counter',
    notificationsRead: 'counter',
    subscriptionsCreated: 'counter',
    subscriptionsCancelled: 'counter',
  },
};
