/**
 * Controverse Model
 * Représente controverses, enquêtes, sanctions, corrections concernant un élu
 * Phase G.2 - Lot 5
 *
 * RÈGLE ÉDITORIALE :
 * - Contenu neutre, factuel, sourcé.
 * - Validation admin obligatoire avant publication (is_published).
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TYPES_AUTORISES = [
  'scandale',
  'enquete',
  'sanction',
  'correction',
  'allegation',
  'condamnation',
  'rappel_ethique',
  'autre',
];

const GRAVITES_AUTORISEES = ['mineure', 'moderee', 'majeure'];

const STATUTS_AUTORISES = [
  'en_cours',
  'cloturee',
  'rejetee',
  'confirmee',
  'non_lieu',
];

const Controverse = sequelize.define(
  'Controverse',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    eluId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'elu_id',
    },

    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [TYPES_AUTORISES],
      },
    },
    gravite: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: [[...GRAVITES_AUTORISEES, null]],
      },
    },

    titre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    positionOfficielle: {
      type: DataTypes.TEXT,
      field: 'position_officielle',
    },

    statut: {
      type: DataTypes.STRING(30),
      defaultValue: 'en_cours',
      validate: {
        isIn: [STATUTS_AUTORISES],
      },
    },
    dateDebut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_debut',
    },
    dateFin: {
      type: DataTypes.DATEONLY,
      field: 'date_fin',
    },

    source: {
      type: DataTypes.STRING(255),
    },
    sourceUrl: {
      type: DataTypes.TEXT,
      field: 'source_url',
    },
    sourcesComplementaires: {
      type: DataTypes.JSONB,
      field: 'sources_complementaires',
      defaultValue: [],
    },

    isPublished: {
      type: DataTypes.BOOLEAN,
      field: 'is_published',
      defaultValue: false,
    },
    validatedByAdmin: {
      type: DataTypes.BOOLEAN,
      field: 'validated_by_admin',
      defaultValue: false,
    },
    validatedAt: {
      type: DataTypes.DATE,
      field: 'validated_at',
    },

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
    tableName: 'controverses',
    timestamps: true,
    underscored: true,
  }
);

export { TYPES_AUTORISES, GRAVITES_AUTORISEES, STATUTS_AUTORISES };
export default Controverse;
