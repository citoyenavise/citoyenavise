# Citoyen Avisé

[![CI Status](https://github.com/yourusername/citoyenavise/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/yourusername/citoyenavise/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yourusername/citoyenavise/branch/develop/graph/badge.svg)](https://codecov.io/gh/yourusername/citoyenavise)

**Plateforme de participation citoyenne** — Comprendre, participer et influencer les décisions publiques

## 📋 À Propos

Citoyen Avisé transforme la compréhension des enjeux civiques en actions concrètes :
- 📚 **Accès à l'information transparente** — Découvrez les élus et leurs engagements
- 🤝 **Débats constructifs** — Créez et signez des pétitions citoyennes
- ⚡ **Influence réelle** — Engagez les élus via les pétitions

## 🛠 Stack Technique

### Backend
- **Node.js 18+** — Runtime JavaScript côté serveur
- **Express 4.18+** — Framework web minimaliste
- **PostgreSQL 12+** — Base de données relationnelle
- **Sequelize** — ORM pour requêtes élégantes
- **JWT** — Authentification par tokens
- **Zod** — Validation de schémas stricte

### Frontend
- **React 18+** — Bibliothèque UI avec hooks
- **Vite** — Bundler ultra-rapide
- **React Router** — Routage côté client
- **TailwindCSS** — Styles utilitaires responsifs

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

### Installation

```bash
# Clone le repo
git clone https://github.com/yourusername/citoyenavise.git
cd citoyenavise

# Installe dépendances
npm install

# Configure l'environnement
cp backend/.env.example backend/.env
# Édite backend/.env avec tes variables

# Démarre backend en développement
cd backend && npm run dev

# Dans un autre terminal, démarre frontend
cd frontend && npm run dev
```

### Backend
- **URL** : http://localhost:5000
- **API Docs** : http://localhost:5000/api-docs
- **Commandes** :
  ```bash
  npm run dev        # Développement avec nodemon
  npm start          # Production
  npm run test       # Tests Jest
  npm run test:coverage  # Couverture de tests
  npm run lint       # ESLint
  ```

### Frontend
- **URL** : http://localhost:3001 (ou 3000)
- **Commandes** :
  ```bash
  npm run dev        # Développement avec Vite
  npm run build      # Production build
  npm run preview    # Preview du build
  npm run lint       # ESLint
  npm run test       # Tests Vitest
  ```

## 📚 Architecture

```
citoyenavise/
├── backend/
│   ├── src/
│   │   ├── server.js              # Point d'entrée
│   │   ├── routes/                # Endpoints API
│   │   ├── models/                # Schémas Sequelize
│   │   ├── services/              # Logique métier
│   │   ├── middlewares/           # Auth, validation, logging
│   │   └── config/                # Configuration
│   └── __tests__/                 # Tests Jest
│
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Composants pages
│   │   ├── components/            # Composants réutilisables
│   │   ├── hooks/                 # React hooks
│   │   ├── contexts/              # Context API
│   │   ├── api/                   # Clients API
│   │   └── styles/                # Feuilles CSS
│   └── __tests__/                 # Tests Vitest
│
└── .github/
    └── workflows/
        └── ci.yml                 # Pipeline CI/CD
```

## 🔐 API Endpoints (v1)

### Authentification (Magic Link)
```
POST   /api/v1/auth/request-login      Demander lien magique
GET    /api/v1/auth/verify?token=XXX   Vérifier token
POST   /api/v1/auth/complete-profile   Compléter profil (Protected)
GET    /api/v1/auth/me                 Utilisateur actuel (Protected)
POST   /api/v1/auth/logout             Déconnexion (Protected)
```

### Élus (Public)
```
GET    /api/v1/elus                    Lister tous les élus
GET    /api/v1/elus/:id                Détail d'un élu
GET    /api/v1/elus/search?q=X         Recherche full-text
```

### Pétitions
```
Public:
GET    /api/v1/petitions               Lister les pétitions publiées
GET    /api/v1/petitions/:id           Détail d'une pétition
GET    /api/v1/petitions/:id/comments  Commentaires

Protected:
POST   /api/v1/petitions               Créer une pétition
POST   /api/v1/petitions/:id/sign      Signer une pétition
DELETE /api/v1/petitions/:id/sign      Retirer signature
POST   /api/v1/petitions/:id/comments  Ajouter commentaire
```

## ✅ Tests & Qualité du Code

```bash
# Backend
cd backend
npm run test              # Lance tous les tests
npm run test:coverage     # Coverage détaillée
npm run lint              # Vérifier ESLint

# Frontend
cd frontend
npm run test              # Lance tous les tests
npm run lint              # Vérifier ESLint
```

**Seuil de couverture** : Minimum 80% requis pour les CI/CD

## 🔄 Workflow Git

```bash
# Feature branch depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/mon-feature

# Développer et committer
git add .
git commit -m "feat: description claire"

# Push et créer PR vers develop
git push origin feature/mon-feature
# → Ouvrir PR sur GitHub

# Après review et tests CI passants
# → Merge dans develop
```

## 📝 Convention de Commits

Utilise le format [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat: add user authentication with magic link
fix: correct validation error in petition form
docs: update README with API documentation
test: add tests for petition endpoints
chore: update dependencies
refactor: simplify authentication service
```

## 🤝 Contribution

1. Fork le repo
2. Crée une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit tes changements (`git commit -m 'feat: add AmazingFeature'`)
4. Push vers ta branche (`git push origin feature/AmazingFeature`)
5. Ouvre une Pull Request vers `develop`

### Standards de Code
- ✅ Tests unitaires (Jest)
- ✅ Coverage ≥ 80%
- ✅ ESLint sans erreurs
- ✅ Conventional commits
- ✅ Documentation à jour

## 📜 License

MIT — Voir [LICENSE](./LICENSE) pour les détails

## 📞 Support

- 📧 Email : infocitoyenavise@gmail.com
- 🐛 Bugs : [Créer une issue](https://github.com/yourusername/citoyenavise/issues)
- 💬 Questions : [Discussions](https://github.com/yourusername/citoyenavise/discussions)

---

Construit avec ❤️ pour la démocratie participative
