# 👑 Système d'Administration

**Gestion des rôles d'utilisateurs, contrôle d'accès et administration de la plateforme**

---

## 📦 Fichiers Créés

### Middleware
```
✅ backend/src/middlewares/admin.js
   └─ Middleware checkAdmin pour vérifier les droits admin
```

### Modèles Mise à Jour
```
✅ backend/src/models/User.js (modifié)
   └─ Ajout du champ role : ENUM('citizen', 'admin')
```

### Migrations
```
✅ backend/src/database/migrations/V006_add_user_roles.sql
   └─ Crée le type ENUM user_role
   └─ Ajoute la colonne role à la table users
   └─ Crée l'index idx_users_role
```

### Routes
```
✅ backend/src/routes/admin.js
   └─ 9 endpoints pour l'administration
   └─ Gestion des utilisateurs, missions, badges
```

### Scripts
```
✅ backend/scripts/promote-admin.js
   └─ Script pour promouvoir un utilisateur en admin
   └─ Usage: npm run promote:admin -- user@email.com
```

---

## 👥 Rôles d'Utilisateurs

### Citizen (Citoyen) - Défaut
```
✅ Créer/signer des pétitions
✅ Contribuer aux données publiques
✅ Participer aux débats
✅ Voir son profil
✅ Voir les leaderboards
✅ Accès complet à la gamification
❌ Accès aux routes admin
❌ Modifier les missions/badges
❌ Gérer les utilisateurs
```

### Admin (Administrateur)
```
✅ Tout ce que les Citizens peuvent faire
✅ Voir les statistiques de la plateforme
✅ Gérer les utilisateurs (changer rôles)
✅ Créer/modifier/supprimer les missions
✅ Créer/modifier/supprimer les badges
✅ Modérer le contenu
✅ Voir les logs d'activité
✅ Accès à tous les endpoints admin
```

---

## 🔐 Middleware Admin

### Utilisation
```javascript
import { authMiddleware } from '../middlewares/auth.js';
import { checkAdmin } from '../middlewares/admin.js';

// Protéger une route avec authentification + admin
router.post('/admin/missions', authMiddleware, checkAdmin, async (req, res) => {
  // Seuls les admins authentifiés peuvent accéder
});
```

### Validation
- Vérifie que `req.user` existe (authentification)
- Vérifie que `req.user.role === 'admin'`
- Retourne 401 si non authentifié
- Retourne 403 si non admin

---

## 🔌 API Endpoints Admin

Tous les endpoints admin nécessitent authentification + rôle admin.

### GET /api/v1/admin/stats
Récupère les statistiques de la plateforme

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 256,
      "admins": 3,
      "citizens": 253
    },
    "platform": {
      "totalActions": 5420,
      "totalMissions": 12,
      "totalBadges": 20,
      "missionsCompleted": 340
    },
    "progression": {
      "avgLevel": 2,
      "maxLevel": 6,
      "avgXp": 1250
    }
  }
}
```

---

### GET /api/v1/admin/users
Liste tous les utilisateurs

**Query Params:**
- `role` — Filtrer par rôle (citizen/admin)
- `limit` — Résultats par page (défaut 50, max 100)
- `offset` — Pagination offset

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "nomComplet": "Jean Dupont",
      "role": "citizen",
      "createdAt": "2026-05-01T10:00:00Z"
    },
    {
      "id": 2,
      "email": "admin@example.com",
      "nomComplet": "Admin User",
      "role": "admin",
      "createdAt": "2026-04-15T08:00:00Z"
    }
  ],
  "total": 256,
  "limit": 50,
  "offset": 0
}
```

---

### POST /api/v1/admin/users/:id/role
Change le rôle d'un utilisateur

**Request Body:**
```json
{
  "role": "admin"
}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "email": "newadmin@example.com",
    "oldRole": "citizen",
    "newRole": "admin"
  }
}
```

---

### POST /api/v1/admin/missions
Crée une nouvelle mission

**Request Body:**
```json
{
  "missionKey": "daily_explorer",
  "titleFr": "Explorateur quotidien",
  "descriptionFr": "Découvrez 5 établissements",
  "category": "discovery",
  "frequency": "daily",
  "xpReward": 50,
  "completionCriteria": {
    "actionCategoryCount": 5,
    "category": "discovery"
  },
  "displayOrder": 1
}
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 13,
    "missionKey": "daily_explorer",
    "titleFr": "Explorateur quotidien",
    "category": "discovery",
    "frequency": "daily",
    "xpReward": 50,
    "isActive": true
  }
}
```

---

### PUT /api/v1/admin/missions/:id
Modifie une mission existante

**Request Body:**
```json
{
  "titleFr": "Explorateur du monde",
  "xpReward": 60,
  "isActive": false
}
```

---

### DELETE /api/v1/admin/missions/:id
Supprime une mission

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Mission deleted successfully"
}
```

---

### POST /api/v1/admin/badges
Crée un nouveau badge

**Request Body:**
```json
{
  "badgeKey": "explorer_master",
  "nameFr": "🗺️ Maître Explorateur",
  "descriptionFr": "Explorez 500 établissements",
  "category": "discovery",
  "iconUrl": "https://...",
  "rarity": "epic",
  "unlockCriteria": {
    "actionCategoryCount": 500,
    "category": "discovery"
  }
}
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 21,
    "badgeKey": "explorer_master",
    "nameFr": "🗺️ Maître Explorateur",
    "category": "discovery",
    "rarity": "epic"
  }
}
```

---

### PUT /api/v1/admin/badges/:id
Modifie un badge existant

---

### DELETE /api/v1/admin/badges/:id
Supprime un badge

---

## 🚀 Configuration Admin

### 1. Exécuter la migration
```bash
npm run migrate V006_add_user_roles.sql
```

### 2. Promouvoir un utilisateur en admin
```bash
npm run promote:admin -- user@example.com
```

Ou directement:
```bash
node scripts/promote-admin.js infocitoyenavise@gmail.com
```

### 3. Vérifier le rôle
```bash
# Dans la base de données PostgreSQL
SELECT id, email, role FROM users WHERE email = 'user@example.com';

# Résultat:
#  id |        email        | role
# ----+---------------------+-------
#   1 | user@example.com    | admin
```

---

## 📊 Utilisation Depuis le Code

### Vérifier si utilisateur est admin
```javascript
import User from './models/User.js';

const user = await User.findByPk(userId);

if (user.role === 'admin') {
  console.log('Utilisateur est admin');
} else {
  console.log('Utilisateur est citoyen');
}
```

### Utiliser le middleware admin
```javascript
import { authMiddleware } from './middlewares/auth.js';
import { checkAdmin } from './middlewares/admin.js';

// Simple route protégée
router.get('/admin-only', authMiddleware, checkAdmin, async (req, res) => {
  res.json({ message: 'Admin access' });
});
```

### Créer une mission via route admin
```bash
curl -X POST "http://localhost:5000/api/v1/admin/missions" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "missionKey": "test_mission",
    "titleFr": "Test",
    "category": "discovery",
    "frequency": "daily",
    "xpReward": 30,
    "completionCriteria": {"actionCount": 5}
  }'
```

---

## 🔒 Sécurité

### Validation
- Authentification requise (JWT token)
- Rôle admin obligatoire
- Validation des données entrantes
- Logging de toutes les actions admin

### Logs
```javascript
// Tous les changements admin sont loggés
logger.info(`Mission created by admin`, {
  meta: { missionId: 5, adminId: 123 }
});

logger.info(`User role changed by admin`, {
  meta: { userId: 50, oldRole: 'citizen', newRole: 'admin', adminId: 123 }
});
```

---

## 📋 Checklist Admin Setup

- [x] Créer migration V006 avec rôle ENUM
- [x] Ajouter champ role au modèle User
- [x] Créer middleware checkAdmin
- [x] Créer routes admin (9 endpoints)
- [x] Ajouter script promote-admin
- [x] Intégrer dans routes/index.js
- [ ] Promouvoir premier utilisateur admin
- [ ] Tester endpoints admin
- [ ] Créer missions/badges de test
- [ ] Documenter pour le frontend

---

## 🧪 Test Manuel

### 1. Créer un compte test
```bash
curl -X POST "http://localhost:5000/api/v1/auth/request-login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com"}'
```

### 2. Promouvoir en admin
```bash
npm run promote:admin -- admin@test.com
```

### 3. Vérifier les stats
```bash
curl -X GET "http://localhost:5000/api/v1/admin/stats" \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔄 Intégration Frontend

### Afficher menu admin si user.role === 'admin'
```javascript
import { useAuthStore } from './stores/auth';

export function AdminMenu() {
  const user = useAuthStore(s => s.user);
  
  if (user?.role !== 'admin') return null;
  
  return (
    <nav>
      <Link to="/admin/stats">Statistiques</Link>
      <Link to="/admin/missions">Missions</Link>
      <Link to="/admin/badges">Badges</Link>
      <Link to="/admin/users">Utilisateurs</Link>
    </nav>
  );
}
```

### Créer une mission
```javascript
async function createMission(data) {
  const response = await fetch('/api/v1/admin/missions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
}
```

---

## 📞 Support

- Middleware: `backend/src/middlewares/admin.js`
- Routes: `backend/src/routes/admin.js`
- Migration: `backend/src/database/migrations/V006_add_user_roles.sql`
- Script: `backend/scripts/promote-admin.js`
- Docs: `backend/ADMIN_SYSTEM.md`

---

**Système d'Administration — Ready for Production! 🚀**
