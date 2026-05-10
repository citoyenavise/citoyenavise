/**
 * Routes principales
 * Regroupe tous les endpoints de l'API
 */

import express from 'express';
import { getConfig, isDevelopment } from '../config/env.js';
import elusRoutes from './elus.js';
import circonscriptionsRoutes from './circonscriptions.js';
// import authRoutes from './auth.js';
// import usersRoutes from './users.js';
// import postsRoutes from './posts.js';
// import votesRoutes from './votes.js';

const router = express.Router();
const config = getConfig();

/**
 * GET /health
 * Endpoint de santé pour les health checks (Render, monitoring, etc.)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: config.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

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

// Routes publiques (pas d'authentification requise)
router.use('/api/v1/elus', elusRoutes);
router.use('/api/v1/circonscriptions', circonscriptionsRoutes);

/**
 * Routes à implémenter
 */
// router.use('/api/v1/auth', authRoutes);     // Authentification (magic link / OTP)
// router.use('/api/v1/users', usersRoutes);   // Profils citoyens
// router.use('/api/v1/posts', postsRoutes);   // Posts & idées
// router.use('/api/v1/votes', votesRoutes);   // Votes & sondages
// router.use('/api/v1/profiles', profilesRoutes); // Profils publics
// router.use('/api/v1/initiatives', initiativesRoutes); // Initiatives citoyennes

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
