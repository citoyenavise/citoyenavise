/**
 * Donateur Model
 * Représente une contribution financière déclarée à un élu / sa campagne
 * Phase G.2 - Lot 6
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TYPES_DONATEUR_AUTORISES = [
  'particulier',
  'entreprise',
  'syndicat',
  'organisme',
  'parti',
  'comite',
  'anonyme',
  'autre',
];

const TYPES_DON_AUTORISES = [
  'monetaire',
  'service',
  'bien',
  'pret',
  'evenement',
  'autre',
];

const Donateur = sequelize.define(
  'Donateur',
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

    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    typeDonateur: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'type_donateur',
      validate: {
        isIn: [TYPES_DONATEUR_AUTORISES],
      },
    },

    montant: {
      type: DataTypes.DECIMAL(12, 2),
      validate: { min: 0 },
    },
    devise: {
      type: DataTypes.STRING(3),
      defaultValue: 'CAD',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    anneeFiscale: {
      type: DataTypes.INTEGER,
      field: 'annee_fiscale',
    },

    typeDon: {
      type: DataTypes.STRING(50),
      field: 'type_don',
      validate: {
        isIn: [[...TYPES_DON_AUTORISES, null]],
      },
    },
    campagne: {
      type: DataTypes.STRING(150),
    },

    source: {
      type: DataTypes.STRING(255),
    },
    sourceUrl: {
      type: DataTypes.TEXT,
      field: 'source_url',
    },

    isPublished: {
      type: DataTypes.BOOLEAN,
      field: 'is_published',
      defaultValue: true,
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
    tableName: 'donateurs',
    timestamps: true,
    underscored: true,
  }
);

export { TYPES_DONATEUR_AUTORISES, TYPES_DON_AUTORISES };
export default Donateur;
