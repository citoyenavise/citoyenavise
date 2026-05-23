/**
 * Elu Model
 * Représente les élus à tous les niveaux (fédéral, provincial, municipal)
 * Phase G.2 - Lot 1 : extension fiche descriptive complète
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TITRES_AUTORISES = [
  'Député',
  'Députée',
  'Sénateur',
  'Sénatrice',
  'Premier ministre',
  'Première ministre',
  'Ministre',
  'Vice-PM',
  'Président Chambre',
  'Présidente Chambre',
  'Président Sénat',
  'Présidente Sénat',
  'Gouverneur général',
  'Gouverneure générale',
  'Juge',
  'Maire',
  'Mairesse',
  'Conseiller',
  'Conseillère',
  'Autre',
];

const NIVEAUX_AUTORISES = ['fédéral', 'provincial', 'municipal'];

const STATUTS_AUTORISES = ['actif', 'sortant', 'ancien', 'candidat', 'decede'];

const CAUSES_FIN_AUTORISEES = [
  'fin_mandat',
  'demission',
  'defaite_electorale',
  'deces',
  'revocation',
  'autre',
];

const Elu = sequelize.define(
  'Elu',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Identité
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isIn: [TITRES_AUTORISES],
      },
    },
    poste: {
      type: DataTypes.STRING(150),
    },
    rolesSecondaires: {
      type: DataTypes.TEXT,
      field: 'roles_secondaires',
    },
    partiPolitique: {
      type: DataTypes.STRING(100),
      field: 'parti_politique',
    },
    partiCouleur: {
      type: DataTypes.STRING(20),
      field: 'parti_couleur',
    },

    // Géographie / circonscription
    region: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    niveau: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [NIVEAUX_AUTORISES],
      },
    },
    circonscriptionId: {
      type: DataTypes.INTEGER,
      field: 'circonscription_id',
    },

    // Mandat
    mandatDebut: {
      type: DataTypes.DATEONLY,
      field: 'mandat_debut',
    },
    mandatFin: {
      type: DataTypes.DATEONLY,
      field: 'mandat_fin',
    },
    legislature: {
      type: DataTypes.STRING(10),
    },

    // Contact
    email: {
      type: DataTypes.STRING(255),
    },
    telephone: {
      type: DataTypes.STRING(30),
    },
    adresseBureau: {
      type: DataTypes.TEXT,
      field: 'adresse_bureau',
    },
    siteWeb: {
      type: DataTypes.STRING(500),
      field: 'site_web',
    },
    reseauxSociaux: {
      type: DataTypes.JSONB,
      field: 'reseaux_sociaux',
      defaultValue: {},
    },

    // Visuels
    photoUrl: {
      type: DataTypes.STRING(500),
      field: 'photo_url',
    },

    // Géolocalisation
    latitude: {
      type: DataTypes.FLOAT,
    },
    longitude: {
      type: DataTypes.FLOAT,
    },

    // Cycle de vie
    statut: {
      type: DataTypes.STRING(20),
      defaultValue: 'actif',
      validate: {
        isIn: [STATUTS_AUTORISES],
      },
    },
    causeFin: {
      type: DataTypes.STRING(50),
      field: 'cause_fin',
      validate: {
        isIn: [[...CAUSES_FIN_AUTORISEES, null]],
      },
    },

    // Traçabilité source
    sourceUrl: {
      type: DataTypes.TEXT,
      field: 'source_url',
    },
    sourceDerniereMaj: {
      type: DataTypes.DATE,
      field: 'source_derniere_maj',
    },

    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    tableName: 'elus',
    timestamps: false,
  }
);

// Exports utilitaires
export {
  TITRES_AUTORISES,
  NIVEAUX_AUTORISES,
  STATUTS_AUTORISES,
  CAUSES_FIN_AUTORISEES,
};

export default Elu;
