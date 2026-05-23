/**
 * Promise Model
 * Représente les promesses électorales et engagements publics des élus
 * Phase G.2 - Lot 2 : ajout traçabilité source + date_promesse + contexte
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const CONTEXTES_AUTORISES = [
  'campagne',
  'discours',
  'communique',
  'entrevue',
  'plateforme',
  'budget',
  'autre',
];

const Promise = sequelize.define(
  'Promise',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('engagee', 'en_cours', 'completee', 'abandonnee'),
      defaultValue: 'engagee',
      validate: {
        isIn: [['engagee', 'en_cours', 'completee', 'abandonnee']],
      },
    },

    // Traçabilité source (V013)
    source: {
      type: DataTypes.STRING(255),
    },
    sourceUrl: {
      type: DataTypes.TEXT,
      field: 'source_url',
    },
    datePromesse: {
      type: DataTypes.DATEONLY,
      field: 'date_promesse',
    },
    contexte: {
      type: DataTypes.STRING(100),
      validate: {
        isIn: [[...CONTEXTES_AUTORISES, null]],
      },
    },

    deadline: {
      type: DataTypes.DATE,
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at',
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
    tableName: 'promises',
    timestamps: true,
    underscored: true,
  }
);

export { CONTEXTES_AUTORISES };
export default Promise;
