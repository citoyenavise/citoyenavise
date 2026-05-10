import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: import.meta.env.MODE === 'development',
});

export default Sentry;
