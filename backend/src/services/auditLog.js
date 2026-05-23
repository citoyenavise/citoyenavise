/**
 * AuditLog Service
 * Helper centralisé pour journaliser les modifications dans elu_changelog
 * Phase G.2 - Lot 10
 *
 * Utilisation via Sequelize hooks (afterCreate, afterUpdate, afterDestroy)
 * ou appel direct depuis services / routes admin.
 */

import EluChangelog from '../models/EluChangelog.js';

/**
 * Champs ignorés (bruit : timestamps automatiques, compteurs internes)
 */
const CHAMPS_IGNORES = new Set([
  'createdAt',
  'updatedAt',
  'created_at',
  'updated_at',
  'deletedAt',
  'deleted_at',
]);

/**
 * Sérialise une valeur pour stockage TEXT
 */
function toLogValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/**
 * Identifie l'elu_id depuis une instance, selon le type d'entité
 */
function extractEluId(instance, entiteType) {
  if (entiteType === 'elu') return instance.id;
  if (instance.eluId !== undefined) return instance.eluId;
  if (instance.elu_id !== undefined) return instance.elu_id;
  return null;
}

/**
 * Logger une création d'entité
 */
export async function logCreate({
  entiteType,
  instance,
  source = 'manuel',
  modifiePar = null,
  sourceDetails = null,
}) {
  try {
    await EluChangelog.create({
      eluId: extractEluId(instance, entiteType),
      entiteType,
      entiteId: instance.id,
      action: 'create',
      source,
      sourceDetails,
      modifiePar,
      nouvelleValeur: JSON.stringify(instance.toJSON ? instance.toJSON() : instance),
    });
  } catch (err) {
    console.error('[auditLog] logCreate erreur :', err.message);
  }
}

/**
 * Logger une suppression d'entité
 */
export async function logDelete({
  entiteType,
  instance,
  source = 'manuel',
  modifiePar = null,
  sourceDetails = null,
}) {
  try {
    await EluChangelog.create({
      eluId: extractEluId(instance, entiteType),
      entiteType,
      entiteId: instance.id,
      action: 'delete',
      source,
      sourceDetails,
      modifiePar,
      ancienneValeur: JSON.stringify(instance.toJSON ? instance.toJSON() : instance),
    });
  } catch (err) {
    console.error('[auditLog] logDelete erreur :', err.message);
  }
}

/**
 * Logger une mise à jour : génère une ligne par champ modifié.
 * Utilise instance._previousDataValues vs instance.dataValues (Sequelize).
 */
export async function logUpdate({
  entiteType,
  instance,
  source = 'manuel',
  modifiePar = null,
  sourceDetails = null,
}) {
  try {
    const before = instance._previousDataValues || {};
    const after = instance.dataValues || {};

    const changements = [];
    const champsModifies = instance.changed ? instance.changed() : [];

    if (!champsModifies || champsModifies === false) return;

    for (const champ of champsModifies) {
      if (CHAMPS_IGNORES.has(champ)) continue;

      const ancien = toLogValue(before[champ]);
      const nouveau = toLogValue(after[champ]);
      if (ancien === nouveau) continue;

      changements.push({
        eluId: extractEluId(instance, entiteType),
        entiteType,
        entiteId: instance.id,
        action: 'update',
        champ,
        ancienneValeur: ancien,
        nouvelleValeur: nouveau,
        source,
        sourceDetails,
        modifiePar,
      });
    }

    if (changements.length > 0) {
      await EluChangelog.bulkCreate(changements);
    }
  } catch (err) {
    console.error('[auditLog] logUpdate erreur :', err.message);
  }
}

/**
 * Attache les hooks d'audit standard à un modèle Sequelize
 * Usage : attachAuditHooks(Elu, 'elu')
 */
export function attachAuditHooks(model, entiteType) {
  model.addHook('afterCreate', async (instance, options) => {
    await logCreate({
      entiteType,
      instance,
      source: options?.auditSource || 'manuel',
      modifiePar: options?.auditUserId || null,
      sourceDetails: options?.auditDetails || null,
    });
  });

  model.addHook('afterUpdate', async (instance, options) => {
    await logUpdate({
      entiteType,
      instance,
      source: options?.auditSource || 'manuel',
      modifiePar: options?.auditUserId || null,
      sourceDetails: options?.auditDetails || null,
    });
  });

  model.addHook('afterDestroy', async (instance, options) => {
    await logDelete({
      entiteType,
      instance,
      source: options?.auditSource || 'manuel',
      modifiePar: options?.auditUserId || null,
      sourceDetails: options?.auditDetails || null,
    });
  });
}

export default {
  logCreate,
  logUpdate,
  logDelete,
  attachAuditHooks,
};
