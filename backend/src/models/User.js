/**
 * User Model
 * Représente les citoyens/utilisateurs de la plateforme
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  nomComplet: {
    type: DataTypes.STRING(255),
    field: 'nom_complet',
  },
  province: {
    type: DataTypes.STRING(50),
  },
  codePostal: {
    type: DataTypes.STRING(10),
    field: 'code_postal',
  },
  verifiedAt: {
    type: DataTypes.DATE,
    field: 'verified_at',
  },
  role: {
    type: DataTypes.ENUM('citizen', 'admin'),
    defaultValue: 'citizen',
    validate: {
      isIn: [['citizen', 'admin']],
    },
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
  tableName: 'users',
  timestamps: false,
});

export default User;
