/**
 * Admin Seed Route
 * Endpoint protege pour seeder les petitions Quebec ville en production.
 * Reutilisable Phase H (Levis, Saguenay, ...).
 *
 * Securite : protege par token statique ADMIN_SEED_TOKEN (env var Render).
 * Idempotent : findOrCreate sur titre / email.
 *
 * Usage prod :
 *   curl -X POST -H "Authorization: Bearer $ADMIN_SEED_TOKEN" \
 *     https://api.citoyenavise.org/api/v1/admin/seed-petitions
 */

import express from 'express';
import User from '../models/User.js';
import Elu from '../models/Elu.js';
import Petition from '../models/Petition.js';

const router = express.Router();

/**
 * Middleware : auth par token statique.
 * - 503 si ADMIN_SEED_TOKEN non configure cote serveur
 * - 401 si header Authorization absent ou token invalide
 */
function adminSeedAuth(req, res, next) {
  const expected = process.env.ADMIN_SEED_TOKEN;
  if (!expected) {
    return res.status(503).json({
      success: false,
      error: 'ADMIN_SEED_TOKEN non configure cote serveur',
    });
  }
  const header = req.headers.authorization || '';
  const provided = header.replace(/^Bearer\s+/i, '');
  if (!provided || provided !== expected) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou manquant',
    });
  }
  return next();
}

/**
 * Donnees seed Quebec ville
 */
const elusQuebec = [
  {
    nom: 'Marthe Belleville',
    titre: 'Depute',
    region: 'Quebec',
    niveau: 'federal',
    email: 'marthe.belleville@parl.gc.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Marthe+Belleville',
    siteWeb: 'https://marthe-belleville.ca',
    latitude: 46.8139,
    longitude: -71.208,
  },
  {
    nom: 'Sophie Goyette',
    titre: 'Depute',
    region: 'Quebec',
    niveau: 'provincial',
    email: 'sophie.goyette@assnat.qc.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Sophie+Goyette',
    siteWeb: 'https://sophiegoyette.ca',
    latitude: 46.8,
    longitude: -71.24,
  },
  {
    nom: 'Caroline Matte',
    titre: 'Conseiller',
    region: 'Quebec',
    niveau: 'municipal',
    email: 'cmatte@ville.quebec.qc.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Caroline+Matte',
    siteWeb: 'https://ville.quebec.qc.ca/conseillers',
    latitude: 46.82,
    longitude: -71.23,
  },
];

const petitionsQuebec = [
  {
    titre: 'Etendre le reseau de pistes cyclables securisees a Quebec',
    description:
      "Le reseau cyclable de Quebec ville est fragmente et incomplet. Les cyclistes ne peuvent pas se deplacer en toute securite entre les quartiers. Nous demandons a la Ville de Quebec d'investir dans la creation de pistes cyclables protegees, particulierement sur les axes Est-Ouest (Grande-Allee, Route de l'Eglise, Boulevard Hochelaga). Une infrastructure cyclable securisee encouragerait les deplacements actifs, reduirait la congestion automobile et ameliorerait la sante publique.",
    eluIndex: 0,
  },
  {
    titre: 'Ameliorer la frequence des autobus RTC en banlieue de Quebec',
    description:
      "Les citoyens des banlieues (Sainte-Foy, Sillery, Beauport) dependent du RTC pour se deplacer, mais la frequence des autobus est insuffisante. Attendre 30-40 minutes entre deux autobus decourage l'utilisation du transport en commun. Nous demandons a la Ville et au RTC d'augmenter la frequence des lignes de banlieue a au moins un autobus toutes les 15 minutes aux heures de pointe.",
    eluIndex: 1,
  },
  {
    titre:
      'Preserver les espaces verts du quartier Sainte-Foy contre la densification excessive',
    description:
      'Le quartier Sainte-Foy est menace par une densification immobiliere rapide et non planifiee. Les espaces verts disparaissent pour faire place a des immeubles residentiels de grande hauteur. Nous demandons a la Ville de Quebec de proteger les parcs et boises du secteur (Parc du Bois-de-Coulonge, etc.) en adoptant un plan de conservation des espaces naturels.',
    eluIndex: 2,
  },
];

/**
 * POST /seed-petitions
 * Insere (idempotent) le user systeme + 3 elus + 3 petitions Quebec ville.
 */
router.post('/seed-petitions', adminSeedAuth, async (req, res) => {
  try {
    // 1. User systeme (porteur des petitions seed)
    const [systemUser, sysCreated] = await User.findOrCreate({
      where: { email: 'system@citoyenavise.org' },
      defaults: {
        email: 'system@citoyenavise.org',
        nomComplet: 'Systeme Citoyen Avise',
        province: 'QC',
        codePostal: 'G1R 0A0',
      },
    });

    // 2. Elus Quebec (idempotent par email)
    const createdElus = [];
    for (const data of elusQuebec) {
      const [elu, created] = await Elu.findOrCreate({
        where: { email: data.email },
        defaults: data,
      });
      createdElus.push({ id: elu.id, nom: elu.nom, created });
    }

    // 3. Petitions Quebec (idempotent par titre)
    const createdPetitions = [];
    for (const data of petitionsQuebec) {
      const [petition, created] = await Petition.findOrCreate({
        where: { titre: data.titre },
        defaults: {
          titre: data.titre,
          description: data.description,
          citoyenId: systemUser.id,
          eluId: createdElus[data.eluIndex].id,
          status: 'published',
          signaturesCount: 0,
        },
      });
      createdPetitions.push({
        id: petition.id,
        titre: petition.titre,
        status: petition.status,
        created,
      });
    }

    return res.json({
      success: true,
      systemUser: {
        id: systemUser.id,
        email: systemUser.email,
        created: sysCreated,
      },
      elus: createdElus,
      petitions: createdPetitions,
      summary: {
        elus_created: createdElus.filter((e) => e.created).length,
        elus_existing: createdElus.filter((e) => !e.created).length,
        petitions_created: createdPetitions.filter((p) => p.created).length,
        petitions_existing: createdPetitions.filter((p) => !p.created).length,
      },
    });
  } catch (err) {
    console.error('Admin seed error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * DELETE /petitions/:id
 * Supprime une petition par son id (admin only, token-protected).
 * Idempotent : 404 si deja inexistante.
 *
 * Usage prod :
 *   curl -X DELETE -H "Authorization: Bearer $ADMIN_SEED_TOKEN" \
 *     https://api.citoyenavise.org/api/v1/admin/petitions/1
 */
router.delete('/petitions/:id', adminSeedAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID invalide (doit etre un entier positif)',
      });
    }
    const petition = await Petition.findByPk(id);
    if (!petition) {
      return res.status(404).json({
        success: false,
        error: `Petition id ${id} introuvable`,
      });
    }
    const snapshot = {
      id: petition.id,
      titre: petition.titre,
      status: petition.status,
    };
    await petition.destroy();
    return res.json({
      success: true,
      deleted: snapshot,
    });
  } catch (err) {
    console.error('Admin delete petition error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
