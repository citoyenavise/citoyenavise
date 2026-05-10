/**
 * Toast Notification Component
 * Affiche les messages de notification temporaires
 */

import React from 'react';
import '../styles/Toast.css';

function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Fermer la notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
