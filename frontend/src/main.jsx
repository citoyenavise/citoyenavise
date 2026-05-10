/**
 * Citoyen Avisé Frontend
 * Optimisations :
 * - Code splitting avec React.lazy (pages chargées à la demande)
 * - Suspense fallback pour loading states propres
 * - i18n configuration au démarrage
 * - Sentry monitoring & error tracking
 * - Health check API monitoring
 * - SSR-ready structure
 */

import './i18n/config';
import Sentry from './monitoring/sentry';
import healthCheck from './monitoring/healthCheck';
import App from './App';
import ErrorPage from './components/ErrorPage';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Initialize health check
healthCheck();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorPage />} showDialog>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
