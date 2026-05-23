/**
 * Action Model
 * Représente une action concrète d'un élu (loi, projet, déclaration, décision)
 * Phase G.2 - Lot 3
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TYPES_AUTORISES = [
  'loi',
  'projet_loi',
  'motion',
  'vote',
  'decision',
  'declaration',
  'intervention',
  'communique',
  'autre',
];

const Action = sequelize.define(
  'Action',
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
    promiseId: {
      type: DataTypes.INTEGER,
      field: 'promise_id',
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [TYPES_AUTORISES],
      },
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
    tableName: 'actions',
    timestamps: true,
    underscored: true,
  }
);

export { TYPES_AUTORISES };
export default Action;
