---
name: Vision et mission du projet
description: Objectifs, livrables et roadmap du MVP Citoyen Avisé
type: project
---

# Citoyen Avisé — Vision MVP

## 🎯 Objectif Principal
Transformer une plateforme statique de contenu civique canadien en un **réseau interactif de citoyens**, permettant la participation démocratique, l'échange d'idées et la localisation des enjeux civiques.

## 📊 Cibles
- **Audience** : Citoyens canadiens (FR/EN)
- **Plateforme** : Web + mobile-ready
- **Modèle** : Non-profit, gratuit, sans publicité
- **MVP scope** : 14 semaines, 6 modules clés

## 🏗️ Stack technique
- **Frontend** : HTML/CSS/JS composants (migration future vers React/Vue possible)
- **Backend** : Node.js + Express
- **Database** : PostgreSQL + PostGIS (pour la carte)
- **Auth** : JWT
- **Déploiement** : Docker, cloud (Heroku/Railway/DigitalOcean)

## 🚀 Modules MVP
1. **Authentification & Utilisateurs** : Inscription, connexion, profils
2. **Profils Citoyens** : Réseaux, suivis, localisation
3. **Posts & Idées** : Contenu civique partagé, modération
4. **Carte Interactive** : Visualisation citoyens + organisations
5. **Contenu Civique** : Pages statiques migées en CMS dynamique
6. **Likes & Interactions** : Engagement simple

## 📅 Timeline
- **Phase 1 (Sem 1-2)** : Infrastructure, _ai/, dossiers, DB
- **Phase 2 (Sem 3-4)** : Auth + Profils
- **Phase 3 (Sem 5-6)** : Posts + Idées
- **Phase 4 (Sem 7-8)** : Carte
- **Phase 5 (Sem 9-10)** : Contenu CMS
- **Phase 6 (Sem 11-12)** : Admin & Modération
- **Phase 7 (Sem 13-14)** : Tests, déploiement

## 🎨 Principes de conception
- **Transparence** : Sources citées, pas de contenu caché
- **Accessibilité** : WCAG 2.1 AA minimum
- **Clarté** : Langage simple, aucune jargon politique
- **Non-partisanerie** : Neutre, indépendant
- **Inclusivité** : Bilingue FR/EN, mobile-first

## 🔒 Contraintes critiques
- ❌ Pas de profit, pas de publicité
- ❌ Pas de manipulation algorithmique
- ❌ Aucune affiliation politique
- ✅ Modération contre désinformation
- ✅ Données pseudonymes par défaut

## 📈 Succès mesurable
- 1000+ citoyens inscrits (3 mois)
- 500+ posts/idées (3 mois)
- 50%+ taux de participation (posts + likes)
- 99.5% uptime
- Pas d'incidents de sécurité

## 🔮 Vision long-terme (v2, v3)
- Pétitions gouvernementales (intégration Change.org API)
- Événements civiques localisés
- Vérification de profils (partenaires civiques)
- Recommandations civiques (pas algorithmes de profit)
- Webhooks pour intégrations tierces
