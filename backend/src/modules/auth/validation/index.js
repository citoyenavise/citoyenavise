const { z } = require('zod');

const registerRules = {
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(8, 'Min 8 caractères').regex(/[A-Z]/, 'Une majuscule requise'),
  username: z.string().min(3, 'Min 3 caractères').max(50),
};

const loginRules = {
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(1, 'Password required'),
};

const refreshRules = {
  refreshToken: z.string('Refresh token required'),
};

module.exports = {
  registerRules,
  loginRules,
  refreshRules,
};
