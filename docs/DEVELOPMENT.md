# 🛠️ Guide de Développement - Citoyenavise.org

## 📋 Vue d'ensemble

Ce guide explique comment configurer et démarrer l'environnement de développement local.

---

## ⚡ Démarrage Rapide

### Option 1 : Script PowerShell (Recommandé - Windows)
```powershell
cd c:\Users\Dave\citoyenavise
.\scripts\dev.ps1
```

**Résultat** :
- ✅ Backend sur `http://localhost:3000`
- ✅ Frontend sur `http://localhost:5173`
- ✅ Ouvre deux terminaux automatiquement

### Option 2 : Manuel (Tous systèmes)
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2 (après que le backend soit prêt)
cd frontend  
npm run dev
```

---

## 🔧 Configuration des Ports

### Pourquoi ces ports ?
- **Backend (3000)** : Port Express, API REST
- **Frontend (5173)** : Port Vite standard (rapide, HMR actif)
- **Proxy (/api)** : Frontend redirige `/api/*` vers `http://localhost:3000/api/v1/*`

### Configuration automatique

#### Frontend (`frontend/vite.config.js`)
```javascript
server: {
  port: 5173,           // Port Vite
  strictPort: true,     // Erreur si 5173 est occupé
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  // Backend
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api/v1')
    }
  }
}
```

#### Backend (`backend/.env`)
```env
PORT=3000                              # Port Express
FRONTEND_URL=http://localhost:5173     # URL frontend pour magic links
CORS_ORIGIN=http://localhost:5173      # CORS autorisé
```

---

## 🔐 Magic Link Flow (Authentification)

### Processus
1. User va sur `http://localhost:5173/fr/login`
2. Demande magic link avec email
3. Backend génère token et envoie email
4. En mode DEV : token affiché dans terminal
5. User clique lien → `http://localhost:5173/fr/verify?token=XYZ`
6. Frontend appelle `POST /api/auth/verify?token=XYZ`
7. Backend valide et retourne JWT
8. User connecté ✅

### Important
- **FRONTEND_URL** dans `backend/.env` DOIT correspondre au port Vite
- **Proxy** dans `vite.config.js` DOIT pointer vers le backend
- Sans ces deux, les magic links cassent ❌

---

## 📁 Structure du Projet

```
citoyenavise/
├── backend/                # Express API + Sequelize
│   ├── .env               # ⚙️ Configuration locale
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Logique métier
│   │   └── models/        # Modèles BD
│   └── package.json       # npm run dev
│
├── frontend/              # React + Vite
│   ├── .env              # ⚙️ Configuration locale
│   ├── vite.config.js    # ⚙️ Port + Proxy
│   ├── src/
│   │   ├── pages/        # Pages React
│   │   ├── components/   # Composants React
│   │   └── api/          # Client API
│   └── package.json      # npm run dev
│
├── scripts/
│   └── dev.ps1           # 🚀 Démarrage PowerShell
│
└── docs/
    ├── DEVELOPMENT.md    # Ce fichier
    └── ...
```

---

## 🚦 Troubleshooting

### ❌ Frontend ne se connecte pas au Backend
**Cause** : Proxy Vite pointe mauvais port

**Solution** :
1. Vérifier `frontend/vite.config.js` line 15 : `target: 'http://localhost:3000'`
2. Vérifier `backend/.env` : `PORT=3000`
3. Tuer et relancer

### ❌ Port 3000 ou 5173 déjà utilisé
**Solution** :
```powershell
# Windows
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Linux/Mac
pkill -f "node"

# Puis relancer
.\scripts\dev.ps1
```

### ❌ Magic link cassé (lien invalide)
**Cause** : `FRONTEND_URL` incorrect dans `backend/.env`

**Solution** :
1. Vérifier `backend/.env` : `FRONTEND_URL=http://localhost:5173`
2. Vérifier que le frontend tourne sur 5173 (not 3000)
3. Regénérer magic link

### ❌ CORS error (blocked by browser)
**Cause** : Frontend/Backend ports mismatch

**Solution** :
```env
# backend/.env
CORS_ORIGIN=http://localhost:5173   # MUST match frontend port
```

### ❌ Database connexion error
**Solution** :
```bash
# Vérifier PostgreSQL local
psql -h localhost -U postgres -c "SELECT 1"

# Ou utiliser Docker
docker-compose up -d postgres

# Vérifier DATABASE_URL dans backend/.env
```

---

## 🔍 Debugging

### Voir les logs du backend
```bash
cd backend
npm run dev
# Logs s'affichent dans le terminal
```

### Voir les logs du frontend (Vite)
```bash
cd frontend
npm run dev
# HMR + logs Vite dans le terminal
# DevTools du navigateur
```

### Magic link token en DEV
```bash
# Mode DEV sans SMTP : token affiché dans terminal du backend
[DEV] Lien magic link créé (email non envoyé)
devMagicLink: http://localhost:5173/fr/verify?token=abc123...
```

### API test avec curl
```bash
# Requête API simple
curl -X POST http://localhost:3000/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Réponse (dev mode)
{
  "success": true,
  "devMagicLink": "http://localhost:5173/fr/verify?token=..."
}
```

---

## 📚 Commandes Utiles

### Backend
```bash
cd backend

npm run dev           # Démarrage dev (nodemon)
npm start            # Démarrage production
npm test             # Tests
npm run lint         # ESLint
npm run migrate      # Migrations BD
npm run seed         # Données test
```

### Frontend
```bash
cd frontend

npm run dev          # Démarrage dev (HMR)
npm run build        # Build production
npm run preview      # Preview build
npm test             # Tests Vitest
npm run lint         # ESLint
npm run format       # Prettier
```

---

## 🌐 URLs de Développement

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `http://localhost:3000` | Express server |
| **Swagger Docs** | `http://localhost:3000/api-docs` | API documentation |
| **Frontend** | `http://localhost:5173` | React app |
| **Login Page** | `http://localhost:5173/fr/login` | Authentication |
| **Admin Dashboard** | `http://localhost:5173/fr/admin` | Admin panel |
| **Petitions List** | `http://localhost:5173/fr/petitions` | Main feature |
| **Elus Map** | `http://localhost:5173/fr/carte` | Interactive map |

---

## 🔐 Authentification Flow

### Magic Link (Default)
1. Aller à `/fr/login`
2. Entrer email
3. Cliquer lien dans email (en DEV : copier du terminal)
4. Redirection auto à `/fr/verify?token=...`
5. Si valide → connecté + JWT stocké
6. Redirection à `/fr` (accueil)

### Test rapide
```bash
# 1. Demander magic link
curl -X POST http://localhost:3000/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Copier le token depuis la réponse DEV
# 3. Vérifier le token
curl "http://localhost:3000/api/v1/auth/verify?token=ABC123..."

# 4. Utiliser JWT pour requêtes protégées
curl -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3000/api/v1/auth/me
```

---

## 📝 Notes Importantes

### Pour Collaborateurs
- **Toujours tirer** `main` avant de démarrer
- **Copier** `.env.example` → `.env` (local only)
- **Ne jamais commiter** `.env` avec secrets réels
- **Tester localement** avant de push

### Avant Commit
```bash
npm run lint:fix      # Fixer les erreurs ESLint
npm run format        # Format code
npm test              # Lancer tests
git status            # Vérifier fichiers changés
git diff              # Vérifier changements
```

### Secrets (Production)
- `JWT_SECRET` : Généré au déploiement
- `DATABASE_URL` : Depuis environment variables
- `SMTP_CREDENTIALS` : Depuis secrets manager (GitHub, AWS, etc)

---

## 🆘 Besoin d'aide?

1. Lire [README.md](../README.md) - Vue générale
2. Lire [CLAUDE.md](../.claude/CLAUDE.md) - Architecture
3. Ouvrir issue sur GitHub
4. Contacter team@citoyenavise.org
