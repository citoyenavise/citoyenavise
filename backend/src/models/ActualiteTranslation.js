import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const ActualiteTranslation = sequelize.define('ActualiteTranslation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  actualiteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'actualite_id',
    references: {
      model: 'actualites',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  language: {
    type: DataTypes.STRING(2),
    allowNull: false,
  },
  titre: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'actualite_translations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['actualite_id', 'language'],
      unique: true,
    },
    {
      fields: ['language'],
    },
  ],
});

export default ActualiteTranslation;
export { ActualiteTranslation };
