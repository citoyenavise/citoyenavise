module.exports = {
  telemetryConfig: {
    logLevel: 'info',
    captureMetrics: true,
    captureTraces: true,
    sampleRate: 1.0,
  },
  metrics: {
    postsCreated: 'counter',
    postsUpdated: 'counter',
    postsDeleted: 'counter',
    postsFlagged: 'counter',
    totalPosts: 'gauge',
  },
};
