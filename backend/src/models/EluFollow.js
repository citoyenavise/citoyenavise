/**
 * EluFollow Model
 * Représente l'abonnement d'un citoyen à un élu (bouton "Suivre")
 * Phase G.2 - Lot 8
 *
 * Clé primaire composite (user_id, elu_id).
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const EluFollow = sequelize.define(
  'EluFollow',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    eluId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'elu_id',
    },

    notifPromesse: {
      type: DataTypes.BOOLEAN,
      field: 'notif_promesse',
      defaultValue: true,
    },
    notifAction: {
      type: DataTypes.BOOLEAN,
      field: 'notif_action',
      defaultValue: true,
    },
    notifVote: {
      type: DataTypes.BOOLEAN,
      field: 'notif_vote',
      defaultValue: false,
    },
    notifControverse: {
      type: DataTypes.BOOLEAN,
      field: 'notif_controverse',
      defaultValue: true,
    },
    notifFinMandat: {
      type: DataTypes.BOOLEAN,
      field: 'notif_fin_mandat',
      defaultValue: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
  },
  {
    tableName: 'elu_follows',
    timestamps: false,
  }
);

export default EluFollow;
