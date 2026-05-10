/**
 * Comment Model
 * Représente les commentaires sur les pétitions
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    petitionId: {
      type: DataTypes.INTEGER,
      field: 'petition_id',
      allowNull: false,
      references: {
        model: 'petitions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    citoyenId: {
      type: DataTypes.INTEGER,
      field: 'citoyen_id',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    contenu: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    tableName: 'petition_comments',
    timestamps: true,
    indexes: [
      {
        fields: ['petition_id'],
      },
      {
        fields: ['citoyen_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Comment;
