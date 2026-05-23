/**
 * LienInteret Model
 * Représente un lien d'intérêt entre un élu et une entité externe
 * (entreprise, lobby, organisation, famille, association, etc.)
 * Phase G.2 - Lot 6
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TYPES_AUTORISES = [
  'directorat',
  'actionnariat',
  'emploi',
  'consultation',
  'lobby',
  'beneficiaire',
  'famille',
  'association',
  'autre',
];

const LienInteret = sequelize.define(
  'LienInteret',
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

    entite: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    role: {
      type: DataTypes.STRING(150),
    },
    secteur: {
      type: DataTypes.STRING(100),
    },

    description: {
      type: DataTypes.TEXT,
    },

    dateDebut: {
      type: DataTypes.DATEONLY,
      field: 'date_debut',
    },
    dateFin: {
      type: DataTypes.DATEONLY,
      field: 'date_fin',
    },
    actuel: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    declareOfficiellement: {
      type: DataTypes.BOOLEAN,
      field: 'declare_officiellement',
      defaultValue: false,
    },
    dateDeclaration: {
      type: DataTypes.DATEONLY,
      field: 'date_declaration',
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
    tableName: 'liens_interets',
    timestamps: true,
    underscored: true,
  }
);

export { TYPES_AUTORISES };
export default LienInteret;
