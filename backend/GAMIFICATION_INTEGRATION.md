# 🎮 Guide d'Intégration Gamification

Ce guide explique comment intégrer le système de gamification dans les routes API existantes de Citoyen Avisé.

---

## 🚀 Mise en Place Initiale

### 1. Exécuter la migration
```bash
npm run migrate V005_gamification_schema.sql
```

### 2. Créer les missions et badges par défaut
```bash
npm run seed:gamification
```

### 3. Vérifier l'intégration dans routes/index.js
```javascript
// ✅ Déjà fait - les routes de gamification sont enregistrées
import gamificationRoutes from './gamification.js';
router.use('/api/v1/gamification', gamificationRoutes);
```

---

## 📝 Points d'Intégration Clés

### 1. Routes de Pétitions
**Fichier:** `backend/src/routes/petitions.js`

#### Après signature d'une pétition (POST /petitions/:id/sign)
```javascript
import { ActionLoggerService } from '../services/ActionLoggerService.js';
import { BadgeService } from '../services/BadgeService.js';

router.post('/:id/sign', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ... code existant pour créer la signature ...
    const signature = await Signature.create({
      petitionId: id,
      citoyenId: userId,
    });

    // 🎮 LOG ACTION - +10 XP pour "sign_petition"
    await ActionLoggerService.logAction(
      userId,
      'sign_petition',
      'civic',
      { petitionId: id }
    );

    // 🎮 CHECK BADGES - Vérifier si des badges sont déverrouillés
    const newBadges = await BadgeService.checkAndUnlockBadges(userId);

    // 🎮 NOTIFY USER - Retourner les nouveaux badges s'il y en a
    res.status(201).json({
      success: true,
      data: signature,
      achievements: {
        xpGained: 10,
        newBadges: newBadges.map(b => ({
          id: b.id,
          name: b.nameFr,
          icon: b.iconUrl,
        })),
      },
    });
  } catch (err) {
    // ... gestion d'erreur ...
  }
});
```

#### Après création d'une pétition (POST /petitions)
```javascript
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // ... code existant ...
    
    const petition = await Petition.create({
      titre: req.body.titre,
      description: req.body.description,
      citoyenId: userId,
    });

    // 🎮 LOG ACTION - +25 XP pour "create_petition"
    await ActionLoggerService.logAction(
      userId,
      'create_petition',
      'civic',
      { petitionId: petition.id }
    );

    res.status(201).json({
      success: true,
      data: petition,
    });
  } catch (err) {
    // ...
  }
});
```

---

### 2. Routes des Élus
**Fichier:** `backend/src/routes/elus.js`

#### Quand un utilisateur consulte un élu (GET /elus/:id)
```javascript
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optionnel si authentifié

    const elu = await Elu.findByPk(id);

    if (!elu) {
      return res.status(404).json({ success: false, error: 'Elu not found' });
    }

    // 🎮 LOG ACTION (si utilisateur authentifié) - +15 XP
    if (userId) {
      await ActionLoggerService.logAction(
        userId,
        'view_elu',
        'discovery',
        { eluId: id }
      );
    }

    res.json({ success: true, data: elu });
  } catch (err) {
    // ...
  }
});
```

#### Quand un utilisateur consulte une liste d'élus (GET /elus)
```javascript
router.get('/', async (req, res) => {
  try {
    const { niveau, region, limit = 20, offset = 0 } = req.query;
    const userId = req.user?.id;

    // ... code existant ...
    const elus = await Elu.findAll({ /* ... */ });

    // 🎮 LOG ACTION - +5 XP pour "explore_map" ou équivalent
    if (userId) {
      await ActionLoggerService.logAction(
        userId,
        'explore_map',
        'discovery',
        { listType: 'elus', count: elus.length }
      );
    }

    res.json({
      success: true,
      data: elus,
      total: count,
    });
  } catch (err) {
    // ...
  }
});
```

---

### 3. Routes de Commentaires
**Fichier:** `backend/src/routes/comments.js`

#### Après création d'un commentaire (POST /petitions/:id/comments)
```javascript
router.post('/petitions/:id/comments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { contenu } = req.body;

    const comment = await Comment.create({
      contenu,
      citoyenId: userId,
      petitionId: id,
    });

    // 🎮 LOG ACTION - +5 XP pour "comment"
    await ActionLoggerService.logAction(
      userId,
      'comment',
      'social',
      { commentId: comment.id, petitionId: id }
    );

    // 🎮 CHECK BADGES
    const newBadges = await BadgeService.checkAndUnlockBadges(userId);

    res.status(201).json({
      success: true,
      data: comment,
      achievements: {
        xpGained: 5,
        newBadges,
      },
    });
  } catch (err) {
    // ...
  }
});
```

---

### 4. Routes de Promesses
**Fichier:** `backend/src/routes/promises.js`

#### Quand un utilisateur suit une promesse (hypothétique POST /promises/:id/track)
```javascript
router.post('/:id/track', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // ... code pour créer le suivi ...

    // 🎮 LOG ACTION - +12 XP pour "track_promise"
    await ActionLoggerService.logAction(
      userId,
      'track_promise',
      'civic',
      { promiseId: id }
    );

    res.json({ success: true, data: { tracked: true } });
  } catch (err) {
    // ...
  }
});
```

---

### 5. Routes de Données Publiques (Public Data)
**Fichier:** `backend/src/routes/public-data.js` (à créer ou modifier)

#### Quand un utilisateur contribue à une fiche (POST /public-data/:id/contribute)
```javascript
router.post('/:id/contribute', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { description, photos } = req.body;

    // ... code pour ajouter la contribution ...

    // 🎮 LOG ACTION - +20 XP pour "contribute_fiche"
    await ActionLoggerService.logAction(
      userId,
      'contribute_fiche',
      'public_data',
      { ficheId: id }
    );

    // Si photos ajoutées - +10 XP chaque
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        await ActionLoggerService.logAction(
          userId,
          'add_photo',
          'public_data',
          { ficheId: id, photoIndex: i }
        );
      }
    }

    // 🎮 CHECK BADGES
    const newBadges = await BadgeService.checkAndUnlockBadges(userId);

    res.json({
      success: true,
      achievements: {
        xpGained: 20 + (photos?.length || 0) * 10,
        newBadges,
      },
    });
  } catch (err) {
    // ...
  }
});
```

---

### 6. Authentication (Premier login)
**Fichier:** `backend/src/routes/auth.js`

#### Après premier login réussi (POST /auth/complete-profile)
```javascript
router.post('/complete-profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // ... code existant ...

    const user = await User.update(
      { nom: req.body.nom, /* ... */ },
      { where: { id: userId } }
    );

    // 🎮 LOG ACTION - +30 XP pour "complete_profile"
    await ActionLoggerService.logAction(
      userId,
      'complete_profile',
      'system',
      { completed: true }
    );

    // 🎮 LOG ACTION - +50 XP pour premier login
    await ActionLoggerService.logAction(
      userId,
      'first_login',
      'system',
      { firstTime: true }
    );

    // 🎮 CHECK BADGES
    const newBadges = await BadgeService.checkAndUnlockBadges(userId);

    res.json({
      success: true,
      data: user,
      achievements: {
        xpGained: 80,
        newBadges,
      },
    });
  } catch (err) {
    // ...
  }
});
```

---

## 📊 Middleware pour Suivi d'Activité

Créer un middleware pour tracker le temps passé sur chaque page:

**Fichier:** `backend/src/middlewares/activityTracking.js`
```javascript
import { ActionLoggerService } from '../services/ActionLoggerService.js';

export const activityTrackingMiddleware = (req, res, next) => {
  const userId = req.user?.id;

  // Tracker le début de la requête
  const startTime = Date.now();

  // Tracker après la réponse
  res.on('finish', async () => {
    if (userId) {
      const duration = Date.now() - startTime;
      
      try {
        await ActionLoggerService.trackActivityMetrics(userId, {
          actionsCount: 1, // Chaque requête = 1 action
          timeSpentSeconds: Math.round(duration / 1000),
          pagesVisited: 1,
        });
      } catch (err) {
        console.error('Error tracking activity:', err);
      }
    }
  });

  next();
};
```

Ajouter dans `server.js`:
```javascript
import { activityTrackingMiddleware } from './middlewares/activityTracking.js';

app.use(activityTrackingMiddleware);
```

---

## 🔄 Intégration des Missions

### Vérifier automatiquement la completion des missions

Après chaque action loggée:
```javascript
import { MissionEngineService } from '../services/MissionEngineService.js';

// Dans ActionLoggerService.logAction()
static async logAction(userId, actionKey, category, metadata = null) {
  // ... code existant ...

  // 🎮 Vérifier et compléter les missions
  const missions = await MissionEngineService.getActiveMissions(userId);
  const completedMissions = [];

  for (const mission of missions) {
    if (mission.userProgress?.status === 'active') {
      const isComplete = await MissionEngineService.checkMissionCompletion(
        userId,
        mission.id
      );

      if (isComplete) {
        const completed = await MissionEngineService.completeMission(
          mission.userProgress.id
        );
        completedMissions.push(completed);

        // 🎮 Vérifier les badges après mission complétée
        const newBadges = await BadgeService.checkAndUnlockBadges(userId);
      }
    }
  }

  return { action, completedMissions };
}
```

---

## 📱 Réponses API Enrichies

Modifier le format de réponse pour inclure les achievements:

```javascript
// Format standard enrichi
{
  "success": true,
  "data": { /* ... résultats ... */ },
  "achievements": {
    "xpGained": 25,
    "newLevel": false,
    "levelUpTo": null,
    "newBadges": [
      {
        "id": 5,
        "name": "Contributeur",
        "icon": "...",
        "rarity": "uncommon"
      }
    ],
    "missionsCompleted": [
      {
        "id": 3,
        "title": "Signer 3 pétitions",
        "xpReward": 75
      }
    ]
  }
}
```

---

## ✅ Checklist d'Intégration

### Phase 1 - Database & Models
- [x] Créer migration V005
- [x] Créer tous les modèles Sequelize
- [x] Mettre à jour models/index.js

### Phase 2 - Services
- [x] Créer ActionLoggerService
- [x] Créer MissionEngineService
- [x] Créer BadgeService
- [x] Créer routes de gamification

### Phase 3 - Intégrations Critiques (PRIORISER)
- [ ] Intégrer dans `/petitions` (sign_petition)
- [ ] Intégrer dans `/petitions` (create_petition)
- [ ] Intégrer dans `/comments` (comment)
- [ ] Intégrer dans `/elus` (view_elu)
- [ ] Intégrer dans `/auth` (first_login, complete_profile)

### Phase 4 - Intégrations Secondaires
- [ ] Intégrer dans `/promises` (track_promise)
- [ ] Intégrer dans `/public-data` (contribute_fiche, add_photo)
- [ ] Intégrer middleware activityTracking
- [ ] Ajouter vérification automatique des missions

### Phase 5 - Frontend
- [ ] Afficher progression utilisateur
- [ ] Afficher missions actives
- [ ] Afficher badges déverrouillés
- [ ] Afficher notifications achievements
- [ ] Créer leaderboard

### Phase 6 - Polish
- [ ] Tester tous les endpoints
- [ ] Vérifier les calculs XP
- [ ] Tester déblocage des badges
- [ ] Tester completion des missions
- [ ] Ajouter notifications temps réel

---

## 🧪 Test Manuel

### 1. Logger une action
```bash
curl -X GET "http://localhost:5000/api/v1/gamification/progression" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Vérifier la progression
```bash
# Avant action: level 1, xp: 0
# Signer une pétition (10 XP)
# Après: level 1, xp: 10

curl -X GET "http://localhost:5000/api/v1/gamification/progression" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Vérifier les missions
```bash
curl -X GET "http://localhost:5000/api/v1/gamification/missions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Vérifier les badges
```bash
curl -X GET "http://localhost:5000/api/v1/gamification/badges" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Référence Rapide

### Imports Nécessaires
```javascript
import { ActionLoggerService } from '../services/ActionLoggerService.js';
import { MissionEngineService } from '../services/MissionEngineService.js';
import { BadgeService } from '../services/BadgeService.js';
```

### Appels Courants
```javascript
// Logger une action
await ActionLoggerService.logAction(userId, actionKey, category, metadata);

// Vérifier les badges
const newBadges = await BadgeService.checkAndUnlockBadges(userId);

// Vérifier les missions
const missions = await MissionEngineService.getActiveMissions(userId);
```

---

**Guide d'Intégration — Prêt pour Implementation! 🚀**
