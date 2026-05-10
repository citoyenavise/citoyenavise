# 🌍 Configuration i18n - Citoyen Avisé

**Internationalization (i18n) setup pour React + i18next**

---

## 📦 Packages installés

```bash
npm install i18next react-i18next i18next-backend i18next-http-backend
```

---

## 📁 Structure des fichiers

```
frontend/
├── public/
│   └── locales/
│       ├── fr/
│       │   └── translation.json      ✅ Traductions françaises
│       └── en/
│           └── translation.json      ✅ Traductions anglaises
│
├── src/
│   ├── config/
│   │   └── i18n.js                  ✅ Configuration i18next
│   │
│   ├── hooks/
│   │   └── useTranslation.js         ✅ Hook personnalisé
│   │
│   ├── components/
│   │   └── LanguageSwitcher.jsx      ✅ Sélecteur de langue
│   │
│   └── styles/
│       └── LanguageSwitcher.css      ✅ Styles du sélecteur
│
└── App.jsx                           ← À modifier
```

---

## 🔧 Configuration dans App.jsx

```jsx
import i18n from './config/i18n';
import { I18nextProvider } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Header>
        <LanguageSwitcher />
      </Header>
      
      <main>
        {/* Votre contenu */}
      </main>
    </I18nextProvider>
  );
}

export default App;
```

---

## 💬 Utiliser les traductions

### Dans un composant React

```jsx
import { useTranslation } from '../hooks/useTranslation';

export function HomePage() {
  const { t, currentLanguage, changeLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('header.title')}</h1>
      <p>{t('header.subtitle')}</p>
      
      <nav>
        <a href="/elus">{t('header.nav.elus')}</a>
        <a href="/petitions">{t('header.nav.petitions')}</a>
        <a href="/actualites">{t('header.nav.actualites')}</a>
      </nav>

      <p>Langue actuelle: {currentLanguage}</p>
      
      <button onClick={() => changeLanguage('fr')}>Français</button>
      <button onClick={() => changeLanguage('en')}>English</button>
    </div>
  );
}
```

### Avec variables dynamiques

```jsx
const { t } = useTranslation();

// Dans translation.json:
// "petitions": {
//   "totalSignatures": "{{count}} signature(s)"
// }

<p>{t('petitions.totalSignatures', { count: 42 })}</p>
// Output: "42 signature(s)" ou "42 signature(s)" selon la langue
```

### Avec pluralisation

```jsx
// Dans translation.json:
// "petitions": {
//   "one": "1 pétition",
//   "other": "{{count}} pétitions"
// }

<p>{t('petitions', { count: 1 })}</p>
// Output: "1 pétition"

<p>{t('petitions', { count: 5 })}</p>
// Output: "5 pétitions"
```

---

## 📝 Structure des fichiers de traduction

### Traductions imbriquées

```json
{
  "header": {
    "title": "Citoyen Avisé",
    "nav": {
      "home": "Accueil",
      "about": "À propos"
    }
  }
}
```

Accès: `t('header.nav.home')` → "Accueil"

### Avec interpolation

```json
{
  "welcome": "Bienvenue, {{name}}!"
}
```

Usage: `t('welcome', { name: 'Jean' })` → "Bienvenue, Jean!"

---

## 🎯 Détection automatique de langue

La détection suit cet ordre :

1. **localStorage** — Langue sauvegardée précédemment
2. **navigator** — Langue du navigateur
3. **htmlTag** — Attribut `lang` du HTML
4. **fallback** — Français (`fr`) par défaut

---

## ➕ Ajouter une nouvelle langue

### 1. Créer le fichier de traduction

```bash
mkdir -p public/locales/es
# Créer public/locales/es/translation.json
```

### 2. Ajouter à la configuration (i18n.js)

Pas besoin de modification — charge dynamiquement les fichiers !

### 3. Ajouter au language switcher

Modifier `LanguageSwitcher.jsx` :

```jsx
<button onClick={() => changeLanguage('es')}>
  🇪🇸 ES
</button>
```

---

## 🔄 Synchroniser avec le backend

Les traductions côté backend sont dans `database/migrations/V010_i18n.sql`

### Pour les pétitions, promesses, actualités, commentaires :

```jsx
// Récupérer depuis l'API
const petition = await api.get('/petitions/1');

// Traduction depuis la BD
const frTitle = petition.translations.find(t => t.language === 'fr')?.titre;
const enTitle = petition.translations.find(t => t.language === 'en')?.titre;

// Ou utiliser le titre par défaut
const title = currentLanguage === 'fr' ? frTitle : enTitle;
```

---

## 🧪 Tester les traductions

### Console du navigateur

```javascript
// Vérifier la configuration
import i18n from './config/i18n';
console.log(i18n.language);        // Langue actuelle
console.log(i18n.languages);       // Langues disponibles
console.log(i18n.getResource('fr', 'translation')); // Ressources FR
```

---

## 📊 Resources clés

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Guide](https://react.i18next.com/)
- [i18next Backend](https://github.com/i18next/i18next-http-backend)
- [Language Detector](https://github.com/i18next/i18next-browser-languageDetector)

---

## ✅ Checklist d'intégration

- [ ] `npm install` les packages
- [ ] Créer les fichiers JSON de traduction
- [ ] Créer `config/i18n.js`
- [ ] Créer le hook `useTranslation()`
- [ ] Créer le composant `LanguageSwitcher`
- [ ] Wrapper App.jsx avec `<I18nextProvider>`
- [ ] Ajouter le `<LanguageSwitcher />` dans le Header
- [ ] Remplacer les strings durs par `t('clé')`
- [ ] Tester le changement de langue
- [ ] Vérifier la persistance (localStorage)

---

**Multilingue prêt ! 🌍**
