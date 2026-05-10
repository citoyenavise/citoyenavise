# 🗓️ ROADMAP D'EXÉCUTION — 30 Jours vers MVP

**Projet** : citoyenavise.org  
**Stratégie** : Option A — Restart Minimal  
**Objectif** : MVP fonctionnel avec utilisateurs réels  
**Deadline** : 30 jours (4-5 semaines)  
**Status** : ✅ Architecture décidée et cleanée

---

## 📊 Vue d'ensemble

```
JOUR 1-3  : Setup et Infrastructure         (40 heures)
JOUR 4-10 : Authentification                (80 heures)
JOUR 11-17: CRUD & Métier                   (80 heures)
JOUR 18-23: Frontend React                  (60 heures)
JOUR 24-28: Tests & Sécurité                (40 heures)
JOUR 29-30: Lancement Beta                  (20 heures)
───────────────────────────────────────────
TOTAL     :                                 (320 heures ~ 3-4 semaines à temps plein)
```

---

## ⚙️ JOUR 1-3 : Setup & Infrastructure

### 1.1 Backend Setup (Jour 1 — 8h)

**Objectif** : Serveur Express qui démarre et répond

```bash
cd backend
npm install
```

**Fichiers à vérifier/créer** :

```
✅ src/server.js            (existe)
✅ src/config/env.js        (existe)
✅ src/middlewares/logger.js (existe)
? src/database.js           (À CRÉER)
? .env.example              (À CRÉER)
```

**Tâches** :

- [ ] Vérifier que `npm install` passe sans erreurs
- [ ] Tester `npm run dev` → serveur démarre
- [ ] Vérifier `GET /health` → 200 OK
- [ ] Créer `.env.example` avec variables requises
- [ ] Documenter startup process

**Checklist** :
```bash
cd backend
npm install
npm run dev
# Teste dans autre terminal :
curl http://localhost:5000/health
# Doit retourner : {"status":"ok",...}
```

**Commit** : `chore: verify server.js startup`

---

### 1.2 PostgreSQL Setup (Jour 1-2 — 8h)

**Objectif** : Base de données connectée et testée

**Actions** :

```bash
# 1. Créer base de données
createdb citoyenavise_dev
psql citoyenavise_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 2. Tester connexion
psql citoyenavise_dev -c "SELECT 1;"  # Doit retourner : 1
```

**Fichier à créer** : `backend/src/database.js`

```javascript
// backend/src/database.js
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://user:password@localhost:5432/citoyenavise_dev'
});

export { pool };
```

**Tâches** :

- [ ] Créer base PostgreSQL
- [ ] Activer PostGIS
- [ ] Créer fichier database.js avec pool
- [ ] Tester connexion
- [ ] Documenter setup BD dans README

**Checklist** :
```bash
# Tester en Node REPL
node
> import { pool } from './backend/src/database.js'
> const result = await pool.query('SELECT NOW()')
> console.log(result.rows[0])  # Doit afficher timestamp
```

**Commit** : `feat: add PostgreSQL connection pool`

---

### 1.3 Routes Basiques (Jour 2-3 — 8h)

**Objectif** : Structure de routes sans logique

**Fichiers** :

```
backend/src/routes/
├── index.js          (router principal)
├── auth.js           (skeleton)
├── users.js          (skeleton)
├── posts.js          (skeleton)
└── votes.js          (skeleton)
```

**Exemple** : `backend/src/routes/auth.js`

```javascript
import express from 'express';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint (not implemented yet)' });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint (not implemented yet)' });
});

export default router;
```

**Tâches** :

- [ ] Créer 5 fichiers de routes (auth, users, posts, votes, profiles)
- [ ] Chaque route : method + path + JSON response
- [ ] Intégrer dans routes/index.js
- [ ] Tester avec curl/Postman
- [ ] Documenter endpoints

**Checklist** :
```bash
npm run dev
# Dans autre terminal :
curl -X POST http://localhost:5000/api/v1/auth/register
# Doit retourner JSON
```

**Commit** : `feat: add route stubs for auth, users, posts, votes`

---

## 🔐 JOUR 4-10 : Authentification (MVP)

### 2.1 User Model & Database (Jour 4 — 8h)

**Objectif** : Table users et model pour accès

**SQL** : `backend/migrations/001_create_users.sql`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**Fichier** : `backend/src/models/User.js`

```javascript
import { pool } from '../database.js';

export class User {
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async create(email, username, passwordHash) {
    const result = await pool.query(
      'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username',
      [email, username, passwordHash]
    );
    return result.rows[0];
  }
}
```

**Tâches** :

- [ ] Créer migration 001_create_users.sql
- [ ] Exécuter : `psql citoyenavise_dev < migrations/001_create_users.sql`
- [ ] Vérifier table : `\dt users`
- [ ] Créer User.js model
- [ ] Tester requêtes

**Commit** : `feat: create users table and User model`

---

### 2.2 AuthService & JWT (Jour 5 — 8h)

**Objectif** : Enregistrement et connexion avec JWT

**Fichier** : `backend/src/services/AuthService.js`

```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export class AuthService {
  static async register(email, username, password) {
    // Vérifier unicité
    const existing = await User.findByEmail(email);
    if (existing) throw new Error('Email already registered');

    // Hasher password
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer user
    const user = await User.create(email, username, passwordHash);

    // Générer JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  static async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid password');

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  }
}
```

**Tâches** :

- [ ] Créer AuthService.js
- [ ] Tester register() localement
- [ ] Tester login() localement
- [ ] Vérifier JWT encoding/decoding

**Commit** : `feat: implement AuthService with bcrypt and JWT`

---

### 2.3 Auth Routes (Jour 6 — 8h)

**Objectif** : Routes /register et /login réelles

**Fichier** : `backend/src/routes/auth.js` (updated)

```javascript
import express from 'express';
import { AuthService } from '../services/AuthService.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    
    // Validation basique
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await AuthService.register(email, username, password);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const result = await AuthService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;
```

**Tâches** :

- [ ] Implémenter POST /register
- [ ] Implémenter POST /login
- [ ] Tester avec Postman
- [ ] Vérifier tokens JWT valides

**Test** :
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Doit retourner token JWT
```

**Commit** : `feat: implement register and login endpoints`

---

### 2.4 Auth Middleware (Jour 7 — 8h)

**Objectif** : Protéger les routes avec JWT

**Fichier** : `backend/src/middlewares/auth.js` (update)

```javascript
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Tâches** :

- [ ] Mettre à jour authMiddleware
- [ ] Tester protection de route
- [ ] Vérifier que /me retourne utilisateur connecté

**Test** :
```bash
# GET /me (sans token)
curl http://localhost:5000/api/v1/auth/me
# Doit retourner 401

# GET /me (avec token)
curl -H "Authorization: Bearer <token_from_login>" \
  http://localhost:5000/api/v1/auth/me
# Doit retourner user data
```

**Commit** : `feat: add JWT authentication middleware`

---

## 👥 JOUR 11-17 : CRUD & Métier

### 3.1 Users CRUD (Jour 11 — 8h)

**Routes** :
- GET /api/v1/users/:id
- PUT /api/v1/users/:id
- DELETE /api/v1/users/:id

**Commit** : `feat: implement users CRUD endpoints`

---

### 3.2 Posts Model & Service (Jour 12-13 — 12h)

**Table** :
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Commit** : `feat: implement posts model and service`

---

### 3.3 Posts API (Jour 14-15 — 12h)

**Routes** :
- GET /api/v1/posts (list)
- POST /api/v1/posts (create)
- GET /api/v1/posts/:id
- PUT /api/v1/posts/:id
- DELETE /api/v1/posts/:id

**Commit** : `feat: implement posts API endpoints`

---

### 3.4 Votes System (Jour 16-17 — 12h)

**Routes** :
- POST /api/v1/posts/:id/votes (like/vote)
- GET /api/v1/posts/:id/votes (results)
- DELETE /api/v1/posts/:id/votes/:voteId

**Commit** : `feat: implement voting system`

---

## 🎨 JOUR 18-23 : Frontend React

### 4.1 Project Setup (Jour 18 — 4h)

```bash
cd frontend
npm install
npm run dev
```

**Commit** : `chore: frontend dependencies installed`

---

### 4.2 Login/Register Pages (Jour 19-20 — 12h)

**Pages** :
- `/login` → Form
- `/register` → Form
- `/` → Redirect to login if not auth

**Commit** : `feat: implement authentication pages`

---

### 4.3 Feed & Posts (Jour 21-22 — 12h)

**Pages** :
- `/feed` → List posts
- `/posts/new` → Create post
- `/posts/:id` → View post

**Commit** : `feat: implement posts and feed UI`

---

### 4.4 User Profiles (Jour 23 — 8h)

**Pages** :
- `/profile` → Current user
- `/profile/:username` → View user

**Commit** : `feat: implement user profiles`

---

## ✅ JOUR 24-28 : Tests & Sécurité

### 5.1 API Tests (Jour 24-25 — 16h)

- Test auth endpoints
- Test CRUD endpoints
- Test protected routes

**Commit** : `test: add API integration tests`

---

### 5.2 Security Review (Jour 26 — 8h)

- [ ] Password validation
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention
- [ ] CORS configured
- [ ] Rate limiting

**Commit** : `chore: security hardening review`

---

### 5.3 Performance & Docs (Jour 27-28 — 16h)

- [ ] Add database indexes
- [ ] Document API endpoints
- [ ] Create deployment guide
- [ ] Write user guide

**Commit** : `docs: comprehensive API documentation and guides`

---

## 🚀 JOUR 29-30 : Lancement Beta

### 6.1 Beta Setup (Jour 29 — 12h)

- Deploy en staging
- Test en conditions réelles
- Fix bugs découverts
- Créer compte demo

**Commit** : `release: v0.1.0 beta`

---

### 6.2 Launch & Monitoring (Jour 30 — 8h)

- Lancer auprès de beta users
- Monitorer erreurs
- Collecte feedback
- Documenter version v1.0

---

## 📋 Checklist Quotidienne

Chaque jour :

```
□ Matin : Revue objectifs du jour
□ Coder : Implémenter une ou deux features
□ Test : Tester localement avec Postman/curl
□ Commit : Committer avec message clair
□ Document : Mettre à jour README
□ Soir : Revue progrès vs plan
```

---

## 🛠️ Stack Technologique Confirmée

**Backend** :
- ✅ Node.js 18+
- ✅ Express 4.18
- ✅ PostgreSQL 12+
- ✅ JWT (jsonwebtoken)
- ✅ bcrypt

**Frontend** :
- ✅ React 18.2
- ✅ Vite 5.0
- ✅ TailwindCSS 3.3
- ✅ Zustand (state)

**DevOps** :
- ✅ Git workflow
- ✅ Environment variables (.env)
- ✅ Nodemon (dev)

---

## 📞 Support & Questions

- Architecture ? → Voir CLAUDE.md
- Stuck ? → Demander à Claude
- Bug ? → Déboguer localement, puis commit

---

## 🎯 Milestones

| Date | Milestone | Status |
|---|---|---|
| Jour 3 | ✅ Server démarre, BD connectée | 🔄 En cours |
| Jour 10 | ✅ Auth complète (register/login) | ⏳ À faire |
| Jour 17 | ✅ API métier complète (CRUD) | ⏳ À faire |
| Jour 23 | ✅ Frontend basique fonctionnel | ⏳ À faire |
| Jour 28 | ✅ Tests + docs complètes | ⏳ À faire |
| Jour 30 | 🚀 Beta live | ⏳ À faire |

---

**Prochaines étapes immédiates** :

1. Démarrer Jour 1 (setup backend)
2. Créer `.env` et tester serveur
3. Créer base PostgreSQL
4. Commit initial : "chore: day 1 setup complete"

À bientôt ! 🚀
