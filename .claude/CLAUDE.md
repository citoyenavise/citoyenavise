# citoyenavise.org - Guide de Développement

**Dernière mise à jour** : 2026-05-09  
**Décision Architecture** : Option A — Restart Minimal avec server.js

---

## 🏗️ Architecture Décidée

✅ **GARDER** :
- `backend/src/server.js` (Express simple, 64 lignes)
- Node.js 18+
- Express 4.18+
- PostgreSQL 12+
- Middlewares minimaux (auth, logger, validation)

❌ **SUPPRIMER** :
- `app.js` (complexe, 440 lignes)
- Dossier `core/` entièrement (50+ modules inutiles)
- Orchestrator, StateMachine, CAAGS, phases
- Tous les 300+ documents de phase

---

## 📋 Structure du Projet (Nouvelle)

```
citoyenavise/
├── 📁 Pages HTML Statiques (40 fichiers)
│   └── Contenu civique (gouvernement, droits, etc.)
│
├── 📁 backend/
│   ├── package.json          (Express minimal)
│   ├── .env.example          (Configuration)
│   └── src/
│       ├── server.js         ✅ Point d'entrée (64 lignes)
│       ├── config/
│       │   └── env.js        (Chargement variables)
│       ├── middlewares/      (auth, logger, validation)
│       ├── routes/           (endpoints API)
│       ├── services/         (logique métier - À créer)
│       ├── models/           (schémas BD - À créer)
│       └── database.js       (pool PostgreSQL - À créer)
│
├── 📁 frontend/
│   ├── package.json          (React/Vite)
│   └── src/
│       ├── App.jsx           (Skeleton)
│       ├── pages/            (À implémenter)
│       ├── components/       (À implémenter)
│       ├── hooks/            (À implémenter)
│       └── api/              (Clients API - À implémenter)
│
└── 📄 Configuration
    ├── .claude/CLAUDE.md     (Ce fichier)
    └── package.json          (Monorepo root)
```

---

## 🚀 Setup Backend (Nouveau)

### Prérequis
- Node.js 18+
- PostgreSQL 12+

### Installation

```bash
cd backend

# 1. Copier configuration
cp .env.example .env

# 2. Éditer .env
nano .env  # Configure DATABASE_URL, JWT_SECRET, etc.

# 3. Installer dépendances
npm install

# 4. Démarrer en développement
npm run dev
# → Serveur sur http://localhost:5000
```

### Commandes Disponibles

```bash
npm run dev       # Développement avec nodemon
npm start         # Production
npm test          # Tests (à implémenter)
```

---

## 🔄 Flux de Travail

### **Phase 1 : Nettoyage (ACTUEL)**
```
✅ Supprimer app.js + core/
✅ Mettre à jour package.json
✅ Mettre à jour CLAUDE.md
→ Commit : "chore: restart with minimal server.js"
```

### **Phase 2 : API Authentification (Semaine 1)**
```
□ Implémenter services/AuthService.js
□ Créer routes/auth.js
□ Routes : POST /register, POST /login, GET /me
□ Commit : "feat: implement authentication API"
```

### **Phase 3 : CRUD Utilisateurs (Semaine 1-2)**
```
□ Créer models/User.js
□ Implémenter services/UserService.js
□ Routes CRUD : GET, POST, PUT, DELETE
□ Commit : "feat: implement user management API"
```

### **Phase 4 : Posts & Votes (Semaine 2)**
```
□ Modèles Post et Vote
□ Services correspondants
□ Routes API
□ Commit : "feat: implement posts and voting"
```

### **Phase 5 : Frontend React (Semaine 3)**
```
□ Implémenter composants principaux
□ Connecter API client
□ Pages : Login, Feed, Profile
□ Commit : "feat: implement frontend UI"
```

### **Phase 6 : Tests & Docs (Semaine 3-4)**
```
□ Tests unitaires (services)
□ Tests d'intégration (API)
□ Documentation API
□ Commit : "test: add test coverage"
```

### **Phase 7 : Lancement**
```
□ Deploy en staging
□ Tests en conditions réelles
□ Lancement public
□ Commit : "release: v1.0.0"
```

---

## 📝 Conventions de Code

### Routes API

```javascript
// routes/users.js - Structure standard
import express from 'express';
import { UserService } from '../services/UserService.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/v1/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await UserService.getById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/users (protégé)
router.post('/', authMiddleware, async (req, res) => {
  // Implémentation
});

export default router;
```

### Services

```javascript
// services/UserService.js - Logique métier isolée
export class UserService {
  static async getById(id) {
    // Requête DB + logique
  }
  
  static async create(data) {
    // Validation + insertion
  }
}
```

### Middlewares

```javascript
// middlewares/auth.js - Réutilisable
export const authMiddleware = (req, res, next) => {
  // Vérifier JWT
  next();
};
```

---

## 🌳 Branches Git

| Branche | Rôle | Déploiement |
|---------|------|------------|
| `main` | Production | ✅ Automatique |
| `develop` | Intégration | Non |
| `feature/*` | Nouvelles features | Non |

### Workflow

```bash
# 1. Créer feature branch
git checkout develop
git pull origin develop
git checkout -b feature/authentication

# 2. Développer
# ... code ...

# 3. Tester localement
npm run dev
# Tester avec Postman/curl

# 4. Commit
git add .
git commit -m "feat: implement login endpoint"

# 5. Push et PR
git push origin feature/authentication
# → Créer PR sur GitHub

# 6. Merge après review
git checkout develop
git merge feature/authentication
git push origin develop

# 7. Merger en main quand prêt
git checkout main
git merge develop
git push origin main
```

---

## 📚 API Endpoints (À Implémenter)

### Authentification
```
POST   /api/v1/auth/register    — Inscription
POST   /api/v1/auth/login       — Connexion
GET    /api/v1/auth/me          — Utilisateur actuel
POST   /api/v1/auth/logout      — Déconnexion
```

### Utilisateurs
```
GET    /api/v1/users/:id        — Profil utilisateur
PUT    /api/v1/users/:id        — Mettre à jour profil
DELETE /api/v1/users/:id        — Supprimer compte
```

### Posts & Idées
```
GET    /api/v1/posts            — Feed
POST   /api/v1/posts            — Créer post
GET    /api/v1/posts/:id        — Détail post
PUT    /api/v1/posts/:id        — Éditer post
DELETE /api/v1/posts/:id        — Supprimer post
```

### Votes
```
POST   /api/v1/posts/:id/votes  — Voter sur post
GET    /api/v1/posts/:id/votes  — Résultats votes
```

---

## ✅ Checklist Avant Commit

- [ ] Code testé localement
- [ ] Pas d'erreurs dans la console
- [ ] Routes testées avec Postman/curl
- [ ] Aucune clé secrète commitée
- [ ] Message de commit clair
- [ ] Code formaté (ESLint si configuré)

---

## 🆘 Troubleshooting

### Le serveur ne démarre pas
```bash
# Vérifier Node.js
node --version  # Doit être 18+

# Vérifier configuration
cat .env  # DATABASE_URL, JWT_SECRET configurés ?

# Vérifier PostgreSQL
psql -l  # Liste les bases

# Installer dépendances manquantes
npm install
```

### Erreur de base de données
```bash
# Vérifier connexion
psql postgresql://user:pass@localhost:5432/citoyenavise_dev

# Vérifier variables d'environnement
echo $DATABASE_URL
```

---

## 📞 Support

- Questions d'architecture ? → Demander à Claude
- Bug dans le code ? → Déboguer localement, puis push
- Besoin d'aide ? → Écrire en français, Claude comprend
