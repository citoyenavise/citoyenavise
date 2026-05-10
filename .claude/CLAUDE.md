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

## 🔄 État d'Implémentation

### **Phase 1 : Architecture & Setup (COMPLÉTÉ ✅)**
```
✅ Supprimer app.js + core/
✅ Mettre à jour package.json
✅ Mettre à jour CLAUDE.md
✅ Créer server.js minimal
✅ Commit : "chore: restart with minimal server.js"
```

### **Phase 2 : Database & Migrations (COMPLÉTÉ ✅)**
```
✅ Créer 5 migrations SQL
✅ Créer models (User, Elu, Circonscription, Petition, EluCommitment)
✅ Créer database pool & config
✅ Ajouter indexes et constraints
✅ Commit : "feat: create database schema"
```

### **Phase 3 : API Authentification (COMPLÉTÉ ✅)**
```
✅ Implémenter EmailService avec magic link
✅ Implémenter AuthService (JWT, tokens)
✅ Créer middlewares/auth.js
✅ Routes : POST /request-login, GET /verify, POST /complete-profile, GET /me, POST /logout
✅ Commit : "feat: implement magic link authentication"
```

### **Phase 4 : API Élus & Circonscriptions (COMPLÉTÉ ✅)**
```
✅ Routes publiques GET /elus avec filters
✅ Routes publiques GET /circonscriptions avec filters
✅ Recherche full-text en français
✅ Statistiques endpoints
✅ Commit : "feat: implement elus and circonscriptions API"
```

### **Phase 5 : API Pétitions (COMPLÉTÉ ✅)**
```
✅ Routes publiques (list, detail, signatures, updates, comments, search)
✅ Routes protégées (create, publish, sign, add updates/comments)
✅ Ownership checks pour modifications
✅ Commit : "feat: implement petitions and protected routes"
```

### **Phase 6 : API Engagements Élus (COMPLÉTÉ ✅)**
```
✅ Modèle EluCommitment avec tracking
✅ Routes publiques (list, search, stats)
✅ Routes protégées (track, untrack)
✅ Commit : "feat: implement elu_commitments routes"
```

### **Phase 7 : Frontend React (COMPLÉTÉ ✅)**
```
✅ Implémenter composants React (Header, ProtectedRoute, Toast, UI components)
✅ Magic link auth flow (Login, Register pages)
✅ Pages : Pétitions (list/detail), Élus (list/detail), Engagements
✅ Routing avec react-router-dom
✅ State management avec Zustand
✅ API client avec axios
✅ Commit : "feat: implement frontend React components"
```

### **Phase 8 : Tests & Lancement (EN COURS)**
```
✅ Tests automatisés backend (14 fichiers test, >85% couverture)
✅ Tests automatisés frontend (5 fichiers test, 64 tests passants)
✅ Configuration CI/CD avec GitHub Actions (Snyk, SonarQube, Jest, Vitest)
✅ Sécurité HTTP (Helmet + CORS sécurisé)
✅ Docker & docker-compose pour staging local
✅ ESLint + Prettier + Husky pre-commit hooks
□ Seed données test
□ Déploiement production
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

## 📚 API Endpoints (Implémentés ✅)

### Authentification (Magic Link)
```
POST   /api/v1/auth/request-login         ✅ Demander magic link
GET    /api/v1/auth/verify?token=xyz     ✅ Vérifier token
POST   /api/v1/auth/complete-profile     ✅ Compléter profil (Protected)
GET    /api/v1/auth/me                   ✅ Utilisateur actuel (Protected)
POST   /api/v1/auth/logout               ✅ Déconnexion (Protected)
```

### Élus (Public)
```
GET    /api/v1/elus                  ✅ Lister avec filters
GET    /api/v1/elus/:id              ✅ Détail
GET    /api/v1/elus/niveau/:niveau   ✅ Filter par niveau
GET    /api/v1/elus/région/:région   ✅ Filter par région
GET    /api/v1/elus/search?q=        ✅ Recherche full-text
GET    /api/v1/elus/stats            ✅ Statistiques
```

### Circonscriptions (Public)
```
GET    /api/v1/circonscriptions                   ✅ Lister
GET    /api/v1/circonscriptions/:id              ✅ Détail
GET    /api/v1/circonscriptions/by-code-postal   ✅ Par code postal
GET    /api/v1/circonscriptions/by-région        ✅ Par région
GET    /api/v1/circonscriptions/search?q=        ✅ Recherche
GET    /api/v1/circonscriptions/stats            ✅ Statistiques
```

### Pétitions
```
Public:
GET    /api/v1/petitions                     ✅ Lister (status=published)
GET    /api/v1/petitions/:id                 ✅ Détail
GET    /api/v1/petitions/:id/signatures      ✅ Signataires
GET    /api/v1/petitions/:id/updates         ✅ Mises à jour
GET    /api/v1/petitions/:id/comments        ✅ Commentaires
GET    /api/v1/petitions/top/signed          ✅ Top 10
GET    /api/v1/petitions/search?q=           ✅ Recherche
GET    /api/v1/petitions/stats               ✅ Statistiques

Protected:
POST   /api/v1/petitions                     ✅ Créer
PUT    /api/v1/petitions/:id                 ✅ Mettre à jour (draft)
POST   /api/v1/petitions/:id/publish         ✅ Publier
POST   /api/v1/petitions/:id/sign            ✅ Signer
DELETE /api/v1/petitions/:id/sign            ✅ Retirer signature
POST   /api/v1/petitions/:id/updates         ✅ Ajouter mise à jour
DELETE /api/v1/petitions/:id/updates/:id     ✅ Supprimer mise à jour
POST   /api/v1/petitions/:id/comments        ✅ Ajouter commentaire
DELETE /api/v1/petitions/:id/comments/:id    ✅ Supprimer commentaire
```

### Engagements Élus
```
Public:
GET    /api/v1/elu-commitments             ✅ Lister
GET    /api/v1/elu-commitments/:id         ✅ Détail
GET    /api/v1/elu-commitments/elu/:eluId  ✅ Par élu
GET    /api/v1/elu-commitments/status/:s   ✅ Par statut
GET    /api/v1/elu-commitments/search?q=   ✅ Recherche
GET    /api/v1/elu-commitments/stats       ✅ Statistiques

Protected:
POST   /api/v1/elu-commitments/:id/track   ✅ Suivre
DELETE /api/v1/elu-commitments/:id/track   ✅ Arrêter de suivre
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
