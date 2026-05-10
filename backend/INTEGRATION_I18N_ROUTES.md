# 🔌 Intégration i18n dans les Routes

**Exemples d'intégration du service i18n dans les endpoints API**

---

## 🚀 Setup initial

### 1. Ajouter le middleware dans server.js

```javascript
import { i18nMiddleware } from './middlewares/i18n.js';

// Après les autres middlewares
app.use(i18nMiddleware);
```

### 2. Importer le service dans les routes

```javascript
import { translate } from '../services/i18n.js';
```

---

## 📝 Exemples d'intégration

### Exemple 1: POST /api/v1/petitions/:id/sign

```javascript
import express from 'express';
import { translate } from '../services/i18n.js';
import { authMiddleware } from '../middlewares/auth.js';
import { Petition, Signature } from '../models/index.js';

const router = express.Router();

router.post('/:id/sign', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la pétition existe
    const petition = await Petition.findByPk(id);
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: translate('error.notFound', req.lang)
      });
    }

    // Vérifier si l'utilisateur a déjà signé
    const existingSignature = await Signature.findOne({
      where: { petitionId: id, citoyenId: userId }
    });

    if (existingSignature) {
      return res.status(409).json({
        success: false,
        error: translate('petition.alreadySigned', req.lang),
        code: 'ALREADY_SIGNED'
      });
    }

    // Créer la signature
    const signature = await Signature.create({
      petitionId: id,
      citoyenId: userId
    });

    // Log l'action
    logger.info(`User ${userId} signed petition ${id}`, {
      meta: { userId, petitionId: id }
    });

    return res.status(201).json({
      success: true,
      message: translate('petition.signed', req.lang),
      data: { signatureId: signature.id }
    });
  } catch (error) {
    logger.error('Error signing petition', { meta: { error: error.message } });
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.lang)
    });
  }
});

export default router;
```

---

### Exemple 2: POST /api/v1/petitions

```javascript
import express from 'express';
import { translate } from '../services/i18n.js';
import { authMiddleware } from '../middlewares/auth.js';
import { Petition, Elu } from '../models/index.js';
import { z } from 'zod';

const router = express.Router();

const petitionSchema = z.object({
  titre: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  eluId: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional()
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    // Validation
    const validation = petitionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: translate('error.validation', req.lang),
        details: validation.error.errors
      });
    }

    const { titre, description, eluId, deadline } = validation.data;

    // Créer la pétition
    const petition = await Petition.create({
      titre,
      description,
      eluId,
      deadline,
      citoyenId: req.user.id,
      status: 'draft'
    });

    logger.info(`Petition created by user ${req.user.id}`, {
      meta: { petitionId: petition.id, userId: req.user.id }
    });

    return res.status(201).json({
      success: true,
      message: translate('petition.created', req.lang),
      data: petition
    });
  } catch (error) {
    logger.error('Error creating petition', { meta: { error: error.message } });
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.lang)
    });
  }
});

export default router;
```

---

### Exemple 3: POST /api/v1/petitions/:id/publish

```javascript
import express from 'express';
import { translate } from '../services/i18n.js';
import { authMiddleware } from '../middlewares/auth.js';
import { Petition } from '../models/index.js';

const router = express.Router();

router.post('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Trouver la pétition
    const petition = await Petition.findByPk(id);
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: translate('error.notFound', req.lang)
      });
    }

    // Vérifier la propriété
    if (petition.citoyenId !== userId) {
      return res.status(403).json({
        success: false,
        error: translate('error.forbidden', req.lang)
      });
    }

    // Publier
    petition.status = 'published';
    await petition.save();

    logger.info(`Petition ${id} published by user ${userId}`, {
      meta: { petitionId: id, userId }
    });

    return res.json({
      success: true,
      message: translate('petition.published', req.lang),
      data: petition
    });
  } catch (error) {
    logger.error('Error publishing petition', { meta: { error: error.message } });
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.lang)
    });
  }
});

export default router;
```

---

### Exemple 4: POST /api/v1/auth/request-login

```javascript
import express from 'express';
import { translate } from '../services/i18n.js';
import { EmailService } from '../services/EmailService.js';
import { User } from '../models/index.js';

const router = express.Router();

router.post('/request-login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: translate('error.validation', req.lang)
      });
    }

    // Trouver ou créer l'utilisateur
    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({ email });
    }

    // Générer et envoyer le lien magique
    const magicLink = generateMagicLink(user.id);
    await EmailService.sendMagicLink(email, magicLink);

    logger.info(`Magic link requested for ${email}`, {
      meta: { email, userId: user.id }
    });

    return res.json({
      success: true,
      message: translate('auth.loginRequested', req.lang, { email })
    });
  } catch (error) {
    logger.error('Error requesting login', { meta: { error: error.message } });
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.lang)
    });
  }
});

export default router;
```

---

### Exemple 5: POST /api/v1/admin/users/:id/role (Admin only)

```javascript
import express from 'express';
import { translate } from '../services/i18n.js';
import { authMiddleware } from '../middlewares/auth.js';
import { checkAdmin } from '../middlewares/admin.js';
import { User } from '../models/index.js';

const router = express.Router();

router.post('/:id/role', authMiddleware, checkAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Valider le rôle
    if (!['citizen', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: translate('error.validation', req.lang)
      });
    }

    // Trouver l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: translate('error.notFound', req.lang)
      });
    }

    // Mettre à jour le rôle
    user.role = role;
    await user.save();

    logger.info(`User ${userId} role changed to ${role} by admin ${req.user.id}`, {
      meta: { targetUserId: userId, newRole: role, adminId: req.user.id }
    });

    return res.json({
      success: true,
      message: translate('admin.userRoleUpdated', req.lang),
      data: { userId: user.id, role: user.role }
    });
  } catch (error) {
    logger.error('Error updating user role', { meta: { error: error.message } });
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.lang)
    });
  }
});

export default router;
```

---

## 📊 Patterns courants

### Pattern 1: Erreur de validation

```javascript
if (!titre || titre.length === 0) {
  return res.status(400).json({
    success: false,
    error: translate('error.validation', req.lang),
    field: 'titre'
  });
}
```

### Pattern 2: Ressource non trouvée

```javascript
const resource = await Model.findByPk(id);
if (!resource) {
  return res.status(404).json({
    success: false,
    error: translate('error.notFound', req.lang)
  });
}
```

### Pattern 3: Conflit (duplicate)

```javascript
const existing = await Model.findOne({ where: { email } });
if (existing) {
  return res.status(409).json({
    success: false,
    error: translate('error.conflict', req.lang, { 
      message: 'Email already exists' 
    })
  });
}
```

### Pattern 4: Succès avec message

```javascript
const resource = await Model.create(data);
return res.status(201).json({
  success: true,
  message: translate('resource.created', req.lang),
  data: resource
});
```

### Pattern 5: Autorisation

```javascript
if (resource.userId !== req.user.id) {
  return res.status(403).json({
    success: false,
    error: translate('error.forbidden', req.lang)
  });
}
```

---

## ✅ Checklist d'intégration

- [ ] Middleware i18n ajouté à server.js
- [ ] Import de `translate` dans les routes
- [ ] Erreurs de validation traduites
- [ ] Erreurs 404 traduites
- [ ] Erreurs 403 traduites
- [ ] Messages de succès traduits
- [ ] Tests avec ?lang=en et ?lang=fr
- [ ] Logging des actions avec req.lang

---

**Routes i18n prêtes ! 🚀**
