# État d'Implémentation Backend — Citoyen Avisé

## 📌 Vue d'ensemble

Le backend Citoyen Avisé est un serveur Express.js minimaliste avec PostgreSQL pour la gestion d'une plateforme de participation civique. L'architecture a été simplifiée de 50+ modules à 9 dépendances essentielles.

**Date**: 2026-05-09  
**Version**: 1.0.0  
**Node.js**: 18+  
**Database**: PostgreSQL 12+ avec PostGIS  

---

## ✅ Implémenté

### Infrastructure de Base
- [x] Express.js avec Express Router
- [x] CORS et Helmet pour la sécurité
- [x] Compression des réponses HTTP
- [x] Pool de connexion PostgreSQL
- [x] Configuration environment-based (.env)
- [x] Health check endpoint (`/health`)
- [x] API info endpoint (`/api/info`)

### Authentication & Security
- [x] Magic Link authentication (email token)
- [x] JWT tokens (7 jours d'expiration)
- [x] Email verification avec tokens uniques
- [x] Middleware d'authentification (`authMiddleware`)
- [x] Middleware optionnel (`authOptional`)
- [x] Ownership checks pour les ressources

### Database
- [x] Migration système complètes (005 migrations)
  - [x] 001 — Users & Email Verification
  - [x] 002 — Élus & Contacts
  - [x] 003 — Circonscriptions & Geolocation
  - [x] 004 — Pétitions & Signatures
  - [x] 005 — Engagements Élus
- [x] Indexes pour performance
- [x] Full-text search en français
- [x] Foreign keys avec CASCADE delete
- [x] Check constraints pour données valides
- [x] Unique constraints pour idempotency

### Email Service
- [x] EmailService singleton avec nodemailer
- [x] sendMagicLink() avec HTML formaté
- [x] sendWelcomeEmail()
- [x] sendPetitionNotification()
- [x] testConnection() pour vérifier SMTP

### Models (CRUD Operations)
- [x] **User**
  - findByEmail, findById, create, update
  - markVerified, delete, list
  - getStats, countVerified
- [x] **EmailVerification** (support)
  - create, findByToken, markAsUsed
  - cleanupExpired()
- [x] **LoginAudit** (support)
- [x] **Elu**
  - list avec filters, findById, findByEmail
  - create, update, delete, search, getStats
  - findByIdWithContacts
- [x] **EluContact** (support)
  - add, get, delete contacts
- [x] **EluSocialMedia** (support)
- [x] **Circonscription**
  - list avec filters, findById, findByCodePostal
  - findByRégion, create, update
  - addElu, removeElu, setElus, delete
  - search, getStats
- [x] **CodePostalCirconscription** (support)
- [x] **CirconscriptionHistory** (support)
- [x] **Petition**
  - list avec filters, findById
  - create, update, publish, close, delete
  - search, getTopSigned, getStats
- [x] **PetitionSignature**
  - sign, unsign, hasSigned
  - getSignatures, countSignatures
- [x] **PetitionUpdate**
  - add, getUpdates, delete
- [x] **PetitionComment**
  - add, getComments, delete (avec ownership check)
- [x] **EluCommitment** (NEW)
  - list avec filters, findById, findByElu
  - create, update, complete, abandon, delete
  - search, getStats
- [x] **CommitmentUpdate** (NEW)
  - add, getUpdates, delete
- [x] **CommitmentTracking** (NEW)
  - track, untrack, isTracking
  - getTracking, getTrackingCount

### API Routes

#### Authentication (`/api/v1/auth`)
- [x] POST `/request-login` — Demander magic link
- [x] GET `/verify?token=xyz` — Vérifier token
- [x] POST `/complete-profile` (Protected) — Compléter profil
- [x] GET `/me` (Protected) — Obtenir user courant
- [x] POST `/logout` (Protected) — Logout

#### Élus (`/api/v1/elus`) - Public
- [x] GET `/` — Lister avec filters (niveau, région, etc)
- [x] GET `/:id` — Détail d'un élu
- [x] GET `/niveau/:niveau` — Filter par niveau
- [x] GET `/région/:région` — Filter par région
- [x] GET `/titre/:titre` — Filter par titre
- [x] GET `/search?q=` — Recherche full-text
- [x] GET `/stats` — Statistiques

#### Circonscriptions (`/api/v1/circonscriptions`) - Public
- [x] GET `/` — Lister
- [x] GET `/:id` — Détail
- [x] GET `/by-code-postal/:code` — Par code postal
- [x] GET `/by-région/:région` — Par région
- [x] GET `/niveau/:niveau` — Par niveau
- [x] GET `/search?q=` — Recherche
- [x] GET `/stats` — Statistiques

#### Pétitions (`/api/v1/petitions`)
**Public:**
- [x] GET `/` — Lister (status=published par défaut)
- [x] GET `/:id` — Détail
- [x] GET `/:id/signatures` — Signataires
- [x] GET `/:id/updates` — Mises à jour
- [x] GET `/:id/comments` — Commentaires
- [x] GET `/top/signed` — Top 10 plus signées
- [x] GET `/search?q=` — Recherche
- [x] GET `/stats` — Statistiques

**Protected:**
- [x] POST `/` — Créer pétition
- [x] PUT `/:id` — Mettre à jour (draft seulement, owner)
- [x] POST `/:id/publish` — Publier (owner)
- [x] POST `/:id/sign` — Signer
- [x] DELETE `/:id/sign` — Retirer signature
- [x] POST `/:id/updates` — Ajouter mise à jour (owner)
- [x] DELETE `/:id/updates/:updateId` — Supprimer mise à jour (owner)
- [x] POST `/:id/comments` — Ajouter commentaire
- [x] DELETE `/:id/comments/:commentId` — Supprimer commentaire (owner)

#### Engagements Élus (`/api/v1/elu-commitments`)
**Public:**
- [x] GET `/` — Lister avec filters
- [x] GET `/:id` — Détail (avec updates et tracking)
- [x] GET `/elu/:eluId` — Engagements d'un élu
- [x] GET `/status/:status` — Filter par statut
- [x] GET `/search?q=` — Recherche
- [x] GET `/stats` — Statistiques

**Protected:**
- [x] POST `/:id/track` — Suivre engagement
- [x] DELETE `/:id/track` — Arrêter de suivre

---

## 🔄 État des Workflows

### Authentication Flow ✅
1. User envoie email → `POST /auth/request-login`
2. Backend envoie magic link par email
3. User clique lien → `GET /auth/verify?token=...`
4. Backend retourne JWT
5. User optionnellement complète profil → `POST /auth/complete-profile`
6. User peut accéder endpoints protégés avec JWT

### Pétition Workflow ✅
1. User créateur : `POST /petitions` (draft)
2. Éventuellement : `PUT /petitions/:id` (éditer brouillon)
3. Créateur : `POST /petitions/:id/publish` (status → published)
4. Citizens : `POST /petitions/:id/sign` (signer)
5. Créateur : `POST /petitions/:id/updates` (ajouter mises à jour)
6. Citizens : `POST /petitions/:id/comments` (commenter)
7. Admin/Système : `POST /petitions/:id/close` (archiver)

### Engagement Workflow ✅
1. Élus (admin) crée engagements (hors API pour maintenant)
2. Citizens : `GET /elu-commitments/:id` (voir détails)
3. Citizens : `POST /elu-commitments/:id/track` (suivre)
4. Système : commit_updates pour progression
5. Élus : `PUT /commitments/:id` pour changer status

---

## 📊 Données Structurées

### Users
```
- Création anonyme (via magic link)
- Email = identifiant unique
- Profile complet optionnel (nom, province, code postal)
- verification_at track l'authentification
- supports federation/OAuth future
```

### Élus
```
- Titre: Député, Sénateur, Maire, Conseiller
- Niveau: Fédéral, Provincial, Municipal
- Région: String (QC, ON, etc)
- Contacts & Social media dans tables associées
```

### Circonscriptions
```
- Géolocation: PostGIS geometry
- Code postal lookup pour geolocation inverse
- Élus: ARRAY integer pour flexible membership
- History audit trail pour changements
```

### Pétitions
```
- Status: draft → published → closed/won
- Signatures: count dénormalisé avec trigger
- Deadline optionnel pour urgence
- Full-text search en français
```

### Engagements Élus
```
- Status: engagée → en cours → complétée/abandonnée
- Deadline optionnel
- completed_at track achèvement réel
- Citizens peuvent tracker engagement
```

---

## 🧪 Testing

### Guides Disponibles
- [x] ENDPOINTS_TESTING_GUIDE.md — Commands curl complets
- [x] DATABASE_SETUP.md — Initialisation base données
- [x] .env.example — Configuration template

### À Tester Manuellement
- [ ] Chercher flow magic link (email delivery)
- [ ] Chercher token expiration (24h)
- [ ] JWT token expiration (7j)
- [ ] Database constraints (invalid status, etc)
- [ ] Full-text search en français
- [ ] CORS headers validation

---

## 🚀 Prêt pour la Production?

### ✅ Prêt
- Authentication sécurisée (magic link + JWT)
- Database avec indexes et constraints
- Ownership checks sur ressources
- Error handling basique
- CORS configuré
- Helmet pour security headers

### ⏳ À Faire
- [ ] API tests automatisés
- [ ] Rate limiting par IP/user
- [ ] Request logging avec Winston
- [ ] Error tracking (Sentry)
- [ ] Cache Redis pour perf
- [ ] Database connection pooling tuning
- [ ] Monitoring & alerting
- [ ] Backup strategy
- [ ] SSL/TLS certificates

### ❌ Out of Scope (Future)
- Websocket real-time updates
- Advanced analytics
- Payment integration
- Mobile apps
- Multi-language i18n

---

## 📁 Structure des Fichiers

```
backend/
├── src/
│   ├── server.js                    # Entry point
│   ├── config/
│   │   └── env.js                  # Environment config
│   ├── db/
│   │   └── pool.js                 # PostgreSQL pool
│   ├── database.js                 # Connection export
│   ├── services/
│   │   ├── AuthService.js          # JWT, tokens
│   │   └── EmailService.js         # SMTP + templates
│   ├── models/
│   │   ├── User.js
│   │   ├── Elu.js
│   │   ├── Circonscription.js
│   │   ├── Petition.js
│   │   └── EluCommitment.js
│   ├── routes/
│   │   ├── index.js                # Main router
│   │   ├── auth.js
│   │   ├── elus.js
│   │   ├── circonscriptions.js
│   │   ├── petitions.js
│   │   └── elu-commitments.js
│   ├── middlewares/
│   │   └── auth.js                 # JWT verification
│   └── migrations/
│       ├── 001_create_users.sql
│       ├── 002_create_elus.sql
│       ├── 003_create_circonscriptions.sql
│       ├── 004_create_petitions.sql
│       └── 005_create_elu_commitments.sql
├── package.json
├── .env.example
├── .env                            # (git ignored)
└── ENDPOINTS_TESTING_GUIDE.md
```

---

## 🔗 Commandes Utiles

```bash
# Développement
npm run dev

# Vérifier la base de données
psql citoyenavise_dev -c "SELECT version();"

# Appliquer migrations
psql citoyenavise_dev < backend/src/migrations/001_create_users.sql

# Réinitialiser (dev only)
dropdb citoyenavise_dev && createdb citoyenavise_dev

# Health check
curl http://localhost:5000/health

# Logs (si nodemon)
npm run dev 2>&1 | tee backend.log
```

---

## 📈 Next Steps (Priorités)

### Court Terme (Week 1)
1. [ ] Tester auth flow complet (magic link + JWT)
2. [ ] Valider database migrations
3. [ ] Implement pagination sur endpoints list
4. [ ] Seed database avec données test

### Moyen Terme (Week 2-3)
1. [ ] Frontend React avec magic link flow
2. [ ] Integrate real SMTP (Gmail ou SendGrid)
3. [ ] Implement rate limiting
4. [ ] Add request logging

### Long Terme (Week 4+)
1. [ ] Admin dashboard
2. [ ] SMTP templates HTML
3. [ ] API tests coverage > 80%
4. [ ] Production deployment

---

## 📚 Resources

- Express.js: https://expressjs.com
- PostgreSQL: https://www.postgresql.org
- JWT: https://jwt.io
- PostGIS: https://postgis.net
- Nodemailer: https://nodemailer.com

---

**Status**: 🟢 Core API implementation complete  
**Last Updated**: 2026-05-09  
**Maintainer**: Citoyen Avisé Team
