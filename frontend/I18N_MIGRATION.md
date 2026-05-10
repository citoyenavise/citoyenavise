# 🌍 Migration i18n - Frontend Complet

**Guide de migration de tous les composants vers i18next**

---

## 📋 Fichiers à modifier

### Pages (src/pages/)
- [ ] `Home.jsx`
- [ ] `Login.jsx`
- [ ] `Register.jsx`
- [ ] `PetitionsListPage.jsx` / `PetitionsPage.jsx`
- [ ] `PetitionDetailPage.jsx` / `PetitionDetail.jsx`
- [ ] `CreatePetitionPage.jsx`
- [ ] `ElussPage.jsx` / `ElusPage.jsx`
- [ ] `EluDetailPage.jsx` / `EluDetail.jsx`
- [ ] `Feed.jsx`
- [ ] `ActualitesPage.jsx` (si existe)
- [ ] `MapPage.jsx` (si existe)
- [ ] `AdminDashboard.jsx`
- [ ] `Notifications.jsx`
- [ ] `PostDetail.jsx`

### Composants (src/components/)
- [ ] `Header.jsx` ✅ (déjà modifié)
- [ ] `Navigation.jsx` (si existe)
- [ ] `Footer.jsx`
- [ ] `Sidebar.jsx`
- [ ] `Card.jsx`
- [ ] `Button.jsx`
- [ ] `Form*.jsx`
- [ ] `List*.jsx`
- [ ] Tous les autres composants

---

## 🔧 Template de migration

```jsx
// AVANT
import React from 'react';

const Component = () => {
  return (
    <div>
      <h1>Pétitions</h1>
      <button>Signer</button>
      <p>Total signatures: 123</p>
    </div>
  );
};

// APRÈS
import React from 'react';
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('petitions.title')}</h1>
      <button>{t('petitions.sign')}</button>
      <p>{t('petitions.totalSignatures', { count: 123 })}</p>
    </div>
  );
};
```

---

## 📝 Clés de traduction par page

### Home.jsx
```javascript
t('header.title')
t('header.subtitle')
t('header.nav.elus')
t('header.nav.petitions')
t('header.nav.actualites')
t('header.nav.transparence')
t('header.nav.carte')
```

### Login.jsx
```javascript
t('auth.login')
t('auth.email')
t('auth.checkEmail')
t('auth.magicLink')
```

### Register.jsx
```javascript
t('auth.login')
t('auth.email')
```

### PetitionsListPage.jsx
```javascript
t('petitions.title')
t('petitions.create')
t('petitions.totalSignatures', { count: X })
t('petitions.targetElu')
t('petitions.createdBy')
t('petitions.deadline')
```

### PetitionDetailPage.jsx
```javascript
t('petitions.title')
t('petitions.sign')
t('petitions.unsign')
t('petitions.alreadySigned')
t('petitions.totalSignatures', { count: X })
t('petitions.targetElu')
t('petitions.createdBy')
t('petitions.deadline')
```

### CreatePetitionPage.jsx
```javascript
t('petitions.create')
t('petitions.targetElu')
t('petitions.deadline')
t('errors.serverError')
```

### ElusPage.jsx
```javascript
t('elus.title')
t('elus.region')
t('elus.level')
t('elus.transparency')
t('elus.promises')
```

### EluDetailPage.jsx
```javascript
t('elus.promises')
t('elus.transparency')
t('elus.region')
t('elus.level')
t('petitions.title')
```

### ActualitesPage.jsx
```javascript
t('actualites.title')
t('actualites.publish')
t('actualites.draft')
t('actualites.published')
```

### Feed.jsx
```javascript
t('actualites.title')
t('actualites.published')
```

### AdminDashboard.jsx
```javascript
t('admin.title')
t('admin.stats')
t('admin.users')
t('admin.missions')
t('admin.badges')
t('elus.transparency')
t('petitions.title')
```

### Notifications.jsx
```javascript
t('header.title')  // Notifications
```

---

## ✅ Checklist par fichier

### Pour CHAQUE fichier :

1. **Ajouter l'import**
   ```jsx
   import { useTranslation } from 'react-i18next';
   ```

2. **Ajouter le hook dans le composant**
   ```jsx
   const { t } = useTranslation();
   ```

3. **Remplacer les textes durs**
   ```jsx
   // AVANT
   <h1>Pétitions</h1>
   
   // APRÈS
   <h1>{t('petitions.title')}</h1>
   ```

4. **Gérer les variables dynamiques**
   ```jsx
   // Avec interpolation
   {t('petitions.totalSignatures', { count: signatures.length })}
   ```

5. **Tester le changement de langue**
   - Cliquer sur FR/EN
   - Vérifier que le texte change

---

## 🎯 Ordre de priorité

1. **Haute** : Pages principales (Home, PetitionsListPage, ElusPage)
2. **Moyenne** : Pages secondaires (Detail, Create, Feed)
3. **Basse** : Composants réutilisables (Button, Card, etc.)

---

## 🧪 Tests

Après chaque modification :

```javascript
// Console du navigateur
import i18n from './i18n/config';
i18n.language  // Vérifie la langue actuelle
```

---

## 📚 Clés manquantes à ajouter

Si vous trouvez du texte qui n'a pas de clé, l'ajouter à :
- `public/locales/fr/translation.json`
- `public/locales/en/translation.json`

Format :
```json
{
  "section": {
    "newKey": "Nouveau texte"
  }
}
```

---

## 🔄 Workflow

1. ✅ Fichier identifié
2. ⬜ Import ajouté
3. ⬜ Hook ajouté
4. ⬜ Textes remplacés
5. ⬜ Clés manquantes ajoutées
6. ⬜ Testé en FR/EN
7. ✅ Complet

---

**Temps estimé : 2-3 heures pour tous les fichiers**

**Status : À faire** 🚀
