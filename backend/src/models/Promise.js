/**
 * Promise Model
 * Représente les promesses électorales des élus
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

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

export default Promise;
