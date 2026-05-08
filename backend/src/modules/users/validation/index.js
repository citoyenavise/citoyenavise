const { z } = require('zod');

const updateUserRules = {
  email: z.string().email('Email invalide').optional(),
  username: z.string().min(3, 'Min 3 chars').max(50).optional(),
};

module.exports = {
  updateUserRules,
};
