# 🔐 Stratégie d'Authentification

## Question Clé

Votre schéma `users` n'a **pas de password_hash**. Comment l'authentification fonctionne ?

---

## 3 Options Recommandées

### **Option 1 : Magic Link (⭐ Recommandée)**

L'utilisateur tape son email → reçoit un lien unique → clique → connecté

**Flux** :
```
1. POST /api/v1/auth/request-login
   - Input: { email }
   - Génère token unique (24h)
   - Envoie email avec lien : /verify?token=xyz

2. GET /api/v1/auth/verify?token=xyz
   - Valide token
   - Crée session/JWT
   - Redirige vers /dashboard

3. User connecté ✅
```

**Avantages** :
- ✅ Pas de password à retenir
- ✅ Pas de force brute possible
- ✅ Email vérifié automatiquement
- ✅ UX simple

**Inconvénients** :
- ❌ Nécessite serveur d'emails
- ❌ Délai (utilisateur attend email)

**Stack** :
- `nodemailer` pour emails
- Token dans table `email_verifications`
- JWT après clic

---

### **Option 2 : OTP (One-Time Password)**

Utilisateur tape email → reçoit code 6 chiffres → tape code → connecté

**Flux** :
```
1. POST /api/v1/auth/request-otp
   - Input: { email }
   - Génère code 6 chiffres (ex: 847392)
   - Envoie email/SMS avec code
   - Code valide 15 minutes

2. POST /api/v1/auth/verify-otp
   - Input: { email, code: "847392" }
   - Valide code
   - Crée session/JWT
   - Marque utilisateur comme vérifié

3. User connecté ✅
```

**Avantages** :
- ✅ Pas de clic requis
- ✅ Mobile-friendly
- ✅ Pas de password
- ✅ Code court à retenir

**Inconvénients** :
- ❌ Serveur d'emails/SMS
- ❌ Code peut être deviné (6 chiffres = 1M combinaisons)

**Stack** :
- `nodemailer` pour emails
- OTP dans table `email_verifications`
- JWT après vérification

---

### **Option 3 : Hybrid (Password optionnel + Magic Link)**

- Si l'utilisateur veut password : il peut l'ajouter optionnellement
- Fallback toujours : magic link

**Flux** :
```
LOGIN SIMPLE (Magic Link) :
POST /api/v1/auth/login
- Input: { email }
- Envoie magic link
- User clique → connecté ✅

LOGIN AVANCÉ (Password) :
POST /api/v1/auth/login-advanced
- Input: { email, password }
- Si password valide → JWT immédiat ✅
- Si password absent → fallback magic link

SIGNUP :
POST /api/v1/auth/register
- Input: { email, nom_complet, province, code_postal }
- Envoie magic link
- User clique → compte créé + vérifié ✅
```

**Avantages** :
- ✅ Flexible
- ✅ Support à la fois password et magic link
- ✅ Meilleure UX progressive

**Inconvénients** :
- ❌ Plus complexe
- ❌ Champ password optionnel à gérer

---

## 📊 Comparaison

| Critère | Magic Link | OTP | Hybrid |
|---|---|---|---|
| **Simplicité** | 🟢 Simple | 🟡 Moyen | 🔴 Complexe |
| **Sécurité** | 🟢 Fort | 🟢 Fort | 🟢 Fort |
| **UX** | 🟡 Clic requis | 🟢 Code texte | 🟢 Flexible |
| **Mobile** | 🟡 Liens | 🟢 Parfait | 🟢 Parfait |
| **Serveur Email** | ✅ Requis | ✅ Requis | ✅ Requis |
| **Implémentation** | 4h | 6h | 10h |

---

## 🎯 Ma Recommandation

**Démarrer avec Magic Link** :

1. ✅ Simplest à implémenter (4-5h)
2. ✅ Fonctionnel immédiatement
3. ✅ Peut évoluer vers OTP/Password plus tard
4. ✅ UX acceptable
5. ✅ Pas de brute force

**Implémentation** :

```javascript
// Jour 4-5 : Magic Link Implementation
src/services/AuthService.js
├── requestLogin(email)        // Génère token + envoie email
├── verifyToken(token)         // Valide token + crée JWT
└── sendVerificationEmail()    // Envoie email (nodemailer)

src/routes/auth.js
├── POST /api/v1/auth/request-login      // Demande magic link
└── GET /api/v1/auth/verify?token=xyz    // Valide + connecte
```

---

## 📝 Choix

**Sélectionnez une option** :

- [ ] **Option 1 : Magic Link** (Recommandée, simple)
- [ ] **Option 2 : OTP** (Plus moderne)
- [ ] **Option 3 : Hybrid** (Flexible)
- [ ] **Autre** : Précisez

Une fois décidé, je vais créer l'AuthService complet pour Jour 4-5.

---

## Détails Techniques (Pour Référence)

### Magic Link Flow Détaillé

```
REQUEST LOGIN :
POST /api/v1/auth/request-login
{
  "email": "user@example.com"
}

RÉPONSE :
{
  "success": true,
  "message": "Email de vérification envoyé. Vérifiez votre boîte email."
}

[Utilisateur reçoit email avec lien :]
https://citoyenavise.org/auth/verify?token=eyJhbGciOiJIUzI1NiI...

CLIC SUR LIEN :
GET /api/v1/auth/verify?token=eyJhbGciOiJIUzI1NiI...

[Backend valide token, crée JWT, redirige :]
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "nom_complet": "John Doe",
    "verified_at": "2026-05-09T..."
  }
}

USER CONNECTÉ ✅
```

---

**Décidez et je code directement !** 🚀
