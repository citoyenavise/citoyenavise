# 🌍 Backend i18n - Messages multilingues

**Service i18n côté serveur pour messages d'erreur et succès**

---

## 📦 Service: src/services/i18n.js

### Fonctions disponibles

```javascript
import { translate, getTranslations, addTranslation } from '../services/i18n.js';

// 1. Traduire une clé
translate('petition.signed', 'fr')
// → "Merci de votre signature"

translate('petition.signed', 'en')
// → "Thank you for signing"

// 2. Avec interpolation
translate('error.conflict', 'fr', { message: 'Email déjà existant' })
// → "Conflit : Email déjà existant"

translate('auth.loginRequested', 'en', { email: 'user@example.com' })
// → "Sign in link sent to user@example.com"

// 3. Obtenir toutes les traductions
getTranslations('fr')
// → { 'petition.created': '...', 'petition.signed': '...', ... }

// 4. Ajouter une nouvelle traduction
addTranslation('custom.key', 'Texte français', 'English text')
```

---

## 🔌 Utilisation dans les routes

### Exemple 1: Signer une pétition

```javascript
import { translate } from '../services/i18n.js';

router.post('/api/v1/petitions/:id/sign', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const lang = req.query.lang || req.headers['accept-language']?.split('-')[0] || 'fr';

    // Vérifier si l'utilisateur a déjà signé
    const existingSignature = await Signature.findOne({
      where: { petitionId: id, citoyenId: userId }
    });

    if (existingSignature) {
      return res.status(409).json({
        success: false,
        error: translate('petition.alreadySigned', lang)
      });
    }

    // Créer la signature
    await Signature.create({
      petitionId: id,
      citoyenId: userId
    });

    return res.status(201).json({
      success: true,
      message: translate('petition.signed', lang)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.query.lang || 'fr')
    });
  }
});
```

### Exemple 2: Créer une pétition

```javascript
import { translate } from '../services/i18n.js';

router.post('/api/v1/petitions', authMiddleware, async (req, res) => {
  try {
    const { titre, description, eluId, deadline } = req.body;
    const lang = req.query.lang || 'fr';

    // Validation
    if (!titre) {
      return res.status(400).json({
        success: false,
        error: translate('error.validation', lang)
      });
    }

    // Créer la pétition
    const petition = await Petition.create({
      titre,
      description,
      eluId,
      deadline,
      citoyenId: req.user.id,
      status: 'draft'
    });

    return res.status(201).json({
      success: true,
      message: translate('petition.created', lang),
      data: petition
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', lang)
    });
  }
});
```

### Exemple 3: Changer le rôle d'un utilisateur (Admin)

```javascript
import { translate } from '../services/i18n.js';

router.post('/api/v1/admin/users/:id/role', adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const lang = req.query.lang || 'fr';

    if (!['citizen', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: translate('error.validation', lang)
      });
    }

    await User.update({ role }, { where: { id: req.params.id } });

    return res.json({
      success: true,
      message: translate('admin.userRoleUpdated', lang)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', lang)
    });
  }
});
```

---

## 🎯 Paramètre de langue

### Déterminer la langue

```javascript
// Ordre de priorité:
const lang = 
  req.query.lang ||                      // 1. Query param: ?lang=en
  req.headers['accept-language']?.split('-')[0] ||  // 2. Header Accept-Language
  req.user?.preferredLanguage ||         // 3. Préférence utilisateur
  'fr';                                  // 4. Défaut: français
```

### Exemples d'URLs

```
POST /api/v1/petitions?lang=en
POST /api/v1/petitions/:id/sign?lang=fr
GET /api/v1/admin/users?lang=en
```

---

## 📋 Clés disponibles

### Pétitions
```
petition.created      ✅
petition.updated      ✅
petition.published    ✅
petition.signed       ✅
petition.alreadySigned ✅
petition.unsigned     ✅
petition.deleted      ✅
```

### Promesses
```
promise.created       ✅
promise.updated       ✅
promise.deleted       ✅
promise.statusUpdated ✅
```

### Authentification
```
auth.loginRequested   ✅
auth.tokenExpired     ✅
auth.invalidToken     ✅
auth.logoutSuccess    ✅
```

### Utilisateur
```
user.profileUpdated   ✅
user.alreadyExists    ✅
user.notFound         ✅
user.passwordUpdated  ✅
```

### Erreurs
```
error.notFound        ✅
error.unauthorized    ✅
error.forbidden       ✅
error.conflict        ✅
error.validation      ✅
error.serverError     ✅
error.badRequest      ✅
error.duplicate       ✅
```

### Admin
```
admin.userRoleUpdated ✅
admin.missionCreated  ✅
admin.badgeCreated    ✅
```

---

## 🔄 Intégration avec middleware

### Middleware de langue

```javascript
export const languageMiddleware = (req, res, next) => {
  req.lang = 
    req.query.lang ||
    req.headers['accept-language']?.split('-')[0] ||
    req.user?.preferredLanguage ||
    'fr';
  
  next();
};

// Dans server.js:
app.use(languageMiddleware);
```

### Utilisation simplifiée

```javascript
router.post('/api/v1/petitions/:id/sign', authMiddleware, async (req, res) => {
  try {
    // ... logique
    return res.json({
      success: true,
      message: translate('petition.signed', req.lang)  // Utilise req.lang
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: translate('error.serverError', req.lang)
    });
  }
});
```

---

## ➕ Ajouter une nouvelle clé

### Méthode 1: Dans le service

```javascript
import { addTranslation } from '../services/i18n.js';

addTranslation(
  'petition.archived',
  'Pétition archivée',
  'Petition archived'
);
```

### Méthode 2: Directement dans translations

```javascript
// Dans i18n.js
const translations = {
  fr: {
    // ... existing
    'petition.archived': 'Pétition archivée'
  },
  en: {
    // ... existing
    'petition.archived': 'Petition archived'
  }
};
```

---

## 🧪 Tests

```javascript
import { translate } from '../services/i18n.js';

// Test 1: Traduction simple
expect(translate('petition.signed', 'fr')).toBe('Merci de votre signature');
expect(translate('petition.signed', 'en')).toBe('Thank you for signing');

// Test 2: Avec paramètres
expect(
  translate('error.conflict', 'fr', { message: 'Email exists' })
).toBe('Conflit : Email exists');

// Test 3: Clé manquante (fallback FR)
expect(translate('nonexistent.key', 'en')).toBe('nonexistent.key');
```

---

## ✅ Checklist

- [x] Service i18n créé
- [x] 40+ clés de traduction (FR/EN)
- [ ] Intégration dans routes petitions
- [ ] Intégration dans routes authentification
- [ ] Intégration dans routes admin
- [ ] Middleware de langue ajouté
- [ ] Tests unitaires
- [ ] Documentation client-serveur

---

**Backend i18n prêt ! 🚀**
