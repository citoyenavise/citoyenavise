# TERRITOIRE_TEMPLATE
Modèle universel dont héritent tous les territoires de CitoyenAvisé.
Version 1.0 — 2026-06-23
Règle absolue : tout objet du système doit être relié à un territoire parent.


---

## IDENTITÉ

| Champ | Valeur |
|-------|--------|
| Code territoire | TERRITOIRE_XXXX |
| Nom officiel | |
| Nom alternatif / populaire | |
| Niveau | 0 = Canada / 1 = Province / 2 = Région / 3 = MRC / 4 = Municipalité / 5 = Arrondissement |
| Territoire parent | TERRITOIRE_XXXX |
| Statut | actif / inactif / fusionné |
| Date de création de la fiche | |
| Dernière mise à jour | |

---

## GÉOGRAPHIE

| Champ | Valeur |
|-------|--------|
| Coordonnées centroïde | latitude / longitude |
| Polygone | GeoJSON (lien ou fichier associé) |
| Superficie | km² |
| Fuseau horaire | |

---

## POPULATION

| Champ | Valeur |
|-------|--------|
| Population totale | (source + année recensement) |
| Densité | habitants / km² |
| Langue majoritaire | |
| Source | Statistique Canada — recensement XXXX |

---

## REPRÉSENTATION

Les représentants ne possèdent pas les données. Ils sont reliés au territoire.
Chaque lien pointe vers une fiche REPRESENTANT_XXXX.


| Niveau | Nom | Code représentant | Depuis | Jusqu'à |
|--------|-----|------------------|--------|---------|
| Fédéral | | REPRESENTANT_XXXX | | |
| Provincial | | REPRESENTANT_XXXX | | |
| Municipal — Maire | | REPRESENTANT_XXXX | | |
| Municipal — Conseiller(s) | | REPRESENTANT_XXXX | | |
| Scolaire | | REPRESENTANT_XXXX | | |

---

## CIRCONSCRIPTIONS ÉLECTORALES

Les frontières électorales ne suivent pas les frontières administratives.
Les deux couches coexistent sans se remplacer.


| Niveau | Nom de la circonscription | Code |
|--------|--------------------------|------|
| Fédéral | | |
| Provincial | | |
| Municipal — District | | |
| Scolaire — Centre de services | | |

---

## INSTITUTIONS

Chaque institution listée ici possède sa propre fiche INSTITUTION_XXXX.
Les établissements sont autonomes mais reliés à ce territoire.


### Éducation
| Nom | Code | Type | Statut |
|-----|------|------|--------|
| | INSTITUTION_XXXX | École primaire / secondaire / cégep / université | actif |

### Santé
| Nom | Code | Type | Statut |
|-----|------|------|--------|
| | INSTITUTION_XXXX | CLSC / Hôpital / GMF / Clinique | actif |

### Services municipaux
| Nom | Code | Type | Statut |
|-----|------|------|--------|
| | INSTITUTION_XXXX | Bibliothèque / Aréna / Centre communautaire | actif |

### Organismes communautaires
| Nom | Code | Type | Statut |
|-----|------|------|--------|
| | INSTITUTION_XXXX | | actif |

---

## FINANCES

Tous les documents financiers demeurent dans le territoire.


| Document | Année | Lien / Référence | Statut |
|----------|-------|-----------------|--------|
| Budget annuel | | | publié / à venir |
| Rapport financier | | | |
| Taxes foncières (taux) | | | |
| Contrats publics | | | |
| Subventions reçues | | | |

---

## DÉCISIONS

Lien vers fiches DECISION_XXXX reliées à ce territoire.


| Code | Titre | Date | Type | Statut |
|------|-------|------|------|--------|
| DECISION_XXXX | | | Règlement / Résolution / Loi | adopté / rejeté / en cours |

---

## PROJETS

Lien vers fiches PROJET_XXXX reliées à ce territoire.


| Code | Titre | Coût | État | Responsable |
|------|-------|------|------|-------------|
| PROJET_XXXX | | | annoncé / en cours / complété / annulé | |

---

## CONSULTATIONS PUBLIQUES

| Code | Titre | Date | Type | Statut |
|------|-------|------|------|--------|
| CONSULTATION_XXXX | | | OCPM / Conseil municipal / Autre | ouverte / fermée / à venir |

---

## ENJEUX ACTIFS

Un enjeu existe à plusieurs niveaux simultanément.
Ce tableau relie l'enjeu national à sa réalité locale.


| Enjeu | Niveau national | Niveau provincial | Niveau local | Intensité locale |
|-------|----------------|------------------|--------------|-----------------|
| Logement | | | | faible / moyenne / élevée |
| Transport | | | | |
| Santé | | | | |
| Éducation | | | | |
| Fiscalité | | | | |
| Sécurité | | | | |
| Environnement | | | | |

---

## STATISTIQUES

| Indicateur | Valeur | Source | Année | Comparaison provinciale |
|------------|--------|--------|-------|------------------------|
| Taux de chômage | | | | |
| Revenu médian des ménages | | | | |
| Taux de propriété | | | | |
| Taux de diplomation | | | | |
| Accès aux soins (délai moyen) | | | | |
| Indice de défavorisation | | | | |

---

## PÉTITIONS ET PARTICIPATION

Données générées par les citoyens sur ce territoire via CitoyenAvisé.


| Indicateur | Valeur |
|------------|--------|
| Pétitions actives | |
| Pétitions complétées | |
| Signataires actifs (30j) | |
| Consultations participées | |
| Signalements soumis | |
| Corrections proposées | |

---

## HISTORIQUE ET ARCHIVES

Tout changement significatif concernant ce territoire est consigné ici.


| Date | Événement | Type | Source |
|------|-----------|------|--------|
| | | Fusion / Élection / Décision majeure / Changement de limite | |

---

## INBOX

Informations reçues rattachées à ce territoire mais non encore classées.
Traitées par l'opérateur avant publication.


| Date réception | Nature | Source | Action requise |
|----------------|--------|--------|----------------|
| | | | classer / valider / rejeter |

---

## MÉTADONNÉES DE LA FICHE

| Champ | Valeur |
|-------|--------|
| Créé par | |
| Validé par | |
| Source principale | |
| Niveau de complétude | 0 % → 100 % |
| Prochaine révision prévue | |
| Notes internes | |
