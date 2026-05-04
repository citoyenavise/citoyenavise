/**
 * Contrôleur authentification
 */

const { z } = require('zod');
const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

// Schémas de validation
const registerSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(8, 'Min 8 caractères').regex(/[A-Z]/, 'Une majuscule requise'),
  username: z.string().min(3, 'Min 3 caractères').max(50),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

/**
 * Inscription
 */
async function register(req, res) {
  const validated = registerSchema.parse(req.body);
  const result = await service.registerUser(validated);

  res.status(201).json({
    user: result.user,
    profile: result.profile,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

/**
 * Connexion
 */
async function login(req, res) {
  const validated = loginSchema.parse(req.body);
  const result = await service.loginUser(validated);

  res.status(200).json({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

/**
 * Utilisateur courant
 */
async function getMe(req, res) {
  const user = await service.getCurrentUser(req.user.userId);
  res.json(user);
}

/**
 * Rafraîchir le token
 */
async function refresh(req, res) {
  const validated = refreshSchema.parse(req.body);
  const result = await service.refreshAccessToken(validated.refreshToken);

  res.json({
    accessToken: result.accessToken,
  });
}

/**
 * Logout
 */
async function logout(req, res) {
  const { refreshToken } = req.body;
  await service.logout(refreshToken);

  res.json({ success: true });
}

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
};
