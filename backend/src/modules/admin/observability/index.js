module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    auditLogsCreated: 'counter',
    permissionsChanged: 'counter',
    adminActionsLogged: 'counter',
  },
};
