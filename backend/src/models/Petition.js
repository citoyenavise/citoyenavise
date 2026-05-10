/**
 * Petition Model
 * Représente les pétitions citoyennes
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Petition = sequelize.define('Petition', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
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
  eluId: {
    type: DataTypes.INTEGER,
    field: 'elu_id',
    references: {
      model: 'elus',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'published', 'closed', 'won']],
    },
  },
  signaturesCount: {
    type: DataTypes.INTEGER,
    field: 'signatures_count',
    defaultValue: 0,
  },
  deadline: {
    type: DataTypes.DATE,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'petitions',
  timestamps: false,
});

export default Petition;
