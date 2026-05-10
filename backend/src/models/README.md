# Sequelize Models — Citoyen Avisé

## 📋 Modèles Disponibles

### 1. User
```javascript
import { User } from './models/index.js';

// Attributs
{
  id: INTEGER,
  email: STRING (UNIQUE),
  nomComplet: STRING,
  province: STRING,
  codePostal: STRING,
  verifiedAt: DATE,
  createdAt: DATE,
  updatedAt: DATE
}

// Relations
User.petitionsCreated  // Pétitions créées
User.signatures        // Signatures apposées
User.actualites        // Actualités écrites
```

### 2. Elu
```javascript
import { Elu } from './models/index.js';

// Attributs
{
  id: INTEGER,
  nom: STRING,
  titre: STRING,
  region: STRING,
  niveau: STRING,
  email: STRING,
  photoUrl: STRING,
  siteWeb: STRING,
  createdAt: DATE,
  updatedAt: DATE
}

// Relations
Elu.petitions  // Pétitions adressées
```

### 3. Petition
```javascript
import { Petition } from './models/index.js';

// Attributs
{
  id: INTEGER,
  titre: STRING,
  description: TEXT,
  citoyenId: INTEGER (FK → User),
  eluId: INTEGER (FK → Elu),
  status: STRING (draft|published|closed|won),
  signaturesCount: INTEGER,
  deadline: DATE,
  createdAt: DATE,
  updatedAt: DATE
}

// Relations
Petition.creator   // Citoyen créateur
Petition.elu       // Élu destinataire
Petition.signatures // Signatures apposées
```

### 4. Signature
```javascript
import { Signature } from './models/index.js';

// Attributs
{
  id: BIGINT,
  petitionId: INTEGER (FK → Petition),
  citoyenId: INTEGER (FK → User),
  createdAt: DATE
}

// Unique Constraint
UNIQUE(petitionId, citoyenId)  // ← Idempotency

// Relations
Signature.signer     // Citoyen qui signe
Signature.petition   // Pétition signée
```

### 5. Actualite
```javascript
import { Actualite } from './models/index.js';

// Attributs
{
  id: INTEGER,
  titre: STRING,
  contenu: TEXT,
  authorId: INTEGER (FK → User),
  status: STRING (draft|published),
  likesCount: INTEGER,
  commentsCount: INTEGER,
  createdAt: DATE,
  publishedAt: DATE,
  updatedAt: DATE
}

// Relations
Actualite.author  // Auteur (User)
```

---

## 🔗 Relations Complètes

```
User (1) ───────→ (N) Petition (as creator)
  │
  ├────────────→ (N) Signature
  │
  └────────────→ (N) Actualite (as author)

Elu (1) ────────→ (N) Petition

Petition (1) ────→ (N) Signature
  │
  ├────────────→ (1) User (as creator)
  │
  └────────────→ (1) Elu

Signature (N) ────→ (1) Petition
  └────────────→ (1) User (as signer)
```

---

## 📝 Exemples d'Utilisation

### Créer un utilisateur
```javascript
import { User } from './models/index.js';

const user = await User.create({
  email: 'citoyen@example.com',
  nomComplet: 'Jean Dupont'
});
```

### Créer une pétition
```javascript
import { Petition } from './models/index.js';

const petition = await Petition.create({
  titre: 'Augmenter le financement des écoles',
  description: '...',
  citoyenId: 1,
  eluId: 5,
  status: 'published'
});
```

### Signer une pétition (avec idempotency)
```javascript
import { Signature } from './models/index.js';

try {
  const sig = await Signature.create({
    petitionId: 1,
    citoyenId: 42
  });
} catch (err) {
  if (err.name === 'SequelizeUniqueConstraintError') {
    console.log('Already signed');
  }
}
```

### Charger une pétition avec relations
```javascript
const petition = await Petition.findByPk(1, {
  include: [
    { association: 'creator', model: User },
    { association: 'elu', model: Elu },
    { association: 'signatures', model: Signature }
  ]
});

console.log(petition.creator.email);    // Jean Dupont
console.log(petition.elu.nom);          // Député X
console.log(petition.signatures.length); // 42 signatures
```

### Charger utilisateur avec ses pétitions
```javascript
const user = await User.findByPk(1, {
  include: [
    { association: 'petitionsCreated', model: Petition },
    { association: 'actualites', model: Actualite }
  ]
});

console.log(user.petitionsCreated);  // Array of 3 petitions
console.log(user.actualites);        // Array of 5 posts
```

---

## 🚀 Configuration

### Initialiser Sequelize
```javascript
import sequelize from './db/sequelize.js';
import { User, Elu, Petition, Signature, Actualite } from './models/index.js';

// Sync models with database
await sequelize.sync({ alter: true });
```

### Dans Express
```javascript
import { User, Petition } from './models/index.js';

app.get('/api/petitions/:id', async (req, res) => {
  const petition = await Petition.findByPk(req.params.id, {
    include: ['creator', 'elu', 'signatures']
  });
  
  res.json({
    success: true,
    data: petition
  });
});
```

---

## ✅ Constraints Validées

- ✅ UNIQUE(petition_id, citoyen_id) sur Signature
- ✅ FK constraints avec ON DELETE CASCADE
- ✅ Status enum validation
- ✅ Email validation
- ✅ Titre/Description required

---

## 📚 Documentation Officielle

- [Sequelize Docs](https://sequelize.org/)
- [Associations](https://sequelize.org/docs/v6/core-concepts/assocs/)
- [Validation](https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/)
