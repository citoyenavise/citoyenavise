---
name: Prompt — Module Authentification
description: Guide pour implémenter login/register/jwt
type: reference
---

# Module 1 : Authentification & Utilisateurs

**Utilise ce prompt quand tu travailles sur inscription, connexion, profils utilisateurs**

## 🎯 Vue d'ensemble
- **Responsabilité** : Gestion identité, JWT, sessions, rôles
- **Tables** : `users`, `profiles`
- **API** : /auth/register, /auth/login, /auth/me
- **Sécurité** : bcrypt, JWT (24h), CORS

## 📚 Fichiers de référence
- _ai/02_architecture_modules.md — Module 1
- database/schema.sql — Tables users/profiles
- _ai/01_contraintes_generales.md — Sections Auth, Backend API

## 🏗️ Checklist d'implémentation

### Backend Routes
```javascript
// backend/src/routes/auth.js
POST /api/v1/auth/register      → { email, password, username }
POST /api/v1/auth/login         → { email, password }
POST /api/v1/auth/refresh       → { refreshToken } (futur)
GET  /api/v1/auth/me            → Utilisateur actuel (JWT required)
POST /api/v1/auth/logout        → Invalider token (futur)
```

### Services
```javascript
// authService.js
- hashPassword(password) → bcrypt hash
- validatePassword(password, hash) → boolean
- generateTokens(user) → { accessToken, refreshToken }
- verifyToken(token) → user payload
- createUser(email, password, username) → user object

// userService.js
- getUserById(id) → user + profile
- updateUser(id, data) → user updated
- deleteUser(id) → soft delete
```

### Middleware
```javascript
// middleware/auth.js
- verifyJWT(req, res, next) → Décoder token, attacher user à req
- requireAuth(req, res, next) → Retourner 401 si pas de token
- requireRole(role) → Retourner 403 si pas de rôle
```

### Tests (Supertest)
```javascript
describe('Auth Routes', () => {
  test('POST /api/v1/auth/register : créer user', async () => {
    // Input validation
    // Hash password
    // Créer user en DB
    // Retourner user + token
  });
  
  test('POST /api/v1/auth/login : obtenir token', async () => {
    // Vérifier email existe
    // Vérifier password
    // Retourner token
  });
  
  test('GET /api/v1/auth/me : utilisateur actuel', async () => {
    // Avec JWT valide → retourner user
    // Sans JWT → 401
  });
});
```

### Validation Input
```javascript
// Utiliser Zod ou Joi
const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/[A-Z]/, 'Une majuscule'),
  username: z.string().min(3).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
```

### Erreurs courantes
```javascript
// ❌ MAUVAIS : plaintext password
users.password = password;

// ✅ BON : hasher avec bcrypt
const hash = await bcrypt.hash(password, 12);
users.password_hash = hash;

// ❌ MAUVAIS : token en console.log
console.log('JWT:', token);

// ✅ BON : logger en prod avec contexte
logger.info('User logged in', { userId: user.id, timestamp: new Date() });
```

### .env attendu
```
DATABASE_URL=postgresql://...
JWT_SECRET=min_32_chars_random_string
JWT_EXPIRY_ACCESS=24h
NODE_ENV=development
```

## 🧪 Exemple minimal

```javascript
// POST /api/v1/auth/register
{
  "email": "jean@example.com",
  "password": "SecurePass123",
  "username": "jean_db"
}

// Response 201
{
  "id": "uuid-user",
  "email": "jean@example.com",
  "username": "jean_db",
  "role": "citizen",
  "token": "eyJhbGc...",
  "profile": {
    "id": "uuid-profile",
    "user_id": "uuid-user",
    "bio": null,
    "location": null
  }
}

// POST /api/v1/auth/login
{
  "email": "jean@example.com",
  "password": "SecurePass123"
}

// Response 200
{
  "token": "eyJhbGc...",
  "user": { ... }
}

// GET /api/v1/auth/me (Authorization: Bearer eyJhbGc...)
// Response 200
{
  "id": "uuid-user",
  "email": "jean@example.com",
  "username": "jean_db",
  "profile": { ... }
}
```

## 🔒 Security Checklist
- [ ] Password min 8 chars, avec majuscule + nombre (optionnel v2)
- [ ] Hash avec bcrypt (min 12 rounds)
- [ ] JWT expiry 24h
- [ ] Rate limit : 60/min sur /register et /login
- [ ] CORS restreint au domaine principal
- [ ] HTTPS en production obligatoire
- [ ] Pas de user enumeration (même message pour "email exist" et "invalid password")
- [ ] Logs sans passwords

## 📋 Livrable attendu
1. backend/src/routes/auth.js — Routes
2. backend/src/controllers/authController.js — Logique HTTP
3. backend/src/services/authService.js — Hash + JWT
4. backend/src/middleware/auth.js — Vérification JWT
5. backend/tests/auth.test.js — Tests Supertest
6. Mise à jour _ai/40_journal_sessions/ avec décisions
