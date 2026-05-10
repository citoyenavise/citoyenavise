import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Translation = sequelize.define('Translation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  fr: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  en: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'translations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Translation;
export { Translation };
