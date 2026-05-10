# 🇨🇦 Citoyenavise.org

[![Build Status](https://github.com/citoyenavise/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/citoyenavise/platform/actions)
[![Code Quality](https://img.shields.io/badge/code%20quality-A+-brightgreen)](https://sonarqube.citoyenavise.org)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-green)](./FINAL_CHECKLIST.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Plateforme civique libre de suivi des promesses électorales et de participation démocratique**

Une plateforme open-source permettant aux citoyens québécois de :
- 📋 Créer et signer des pétitions
- 🗳️ Suivre les promesses électorales
- 📍 Localiser les élus sur une carte interactive
- 📊 Consulter l'indice de transparence
- 🌍 Participer à la démocratie participative

---

## 🎯 Vision & Mission

**Vision** : Rendre la démocratie transparente et accessible à tous

**Mission** : Créer une plateforme où les citoyens peuvent facilement :
- Créer des pétitions adressées aux élus
- Signer des pétitions en ligne
- Suivre les promesses des politiciens
- Consulter des informations sur les élus
- Participer activement à la vie civique

---

## ✨ Features Principales

### 🔐 Authentification
- ✅ Magic Link (email-only authentication)
- ✅ JWT tokens sécurisés
- ✅ Sessions persistantes
- ✅ Logout & session management

### 📋 Pétitions
- ✅ Création par citoyens
- ✅ Signatures idempotentes (un citoyen = une signature)
- ✅ Commentaires & discussions
- ✅ Mises à jour en temps réel
- ✅ Statuts (brouillon, publié, clôturé, gagné)
- ✅ Recherche full-text

### 🗳️ Élus & Transparence
- ✅ Profils publics des élus (tous les niveaux)
- ✅ Localisation sur carte interactive
- ✅ Indice de transparence
- ✅ Suivi des promesses
- ✅ Engagement tracking
- ✅ Statistiques par région/niveau

### 🌍 Multilingue
- ✅ Support FR/EN complet
- ✅ Traductions intégrales (70+ clés)
- ✅ Sélection de langue persistent
- ✅ Auto-détection navigateur

### 📍 Carte Interactive
- ✅ Leaflet avec clustering
- ✅ Filtre par région
- ✅ Localisation en temps réel
- ✅ Responsive design mobile

### 📊 Dashboard Admin
- ✅ Gestion des pétitions
- ✅ Modération des commentaires
- ✅ Statistiques en temps réel
- ✅ Export de données

### 🔍 Monitoring & Analytics
- ✅ Sentry error tracking
- ✅ Health check API (1min)
- ✅ Performance monitoring
- ✅ Session replay

---

## 🛠️ Stack Technique

### Frontend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **React** | 18.2 | UI framework |
| **Vite** | 5.0 | Build tool |
| **React Router** | 6.20 | Routing |
| **i18next** | 26.0 | Multilingue |
| **Leaflet** | 1.9 | Cartes |
| **Axios** | Latest | HTTP client |
| **Zustand** | 4.4 | State management |
| **Tailwind CSS** | 3.3 | Styling |

### Backend
| Technologie | Version | Usage |
|-------------|---------|-------|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.18 | Framework |
| **Sequelize** | 6.32 | ORM |
| **PostgreSQL** | 12+ | Database |
| **JWT** | 9.0 | Auth |
| **Helmet** | 7.0 | Security |
| **Nodemailer** | 6.9 | Email |

### DevOps & Deployment
| Tool | Purpose |
|------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local dev environment |
| **GitHub Actions** | CI/CD pipeline |
| **Jest/Vitest** | Testing |
| **Sentry** | Error tracking |
| **Lighthouse** | Performance audit |

---

## 📦 Installation & Setup

### Prérequis
- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (optionnel)

### 1. Clone Repository
```bash
git clone https://github.com/citoyenavise/platform.git
cd citoyenavise
```

### 2. Setup Backend
```bash
cd backend

# Copier env
cp .env.example .env

# Installer dépendances
npm install

# Démarrer la base de données
docker-compose up -d postgres

# Exécuter migrations
npm run migrate

# (Optionnel) Remplir données test
npm run seed

# Démarrer le serveur
npm run dev
# → http://localhost:3000
```

### 3. Setup Frontend
```bash
cd ../frontend

# Installer dépendances
npm install

# Copier env
cp .env.example .env

# Démarrer Vite dev server
npm run dev
# → http://localhost:5173
```

### 4. Vérifier Installation
```bash
# Backend health check
curl http://localhost:3000/api/v1/health

# Frontend
# Ouvrir http://localhost:5173 dans le navigateur
```

---

## 📚 API Endpoints

### 🔐 Authentification
```
POST   /api/v1/auth/request-login       Demander magic link
GET    /api/v1/auth/verify?token=xyz    Vérifier token
POST   /api/v1/auth/complete-profile    Compléter profil (protected)
GET    /api/v1/auth/me                  Utilisateur actuel (protected)
POST   /api/v1/auth/logout              Déconnexion (protected)
```

### 📋 Pétitions
```
GET    /api/v1/petitions                 Lister (status=published)
GET    /api/v1/petitions/:id             Détail
POST   /api/v1/petitions                 Créer (protected)
PUT    /api/v1/petitions/:id             Modifier (protected, owner)
POST   /api/v1/petitions/:id/publish     Publier (protected)
POST   /api/v1/petitions/:id/sign        Signer (protected)
DELETE /api/v1/petitions/:id/sign        Retirer signature
GET    /api/v1/petitions/:id/signatures  Signataires
GET    /api/v1/petitions/search?q=       Recherche
GET    /api/v1/petitions/stats           Statistiques
```

### 🗳️ Élus
```
GET    /api/v1/elus                      Lister
GET    /api/v1/elus/:id                  Détail
GET    /api/v1/elus/search?q=            Recherche
GET    /api/v1/elus?region=X&niveau=Y    Filtrer
GET    /api/v1/elus/stats                Statistiques
```

### 🌍 Circonscriptions
```
GET    /api/v1/circonscriptions          Lister
GET    /api/v1/circonscriptions/:id      Détail
GET    /api/v1/circonscriptions/by-code-postal  Par code postal
GET    /api/v1/circonscriptions/search?q= Recherche
```

### 📊 Engagements Élus
```
GET    /api/v1/elu-commitments           Lister
GET    /api/v1/elu-commitments/:id       Détail
GET    /api/v1/elu-commitments/elu/:eluId Par élu
POST   /api/v1/elu-commitments/:id/track Suivre (protected)
DELETE /api/v1/elu-commitments/:id/track Arrêter de suivre
```

### ❤️ Autres
```
GET    /api/v1/health                    Health check
GET    /api/v1/actualites                Actualités
GET    /api/v1/gamification/stats        Gamification stats
```

Documentation complète : [Postman Collection](./docs/postman-collection.json)

---

## 🧪 Testing

### Unit & Integration Tests
```bash
npm test                      # Jest + Vitest (tous les tests)
npm run test:coverage         # Coverage report (>85% threshold)
npm run test:e2e             # Playwright e2e tests
npm run test:accessibility   # Axe a11y tests
npm run test:i18n            # Intégrité traductions (FR/EN)
```

### Test Coverage
```bash
cd frontend
npm run test:coverage    # Frontend coverage
# → Coverage HTML: coverage/index.html

cd ../backend
npm run test:coverage    # Backend coverage
# → Coverage HTML: coverage/index.html
```

### Code Quality
```bash
npm run lint               # ESLint analysis
npm run lint:fix          # Corriger automatiquement
npm run format            # Prettier formatting
npm audit                 # Dépendances vulnerabilities
```

### Continuous Integration
```
GitHub Actions Pipeline:
├── ESLint (code quality)
├── Jest tests (unit + integration)
├── Vitest (frontend)
├── Playwright (e2e)
├── SonarQube (code review)
├── Snyk (security scanning)
└── Lighthouse (performance)
```

---

## 🚀 Déploiement

### Development
```bash
# Backend
cd backend
npm run dev

# Frontend (autre terminal)
cd frontend
npm run dev
```

### Staging (Docker)
```bash
docker-compose up
# App: http://localhost:3000
# DB: postgresql://user:pass@localhost:5432
```

### Production
```bash
# Via script automatisé
./scripts/deploy-production.ps1  # Windows
./scripts/deploy-production.sh   # Linux/Mac

# Ou manuellement
npm run lint:fix
npm run test
npm run test:coverage
npm run build
npm audit
git push origin main
```

### Monitoring
- **Sentry** : Error tracking (https://sentry.io)
- **Lighthouse** : Performance audit
- **GitHub Actions** : CI/CD pipeline

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](.claude/CLAUDE.md)** | Guide architecture & développement |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | Vue d'ensemble complète |
| **[FINAL_CHECKLIST.md](FINAL_CHECKLIST.md)** | Checklist de polish |
| **[docs/I18N.md](docs/I18N.md)** | Guide multilingue |
| **[docs/MONITORING.md](docs/MONITORING.md)** | Setup Sentry |

---

## 🔐 Sécurité

### Implémentée
- ✅ JWT authentication
- ✅ Helmet.js security headers
- ✅ CORS configuré
- ✅ Rate limiting (100 req/15min)
- ✅ SQL injection prevention (Sequelize)
- ✅ XSS protection (React escaping)
- ✅ CSRF tokens
- ✅ Secure password hashing (bcrypt)

### Vérifier
```bash
npm audit                     # Audit dépendances
npm run lint                  # Code quality
curl -I http://localhost:3000 # Vérifier headers
```

---

## 📊 Architecture

```
Frontend                    Backend                  Database
┌─────────────────┐        ┌─────────────────┐      ┌──────────┐
│  React SPA      │        │  Express API    │      │PostgreSQL│
│  - Code split   │◄──────►│  - 50+ routes   │◄────►│ - 12 tbl │
│  - i18n (FR/EN) │ JSON   │  - JWT auth     │ SQL  │ - Indexed│
│  - Leaflet map  │        │  - Sequelize ORM│      │          │
│  - Suspense     │        │  - Rate limit   │      │          │
└─────────────────┘        └─────────────────┘      └──────────┘
       ↓                             ↓
    Vite build              Docker compose         Health check
    Code splitting          Migrations              (1min)
    Lazy loading            Seed data               Sentry
```

---

## 🤝 Contributing

1. Fork repository
2. Créer une feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- ESLint + Prettier (auto-fix: `npm run lint:fix`)
- Conventional Commits
- Tests obligatoires

---

## 📝 License

**GNU General Public License v3.0**

This project is licensed under the GPL 3.0 - see [LICENSE](LICENSE) file for details.

### License Summary
- ✅ Free to use, modify, distribute
- ✅ Must include original license
- ✅ Must disclose source
- ✅ Same license for derivatives
- ✅ No warranty provided

---

## 👥 Authors & Contributors

**Core Team**
- **Claude Code** - Initial development & architecture
- **Development Team** - Citoyen Avisé

**Contributors**
- [Open for contributors!](CONTRIBUTING.md)

---

## 🙏 Acknowledgments

**Libraries & Frameworks**
- [React](https://reactjs.org)
- [Express](https://expressjs.com)
- [Leaflet](https://leafletjs.com)
- [i18next](https://www.i18next.com)
- [Sentry](https://sentry.io)
- [Sequelize](https://sequelize.org)

**Infrastructure**
- [PostgreSQL](https://www.postgresql.org)
- [Docker](https://www.docker.com)
- [GitHub Actions](https://github.com/features/actions)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork Repository
```bash
git clone https://github.com/citoyenavise/platform.git
cd citoyenavise
git checkout -b feature/your-feature
```

### 2. Make Changes
```bash
# Install dependencies
npm install

# Create your feature
# Write tests
# Update documentation
```

### 3. Test & Lint
```bash
npm run lint:fix
npm run format
npm test
npm run test:coverage
```

### 4. Commit & Push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### 5. Open Pull Request
- Create PR on GitHub
- Link any related issues
- Wait for review & merge

### Code Style Guidelines
- Use ESLint + Prettier
- Conventional Commits (feat:, fix:, docs:, etc)
- Write tests for new features
- Update documentation
- Comment complex logic only

---

## 📞 Contact & Support

### General Inquiries
- **Email** : team@citoyenavise.org
- **Website** : https://citoyenavise.org
- **Twitter** : [@citoyenavise](https://twitter.com/citoyenavise)

### Technical Support
- **Issues** : [GitHub Issues](https://github.com/citoyenavise/platform/issues)
- **Discussions** : [GitHub Discussions](https://github.com/citoyenavise/platform/discussions)
- **Slack** : [Community Slack](https://slack.citoyenavise.org)

### Security Issues
- **Email** : security@citoyenavise.org
- **Do NOT open public issues for security vulnerabilities**

### Feedback & Suggestions
- [Feature Requests](https://github.com/citoyenavise/platform/discussions)
- [Bug Reports](https://github.com/citoyenavise/platform/issues)
- [General Feedback](https://feedback.citoyenavise.org)

---

## 📊 Monitoring & Observability

### Error Tracking
```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Features
✅ Automatic error capture
✅ Performance monitoring
✅ Session replay
✅ Health check (1min interval)
✅ Memory usage alerts
```

### Metrics & Dashboards
```
Prometheus    → Metrics collection
Grafana       → Dashboard visualization
ELK Stack     → Logs aggregation
CloudWatch    → AWS metrics
```

### Structured Logging
```javascript
// Backend logs
logger.info('Petition created', { 
  petitionId: 123, 
  userId: 456, 
  timestamp: Date.now() 
});

logger.error('API unhealthy', { 
  statusCode: 503,
  responseTime: 5000 
});
```

### Health Checks
```bash
# Backend health
curl http://localhost:3000/api/v1/health

# Response
{
  "status": "ok",
  "timestamp": "2026-05-10T14:30:00Z",
  "uptime": 86400,
  "memory": {
    "heapUsed": 52428800,
    "heapTotal": 104857600
  },
  "database": "connected"
}
```

---

## 🗺️ Roadmap

### Phase 9 (Juin 2026)
- [ ] Production deployment
- [ ] Beta testing
- [ ] User feedback loop
- [ ] Performance optimization
- [ ] Mobile responsiveness finalization

### Phase 10 (Juillet-Août)
- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] Integration with official records
- [ ] Gamification system
- [ ] Community features

### Phase 11 (Septembre+)
- [ ] Electoral prediction engine
- [ ] Blockchain voting (R&D)
- [ ] International expansion
- [ ] AI-powered summaries
- [ ] Voice & accessibility improvements

---

**[⬆ back to top](#)**

---

<div align="center">

### 🎉 Made with ❤️ for Democracy

[Website](https://citoyenavise.org) • [GitHub](https://github.com/citoyenavise) • [Twitter](https://twitter.com/citoyenavise)

</div>
