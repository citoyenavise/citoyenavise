import * as Sentry from '@sentry/react';
// import { BrowserTracing } from '@sentry/tracing';

// TEMPORARILY DISABLED: Sentry v10 (@sentry/react) incompatible with v7 (@sentry/tracing)
// TODO Phase B: Update to Sentry v10+ uniformly and fix API changes (Sentry.Replay -> Sentry.replayIntegration())
// https://docs.sentry.io/platforms/javascript/guides/react/

// Sentry.init({
//   dsn: import.meta.env.VITE_SENTRY_DSN,
//   environment: import.meta.env.MODE,
//   tracesSampleRate: 0.1,
//   integrations: [
//     new BrowserTracing(),
//     new Sentry.Replay({
//       maskAllText: true,
//       blockAllMedia: true,
//     }),
//   ],
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
//   debug: import.meta.env.MODE === 'development',
// });

export default Sentry;
