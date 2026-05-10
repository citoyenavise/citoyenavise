/**
 * Elu Model
 * Représente les élus (Députés, Sénateurs, Maires, Conseillers)
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Elu = sequelize.define('Elu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  titre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [['Député', 'Sénateur', 'Maire', 'Conseiller', 'Autre']],
    },
  },
  region: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  niveau: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['fédéral', 'provincial', 'municipal']],
    },
  },
  email: {
    type: DataTypes.STRING(255),
  },
  photoUrl: {
    type: DataTypes.STRING(500),
    field: 'photo_url',
  },
  siteWeb: {
    type: DataTypes.STRING(500),
    field: 'site_web',
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
  tableName: 'elus',
  timestamps: false,
});

export default Elu;
