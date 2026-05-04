/**
 * Contrôleur utilisateurs
 */

const { z } = require('zod');
const usersService = require('./service');

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
});

async function getUser(req, res) {
  const { id } = req.params;
  const user = await usersService.getUserById(id);
  res.json(user);
}

async function updateUser(req, res) {
  const { id } = req.params;
  const validated = updateUserSchema.parse(req.body);
  const user = await usersService.updateUser(id, validated, req.user.userId);
  res.json(user);
}

async function deleteUser(req, res) {
  const { id } = req.params;
  await usersService.deleteUser(id, req.user.userId);
  res.status(204).send();
}

module.exports = {
  getUser,
  updateUser,
  deleteUser,
};
