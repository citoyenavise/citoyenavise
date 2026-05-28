/**
 * Citoyen Avisé Frontend
 * Optimisations :
 * - Code splitting avec React.lazy (pages chargées à la demande)
 * - Suspense fallback pour loading states propres
 * - i18n configuration au démarrage
 */

import './i18n/config';
import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
