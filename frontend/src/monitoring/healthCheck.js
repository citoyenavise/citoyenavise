import * as Sentry from '@sentry/react';

const healthCheck = () => {
  setInterval(async () => {
    try {
      const response = await fetch('/api/v1/health');
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
