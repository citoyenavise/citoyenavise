/**
 * EmailVerification Model
 * Stocke les tokens de vérification email pour magic link
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const EmailVerification = sequelize.define(
  'EmailVerification',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    usedAt: {
      type: DataTypes.DATE,
      field: 'used_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at',
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    tableName: 'email_verifications',
    timestamps: false,
  }
);

export default EmailVerification;
