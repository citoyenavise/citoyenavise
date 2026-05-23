/**
 * Routes Réseau (Network Snapshot)
 *
 * GET /api/v1/network/snapshot
 *   Retourne un instantané des compteurs principaux du réseau,
 *   décomposé en deux scopes parallèles : Québec (pilote) et Canada (global).
 *
 * Aucune donnée mockée : tous les chiffres viennent de COUNT directs sur la BD.
 * Conformément au conseil opérateur (Lot 3) : « pas de stat sans endpoint ».
 *
 * Cible : alimenter le composant <NetworkSidebar /> de MapPage.
 */

import express from 'express';
import { Op } from 'sequelize';
import User from '../models/User.js';
import Elu from '../models/Elu.js';
import Petition from '../models/Petition.js';
import Signature from '../models/Signature.js';

const router = express.Router();

/**
 * Liste exacte des régions considérées « Québec ville » pour le scope pilote.
 * Évolutif : ajouter Lévis/Saguenay/Trois-Rivières en Phase H si extension.
 */
const QUEBEC_REGIONS = ['Québec', 'Quebec'];
const QUEBEC_PROVINCES = ['QC'];

/**
 * Récupère les compteurs pour un scope donné.
 * @param {object} eluWhere - clause WHERE Sequelize pour le filtre élus (vide = global)
 * @param {object} userWhere - clause WHERE Sequelize pour le filtre users (vide = global)
 */
async function getSnapshot(eluWhere, userWhere) {
  // 1. Compter les élus du scope
  const elusCount = await Elu.count({ where: eluWhere });

  // 2. Récupérer les IDs des élus du scope (pour filtrer pétitions/signatures)
  const elusIds =
    Object.keys(eluWhere).length > 0
      ? (await Elu.findAll({ where: eluWhere, attributes: ['id'] })).map(
          (e) => e.id
        )
      : null; // null = tous

  // 3. Compter les pétitions publiées (filtrées par scope si applicable)
  const petitionsWhere = { status: 'published' };
  if (elusIds !== null) {
    if (elusIds.length === 0) {
      // Aucun élu dans le scope → 0 pétitions
      return {
        elus: elusCount,
        petitions: 0,
        signatures: 0,
        users: await User.count({ where: userWhere }),
      };
    }
    petitionsWhere.eluId = { [Op.in]: elusIds };
  }
  const petitionsCount = await Petition.count({ where: petitionsWhere });

  // 4. Compter les signatures du scope
  let signaturesCount = 0;
  if (elusIds === null) {
    // Global : toutes les signatures
    signaturesCount = await Signature.count();
  } else if (elusIds.length > 0) {
    // Scope : signatures dont la pétition a un eluId dans elusIds
    const petitions = await Petition.findAll({
      where: { eluId: { [Op.in]: elusIds } },
      attributes: ['id'],
    });
    const petitionIds = petitions.map((p) => p.id);
    if (petitionIds.length > 0) {
      signaturesCount = await Signature.count({
        where: { petitionId: { [Op.in]: petitionIds } },
      });
    }
  }

  // 5. Compter les utilisateurs du scope (filtre province)
  const usersCount = await User.count({ where: userWhere });

  return {
    elus: elusCount,
    petitions: petitionsCount,
    signatures: signaturesCount,
    users: usersCount,
  };
}

/**
 * GET /api/v1/network/snapshot
 *
 * Réponse :
 * {
 *   success: true,
 *   data: {
 *     canada: { elus, petitions, signatures, users },
 *     quebec: { elus, petitions, signatures, users }
 *   },
 *   generated_at: ISO string
 * }
 *
 * Pas de pagination, pas de filtres query. Cache friendly.
 */
router.get('/snapshot', async (req, res, next) => {
  try {
    // Scope Canada = aucun filtre (tout)
    const canada = await getSnapshot({}, {});

    // Scope Québec = élus avec region IN QUEBEC_REGIONS + users avec province IN QUEBEC_PROVINCES
    const quebec = await getSnapshot(
      { region: { [Op.in]: QUEBEC_REGIONS } },
      { province: { [Op.in]: QUEBEC_PROVINCES } }
    );

    res.json({
      success: true,
      data: { canada, quebec },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
