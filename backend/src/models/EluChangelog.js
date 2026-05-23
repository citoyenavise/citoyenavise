/**
 * EluChangelog Model
 * Journal d'audit des modifications sur les données élus
 * Phase G.2 - Lot 10
 *
 * Une ligne = un champ modifié (granularité fine) OU une création/suppression.
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const ENTITE_TYPES = [
  'elu',
  'promise',
  'action',
  'vote',
  'controverse',
  'donateur',
  'lien_interet',
  'mandat',
  'elu_comment',
];

const ACTIONS = ['create', 'update', 'delete'];

const SOURCES = [
  'manuel',
  'sync_ourcommons',
  'sync_openparl',
  'sync_sencanada',
  'sync_pm_gc',
  'sync_gg_ca',
  'sync_scc',
  'csv_import',
  'api_admin',
  'systeme',
  'autre',
];

const EluChangelog = sequelize.define(
  'EluChangelog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    eluId: {
      type: DataTypes.INTEGER,
      field: 'elu_id',
    },

    entiteType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'entite_type',
      validate: {
        isIn: [ENTITE_TYPES],
      },
    },
    entiteId: {
      type: DataTypes.INTEGER,
      field: 'entite_id',
    },

    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [ACTIONS],
      },
    },

    champ: {
      type: DataTypes.STRING(100),
    },
    ancienneValeur: {
      type: DataTypes.TEXT,
      field: 'ancienne_valeur',
    },
    nouvelleValeur: {
      type: DataTypes.TEXT,
      field: 'nouvelle_valeur',
    },

    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'manuel',
      validate: {
        isIn: [SOURCES],
      },
    },
    sourceDetails: {
      type: DataTypes.JSONB,
      field: 'source_details',
    },

    modifiePar: {
      type: DataTypes.INTEGER,
      field: 'modifie_par',
    },
    modifieLe: {
      type: DataTypes.DATE,
      field: 'modifie_le',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'elu_changelog',
    timestamps: false,
  }
);

export { ENTITE_TYPES, ACTIONS, SOURCES };
export default EluChangelog;
