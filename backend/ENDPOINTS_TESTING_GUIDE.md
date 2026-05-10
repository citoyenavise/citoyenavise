# Guide de Test des Endpoints — Citoyen Avisé

## 🚀 Setup Préalable

### 1. Base de données
```bash
# Créer la base de données
createdb citoyenavise_dev

# Créer l'extension PostGIS
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"

# Appliquer les migrations (dans l'ordre)
psql citoyenavise_dev < backend/src/migrations/001_create_users.sql
psql citoyenavise_dev < backend/src/migrations/002_create_elus.sql
psql citoyenavise_dev < backend/src/migrations/003_create_circonscriptions.sql
psql citoyenavise_dev < backend/src/migrations/004_create_petitions.sql
psql citoyenavise_dev < backend/src/migrations/005_create_elu_commitments.sql
```

### 2. Environment Variables
Copier `.env.example` vers `.env` et configurer :
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/citoyenavise_dev
JWT_SECRET=your-super-secret-key-min-32-characters-CHANGE-IN-PRODUCTION
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@citoyenavise.org
FRONTEND_URL=http://localhost:3000
```

### 3. Démarrer le serveur
```bash
npm install
npm run dev
# Server running on http://localhost:5000
```

---

## 🔐 Authentification (Auth Routes)

### 1. Demander Magic Link
**POST** `/api/v1/auth/request-login`

```bash
curl -X POST http://localhost:5000/api/v1/auth/request-login \
  -H "Content-Type: application/json" \
  -d '{"email": "citoyen@example.com"}'
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Email de connexion envoyé. Vérifiez votre boîte email.",
  "userId": 1,
  "email": "citoyen@example.com"
}
```

### 2. Vérifier Magic Link
**GET** `/api/v1/auth/verify?token=xyz`

```bash
# Pour dev: vérifier la DB pour le token
psql citoyenavise_dev -c "SELECT token FROM email_verifications WHERE user_id = 1 LIMIT 1;"

# Puis utiliser le token
curl http://localhost:5000/api/v1/auth/verify?token=TOKEN_HERE
```

**Réponse (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "citoyen@example.com",
    "nom_complet": null,
    "verified_at": "2026-05-09T10:30:00Z"
  }
}
```

### 3. Compléter le Profil
**POST** `/api/v1/auth/complete-profile` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/auth/complete-profile \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nomComplet": "Jean Dupont",
    "province": "QC",
    "codePostal": "H2X 1A1"
  }'
```

### 4. Obtenir l'utilisateur courant
**GET** `/api/v1/auth/me` (Protected)

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 👥 Élus (Public)

### 1. Lister les élus
**GET** `/api/v1/elus`

```bash
curl "http://localhost:5000/api/v1/elus?niveau=fédéral&région=QC"
```

### 2. Obtenir détail d'un élu
**GET** `/api/v1/elus/:id`

```bash
curl http://localhost:5000/api/v1/elus/1
```

---

## 🗺️ Circonscriptions (Public)

### 1. Lister les circonscriptions
**GET** `/api/v1/circonscriptions`

```bash
curl http://localhost:5000/api/v1/circonscriptions
```

### 2. Chercher par code postal
**GET** `/api/v1/circonscriptions/by-code-postal/:code`

```bash
curl "http://localhost:5000/api/v1/circonscriptions/by-code-postal/H2X"
```

---

## 📋 Pétitions

### Public Endpoints

#### 1. Lister les pétitions
**GET** `/api/v1/petitions`

```bash
curl "http://localhost:5000/api/v1/petitions?status=published&limit=10"
```

#### 2. Obtenir détail
**GET** `/api/v1/petitions/:id`

```bash
curl http://localhost:5000/api/v1/petitions/1
```

#### 3. Obtenir signataires
**GET** `/api/v1/petitions/:id/signatures`

```bash
curl "http://localhost:5000/api/v1/petitions/1/signatures?limit=20"
```

#### 4. Obtenir mises à jour
**GET** `/api/v1/petitions/:id/updates`

```bash
curl http://localhost:5000/api/v1/petitions/1/updates
```

#### 5. Obtenir commentaires
**GET** `/api/v1/petitions/:id/comments`

```bash
curl http://localhost:5000/api/v1/petitions/1/comments
```

#### 6. Pétitions les plus signées
**GET** `/api/v1/petitions/top/signed`

```bash
curl http://localhost:5000/api/v1/petitions/top/signed
```

#### 7. Chercher pétitions
**GET** `/api/v1/petitions/search?q=santé`

```bash
curl "http://localhost:5000/api/v1/petitions/search?q=financement%20école&limit=10"
```

#### 8. Statistiques
**GET** `/api/v1/petitions/stats`

```bash
curl http://localhost:5000/api/v1/petitions/stats
```

### Protected Endpoints

#### 1. Créer une pétition
**POST** `/api/v1/petitions` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/petitions \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Augmenter le financement des écoles publiques",
    "description": "Les écoles publiques ont besoin de plus de ressources pour offrir une meilleure éducation.",
    "eluId": 1,
    "deadline": "2026-12-31T23:59:59Z"
  }'
```

#### 2. Mettre à jour une pétition (brouillon seulement)
**PUT** `/api/v1/petitions/:id` (Protected)

```bash
curl -X PUT http://localhost:5000/api/v1/petitions/1 \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Augmenter significativement le financement des écoles publiques",
    "description": "Nouvelle description..."
  }'
```

#### 3. Publier une pétition
**POST** `/api/v1/petitions/:id/publish` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/petitions/1/publish \
  -H "Authorization: Bearer TOKEN_HERE"
```

#### 4. Signer une pétition
**POST** `/api/v1/petitions/:id/sign` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/petitions/1/sign \
  -H "Authorization: Bearer TOKEN_HERE"
```

#### 5. Retirer sa signature
**DELETE** `/api/v1/petitions/:id/sign` (Protected)

```bash
curl -X DELETE http://localhost:5000/api/v1/petitions/1/sign \
  -H "Authorization: Bearer TOKEN_HERE"
```

#### 6. Ajouter une mise à jour
**POST** `/api/v1/petitions/:id/updates` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/petitions/1/updates \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "contenu": "Nous avons reçu une réponse positive du ministre de l'\''Éducation."
  }'
```

#### 7. Supprimer une mise à jour
**DELETE** `/api/v1/petitions/:id/updates/:updateId` (Protected)

```bash
curl -X DELETE http://localhost:5000/api/v1/petitions/1/updates/42 \
  -H "Authorization: Bearer TOKEN_HERE"
```

#### 8. Ajouter un commentaire
**POST** `/api/v1/petitions/:id/comments` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/petitions/1/comments \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "contenu": "C'\''est une excellente initiative!"
  }'
```

#### 9. Supprimer un commentaire
**DELETE** `/api/v1/petitions/:id/comments/:commentId` (Protected)

```bash
curl -X DELETE http://localhost:5000/api/v1/petitions/1/comments/99 \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 🤝 Engagements des Élus (ELU Commitments)

### Public Endpoints

#### 1. Lister les engagements
**GET** `/api/v1/elu-commitments`

```bash
curl "http://localhost:5000/api/v1/elu-commitments?status=en%20cours&limit=20"
```

#### 2. Obtenir un engagement
**GET** `/api/v1/elu-commitments/:id`

```bash
curl http://localhost:5000/api/v1/elu-commitments/1
```

#### 3. Engagements d'un élu spécifique
**GET** `/api/v1/elu-commitments/elu/:eluId`

```bash
curl "http://localhost:5000/api/v1/elu-commitments/elu/1?status=engagée"
```

#### 4. Filtrer par statut
**GET** `/api/v1/elu-commitments/status/:status`

```bash
curl "http://localhost:5000/api/v1/elu-commitments/status/complétée"
```

#### 5. Chercher engagements
**GET** `/api/v1/elu-commitments/search?q=financement`

```bash
curl "http://localhost:5000/api/v1/elu-commitments/search?q=école&limit=10"
```

#### 6. Statistiques
**GET** `/api/v1/elu-commitments/stats`

```bash
curl http://localhost:5000/api/v1/elu-commitments/stats
```

### Protected Endpoints

#### 1. Suivre un engagement
**POST** `/api/v1/elu-commitments/:id/track` (Protected)

```bash
curl -X POST http://localhost:5000/api/v1/elu-commitments/1/track \
  -H "Authorization: Bearer TOKEN_HERE"
```

#### 2. Arrêter de suivre
**DELETE** `/api/v1/elu-commitments/:id/track` (Protected)

```bash
curl -X DELETE http://localhost:5000/api/v1/elu-commitments/1/track \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## ✅ Checklist de Test

### Auth Flow
- [ ] `request-login` envoie un email avec un lien magique
- [ ] `verify` accepte un token valide et retourne un JWT
- [ ] JWT valide permet d'accéder aux endpoints protégés
- [ ] JWT expiré est rejeté
- [ ] Token invalide retourne 401

### Pétitions
- [ ] Créer une pétition (status = draft)
- [ ] Mettre à jour un brouillon
- [ ] Publier une pétition (status = published)
- [ ] Signer une pétition (signatures_count += 1)
- [ ] Retirer sa signature (idempotent)
- [ ] Ajouter une mise à jour
- [ ] Ajouter un commentaire
- [ ] Seul le créateur peut modifier/publier

### Engagements
- [ ] Lister par élu
- [ ] Lister par statut
- [ ] Chercher par terme
- [ ] Suivre un engagement
- [ ] Arrêter de suivre
- [ ] Vérifier le count de suiveurs

### Erreurs
- [ ] 404 si ressource inexistante
- [ ] 403 si pas de permission
- [ ] 400 si paramètres invalides
- [ ] 409 si conflit (déjà signé, etc)

---

## 🐛 Debugging

### Vérifier les données en DB
```bash
# Vérifier les utilisateurs
psql citoyenavise_dev -c "SELECT * FROM users LIMIT 5;"

# Vérifier les pétitions
psql citoyenavise_dev -c "SELECT * FROM petitions LIMIT 5;"

# Vérifier les signatures
psql citoyenavise_dev -c "SELECT * FROM petition_signatures LIMIT 5;"

# Vérifier les tokens
psql citoyenavise_dev -c "SELECT * FROM email_verifications WHERE used_at IS NULL LIMIT 1;"
```

### Vérifier les logs
```bash
# Depuis le terminal where `npm run dev` est actif
# Ou vérifier le fichier .env pour le niveau de log
LOG_LEVEL=debug
```

---

## 📊 Requête de Base de Données Utiles

### Statistiques
```sql
-- Pétitions par statut
SELECT status, COUNT(*) FROM petitions GROUP BY status;

-- Pétitions les plus signées
SELECT id, titre, signatures_count FROM petitions ORDER BY signatures_count DESC LIMIT 10;

-- Engagements par statut
SELECT status, COUNT(*) FROM elu_commitments GROUP BY status;

-- Utilisateurs vérifiés
SELECT COUNT(*) FROM users WHERE verified_at IS NOT NULL;
```

---

## 🔗 Related Files
- Backend: `backend/src/routes/*.js`
- Models: `backend/src/models/*.js`
- Migrations: `backend/src/migrations/*.sql`
- Config: `backend/.env.example`
