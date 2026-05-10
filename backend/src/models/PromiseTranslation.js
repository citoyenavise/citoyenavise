import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const PromiseTranslation = sequelize.define(
  'PromiseTranslation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    promiseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'promise_id',
      references: {
        model: 'promises',
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
  },
  {
    tableName: 'promise_translations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['promise_id', 'language'],
        unique: true,
      },
      {
        fields: ['language'],
      },
    ],
  }
);

export default PromiseTranslation;
export { PromiseTranslation };
