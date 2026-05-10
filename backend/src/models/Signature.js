/**
 * Signature Model
 * Représente les signatures de pétitions (idempotence garantie)
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Signature = sequelize.define(
  'Signature',
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
      unique: 'signature_unique',
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
      unique: 'signature_unique',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    tableName: 'signatures',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['petition_id', 'citoyen_id'],
      },
    ],
  }
);

export default Signature;
