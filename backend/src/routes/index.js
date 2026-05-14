/**
 * Routes principales
 * Regroupe tous les endpoints de l'API
 */

import express from 'express';
import { getConfig, isDevelopment } from '../config/env.js';
import authRoutes from './auth.js';
import elusRoutes from './elus.js';
import circonscriptionsRoutes from './circonscriptions.js';
import petitionsRoutes from './petitions.js';
import eluCommitmentsRoutes from './elu-commitments.js';
import actualitesRoutes from './actualites.js';
// import postsRoutes from './posts.js'; // Non utilisé
import commentsRoutes from './comments.js';
// import publicDataRoutes from './public-data.js'; // Supprimé
import healthRoutes from './health.js';
import promisesRoutes from './promises.js';
// import gamificationRoutes from './gamification.js'; // Désactivé - services manquants
// import adminRoutes from './admin.js'; // Désactivé - modèles non essentiels
import adminSeedRoutes from './admin-seed.js';
// import civicTutorialsRoutes from './civic-tutorials.js'; // Désactivé - dépendances problématiques
import transparencyRoutes from './transparency.js';
// import usersRoutes from './users.js';
// import votesRoutes from './votes.js';

const router = express.Router();
const config = getConfig();

/**
 * Health check routes
 * GET /health → Full health status
 * GET /health/ready → Readiness probe (Kubernetes)
 * GET /health/live → Liveness probe (Kubernetes)
 */
router.use('/health', healthRoutes);

/**
 * GET /api/info
 * Informations sur l'API et le service
 */
router.get('/api/info', (req, res) => {
  res.json({
    project: 'Citoyen Avisé',
    description: 'Plateforme civique de participation citoyenne',
    version: config.API_VERSION,
    service: config.SERVICE_NAME,
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    ...(isDevelopment() && {
      note: 'API en développement - endpoints à venir',
    }),
  });
});

/**
 * Routes implémentées
 */

// Routes d'authentification (publiques)
router.use('/api/v1/auth', authRoutes);

// Routes publiques (pas d'authentification requise)
router.use('/api/v1/elus', elusRoutes);
router.use('/api/v1/circonscriptions', circonscriptionsRoutes);
router.use('/api/v1/petitions', petitionsRoutes);
router.use('/api/v1/elu-commitments', eluCommitmentsRoutes);
router.use('/api/v1/actualites', actualitesRoutes);
// router.use('/api/v1/public-data', publicDataRoutes); // Supprimé
router.use('/api/v1/promises', promisesRoutes);
// router.use('/api/v1/posts', postsRoutes); // Non utilisé
router.use('/api/v1/transparency', transparencyRoutes);
// router.use('/api/v1/gamification', gamificationRoutes); // Désactivé
// router.use('/api/v1/admin', adminRoutes); // Désactivé
router.use('/api/v1/admin', adminSeedRoutes);
// router.use('/api/v1/tutorials', civicTutorialsRoutes); // Désactivé
router.use('/api/v1', commentsRoutes);

/**
 * Routes avec noms français (aliases)
 * Redirection vers endpoints existants
 */
// /actualités → /actualites (idées/actualités des citoyens)
router.use('/api/v1/actualités', actualitesRoutes);

// /signatures → /petitions/*/sign (gestion des signatures)
// (inclus dans petitionsRoutes)

// /promesses → /elu-commitments (engagements/promesses des élus)
router.use('/api/v1/promesses', eluCommitmentsRoutes);

/**
 * Route de test (à supprimer en production)
 */
if (isDevelopment()) {
  router.get('/dev/test', (req, res) => {
    res.json({
      message: 'Endpoint de test',
      query: req.query,
      body: req.body,
    });
  });
}

export default router;
