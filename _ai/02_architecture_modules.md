---
name: Architecture et responsabilités des modules
description: Carte des modules MVP, dépendances, flux de données
type: project
---

# Architecture Modules — Citoyen Avisé

## 📦 Modules MVP (Vue d'ensemble)

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (HTML/JS)                 │
│  Pages + Composants + Gestion d'état (localStorage)     │
└──────────────────────────┬──────────────────────────────┘
                           │ (HTTP JSON)
┌──────────────────────────▼──────────────────────────────┐
│              Backend API (Express.js)                   │
│  Routes → Controllers → Services → Models → DB          │
└────────────────────────────────────────────────────────┘
                           │
                ┌──────────┼──────────┬──────────────┐
                ▼          ▼          ▼              ▼
           ┌────────┐ ┌────────┐ ┌──────┐ ┌────────────┐
           │  Auth  │ │Profiles│ │Posts │ │    Map     │
           │ Users  │ │ Likes  │ │Ideas │ │   Nodes    │
           └────────┘ └────────┘ └──────┘ └────────────┘
                │          │          │         │
                └──────────┼──────────┼─────────┘
                           ▼
                    PostgreSQL + GIS
```

## 🔐 Module 1 : Authentification & Utilisateurs

**Responsabilité** : Identité digitale, sessions, rôles

### Flux

```
[Visiteur] → [Inscription] → [Vérification email] → [Profil initial]
    ↓
[Login] → [JWT token] → [Accès protégé]
    ↓
[Edit profil] → [Paramètres] → [Logout]
```

### API Endpoints

```
POST   /api/v1/auth/register      → Créer utilisateur
POST   /api/v1/auth/login         → Obtenir JWT
POST   /api/v1/auth/refresh       → Renouveler token
GET    /api/v1/auth/me            → Utilisateur actuel (protégé)
POST   /api/v1/auth/logout        → Invalider token

GET    /api/v1/users/:id          → Infos utilisateur (public)
PUT    /api/v1/users/:id          → Éditer profil (protégé)
DELETE /api/v1/users/:id          → Supprimer compte (protégé)
```

### Tables DB
- `users` : email, password_hash, role, is_verified, created_at
- `profiles` : user_id, bio, avatar_url, location, interests, followers_count

### Dépendances
- aucune (base du système)

### Points critiques
- Hashage bcrypt obligatoire
- JWT validation sur chaque route protégée
- Rate limit sur register/login
- Email verification (v2)

---

## 👥 Module 2 : Profils Citoyens

**Responsabilité** : Réseau social minimal, suivis, localisation

### Flux

```
[Profil créé] → [Bio + Localisation] → [Visible publiquement]
    ↓
[Autres citoyens voient le profil] → [Follow] → [Notifications (future)]
```

### API Endpoints

```
GET    /api/v1/profiles              → Liste (paginated, filtrable)
POST   /api/v1/profiles              → Créer profil (protégé)
GET    /api/v1/profiles/:id          → Détail public
PUT    /api/v1/profiles/:id          → Éditer (protégé + owner)
GET    /api/v1/profiles/:id/posts    → Posts d'un citoyen
GET    /api/v1/profiles/:id/followers → Followers
POST   /api/v1/profiles/:id/follow   → Suivre (protégé)
DELETE /api/v1/profiles/:id/follow   → Unfollow (protégé)
```

### Données clés
- **bio** : Texte libre, max 500 chars
- **avatar_url** : URL externe (Gravatar, custom)
- **location** : "Montréal, QC" ou coords (latitude, longitude)
- **interests** : Array ['élections', 'environnement', 'éducation']
- **is_verified** : Badge civique (future : partenaires)

### Tables DB
- `profiles` : Voir Module 1
- `follows` : follower_id, following_id (relation N-N)
- `map_nodes` : Optionnel, liens profil → localisation

### Dépendances
- Module 1 (Auth & Users) : chaque profil = 1 user

### Points critiques
- Chaque user a exactement 1 profil
- Follows ne peuvent pas être transitivites (1-to-1)
- Localisation optionnelle

---

## 📝 Module 3 : Posts & Idées

**Responsabilité** : Contenu citoyen, discussions, modération

### Flux

```
[Citoyen login] → [Créer post] → [Type: idea/question/discussion]
        ↓
[Validation] → [Published] → [Visible dans feed]
        ↓
[Autres citoyens] → [Voir + Like + Flag si abusif]
        ↓
[Modérateur] → [Supprimer post abusif / Marquer "flagged"]
```

### API Endpoints

```
GET    /api/v1/posts                 → Feed (filtrable, pagé)
POST   /api/v1/posts                 → Créer (protégé)
GET    /api/v1/posts/:id             → Détail
PUT    /api/v1/posts/:id             → Éditer (owner)
DELETE /api/v1/posts/:id             → Soft delete
POST   /api/v1/posts/:id/flag        → Signaler abusif
GET    /api/v1/posts/category/:cat   → Par catégorie

# Filtres supportés
?category=élections&sort=latest&limit=20&page=1
?status=published&user_id=uuid
```

### Types de posts
- **idea** : Proposition civique ("Créer un observatoire citoyen")
- **proposal** : Projet concret avec étapes
- **question** : Demande d'info ("Comment s'inscrire sur liste électorale ?")
- **discussion** : Débat ouvert ("Quel est le rôle d'un conseiller municipal ?")

### Catégories (examples)
- élections, gouvernement, droits, services, santé, éducation, environnement, économie, etc.

### Tables DB
- `posts` : user_id, title, content, type, category, status (published/flagged/archived), likes_count, views_count
- `likes` : user_id, post_id (relation N-N)

### Dépendances
- Module 1 (Auth) : chaque post = 1 user
- Module 2 (Profiles) : afficher nom/avatar du créateur

### Points critiques
- Modération active (flag, soft delete)
- Pas d'édition après 1h (audit trail future)
- Compteurs dénormalisés (likes_count) pour perf

---

## 🗺️ Module 4 : Carte Interactive

**Responsabilité** : Visualisation géospatiale, filtrage régional

### Flux

```
[Carte charge] → [Requête /map/nodes avec bbox] → [GeoJSON retourné]
        ↓
[Leaflet affiche nœuds] → [Clustering si dense] → [Click → profil]
        ↓
[Filtres région/province] → [Requête filtrée] → [Mise à jour carte]
```

### API Endpoints

```
GET    /api/v1/map/nodes              → GeoJSON (bbox required)
GET    /api/v1/map/nodes?bounds=...   → Dans zone (bounds=west,south,east,north)
GET    /api/v1/map/nodes?region=QC    → Par province
POST   /api/v1/map/nodes              → Créer nœud (admin)
PUT    /api/v1/map/nodes/:id          → Éditer (admin)
DELETE /api/v1/map/nodes/:id          → Supprimer (admin)
```

### Données sur la carte
- **Citoyens** : Profils avec location (optionnel)
- **Organizations** : Future (gouvernements, ONGs)
- **Events** : Future (assemblées, débats)

### Format GeoJSON (exemple)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.5673, 45.5017]
      },
      "properties": {
        "id": "uuid",
        "name": "Marie Dubois",
        "type": "citizen",
        "interests": ["élections", "environnement"],
        "profile_url": "/profiles/uuid"
      }
    }
  ]
}
```

### Tables DB
- `map_nodes` : profile_id, node_type, latitude, longitude, province, municipality, SPATIAL INDEX

### Dépendances
- Module 2 (Profiles) : localisation des profils
- PostGIS : Requêtes spatiales

### Points critiques
- Requêtes spatiales optimisées (SPATIAL INDEX)
- Clustering côté JS (pas sur serveur pour perf)
- Pas d'affichage exact des coordonnées si vie privée

---

## ❤️ Module 5 : Likes & Interactions

**Responsabilité** : Engagement simple, compteurs

### Flux

```
[Utilisateur] → [Voit post] → [Clique Like] → [Compteur +1]
        ↓
[Créateur post] → [Voit compteur] → [Notification (future)]
```

### API Endpoints

```
POST   /api/v1/posts/:id/like        → Like (protégé, idempotent)
DELETE /api/v1/posts/:id/like        → Unlike
POST   /api/v1/profiles/:id/follow   → Voir Module 2
```

### Tables DB
- `likes` : user_id, post_id (UNIQUE constraint : 1 like/user/post)

### Dépendances
- Module 1 (Auth) : qui like
- Module 3 (Posts) : quoi liker

### Points critiques
- Idempotence : POST /like 2x = 1 like (pas 2)
- Compteurs dénormalisés pour perf (UPDATE posts SET likes_count = likes_count + 1)

---

## 📄 Module 6 : Contenu Civique (CMS Statique → Dynamique)

**Responsabilité** : Pages informations civiques, bilinguisme

### Contenu à migrer
- Gouvernement (fédéral, provincial, municipal)
- Droits & Libertés
- Services publics
- Élections

### API Endpoints

```
GET    /api/v1/content/pages         → Liste pages
GET    /api/v1/content/pages/:slug   → Page "gouvernement", "droits", etc.
PUT    /api/v1/content/pages/:slug   → Éditer (admin)
```

### Format DB

```
id, slug, title_fr, title_en, content_fr, content_en, 
meta_description_fr, meta_description_en, 
is_published, order_index, created_by, created_at, updated_at
```

### Dépendances
- Aucune (contenu pur)

### Points critiques
- Bilinguisme obligatoire (title_fr + title_en)
- HTML sanitizé (DOMPurify ou similar)
- SEO préservé (meta tags)

---

## 🔄 Dépendances globales

```
Auth (Module 1)
    ├─ Profiles (Module 2)
    │   ├─ Map Nodes (Module 4)
    │   └─ Posts (Module 3)
    │       └─ Likes (Module 5)
    └─ Admins
        └─ Modération (tous modules)

Content (Module 6) : Indépendant
```

## 📊 Flux de données simplifié

```
1. User s'inscrit → Créé dans DB
2. User crée profil → Localisé sur carte
3. User crée post → Visible dans feed
4. User like post → Compteur +1
5. Modérateur flag post → Status "flagged"
6. Autres users suivent, voient feed, carte
```
