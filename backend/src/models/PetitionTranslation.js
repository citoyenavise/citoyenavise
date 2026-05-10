import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const PetitionTranslation = sequelize.define('PetitionTranslation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  petitionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'petition_id',
    references: {
      model: 'petitions',
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'petition_translations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['petition_id', 'language'],
      unique: true,
    },
    {
      fields: ['language'],
    },
  ],
});

export default PetitionTranslation;
export { PetitionTranslation };
