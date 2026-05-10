/**
 * Actualite Model
 * Représente les posts/actualités des citoyens
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Actualite = sequelize.define('Actualite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  authorId: {
    type: DataTypes.INTEGER,
    field: 'author_id',
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'published']],
    },
  },
  likesCount: {
    type: DataTypes.INTEGER,
    field: 'likes_count',
    defaultValue: 0,
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    field: 'comments_count',
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  publishedAt: {
    type: DataTypes.DATE,
    field: 'published_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'actualites',
  timestamps: false,
});

export default Actualite;
