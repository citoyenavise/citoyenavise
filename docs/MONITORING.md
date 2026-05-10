# 📊 Monitoring & Error Tracking

## Sentry Setup

### 1. Créer un compte Sentry
1. Aller à https://sentry.io
2. S'inscrire (gratuit)
3. Créer un nouveau projet (React)
4. Copier le DSN

### 2. Configurer le Frontend

```bash
# Copier .env.example en .env
cp frontend/.env.example frontend/.env

# Ajouter le DSN Sentry
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### 3. Initialisation Automatique
```javascript
// src/monitoring/sentry.js
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.MODE,
  tracesSampleRate: 0.1,      // 10% des transactions
  replaysOnErrorSampleRate: 1.0, // 100% des erreurs
});
```

## 🎯 Fonctionnalités

### Error Boundary
Tous les erreurs React sont capturées automatiquement :
```javascript
<Sentry.ErrorBoundary fallback={<ErrorPage />}>
  <App />
</Sentry.ErrorBoundary>
```

### Health Check
Vérifie l'API toutes les minutes :
```javascript
GET /api/v1/health
- status: "ok"
- memory: { heapUsed, heapTotal }
```

Alertes :
- ⚠️ API unhealthy
- ⚠️ Memory usage > 90%

### Performance Monitoring
Collecte les métriques :
- Page load time
- Component render time
- API response time
- Network latency

### Session Replay
Enregistre les sessions utilisateur :
- 10% des sessions normales
- 100% des sessions avec erreur
- Masque les données sensibles

## 📈 Dashboard Sentry

1. **Issues** : Erreurs groupées
2. **Performance** : Traces & latency
3. **Releases** : Déploiements
4. **Health** : Résilience API

## 🔔 Alerting

Configurer dans Sentry :
1. Alert Rules → New Alert Rule
2. Condition : "A new issue"
3. Notification : Email / Slack / PagerDuty

Exemples :
- Error rate > 5%
- Performance > 3s
- Memory leak detected

## 📝 Logging Best Practices

```javascript
// Errors
Sentry.captureException(error);

// Warnings
Sentry.captureMessage('Memory usage high', 'warning');

// Info
Sentry.captureMessage('User signed petition', 'info');

// Breadcrumbs (contexte)
Sentry.captureMessage('Petitions page loaded');
```

## 🚀 Deployment

### Production
```bash
# Sentry CLI - upload source maps
sentry-cli releases create -p citoyenavise v1.0.0
sentry-cli releases files v1.0.0 upload-sourcemaps dist/
```

### Environment
```
Development  : tracesSampleRate: 0.5 (debug mode)
Staging      : tracesSampleRate: 0.2
Production   : tracesSampleRate: 0.1
```

## 💰 Pricing

| Plan | Events/mois | Price |
|------|-------------|-------|
| Free | 10K | $0 |
| Team | Unlimited | $99/user |
| Business | Unlimited | Custom |

## 📚 Resources

- [Sentry Docs](https://docs.sentry.io)
- [React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/platforms/javascript/performance/)
- [Release Tracking](https://docs.sentry.io/platforms/javascript/enriching-events/releases/)
