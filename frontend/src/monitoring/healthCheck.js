import * as Sentry from '@sentry/react';

const healthCheck = () => {
  setInterval(async () => {
    try {
      // Note: /health is a system endpoint, not part of /api/v1/
      const response = await fetch('/health');
      const data = await response.json();

      if (data.status !== 'ok') {
        Sentry.captureMessage('API unhealthy', 'warning');
      }

      if (data.memory && data.memory.heapUsed / data.memory.heapTotal > 0.9) {
        Sentry.captureMessage('High memory usage', 'warning');
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  }, 60000);
};

export default healthCheck;
