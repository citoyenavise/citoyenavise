/**
 * Notifications Controller
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { markReadSchema, paginationSchema } = require('./schema');

module.exports = {
  async list(req, res) {
    const validation = paginationSchema.safeParse(req.query);
    if (!validation.success) throw new AppError('Paramètres invalides', 400);

    const { page, limit } = validation.data;
    const notifications = await service.list(req.user.userId, page, limit);

    res.json(notifications);
  },

  async markAsRead(req, res) {
    const validation = markReadSchema.safeParse(req.params);
    if (!validation.success) throw new AppError('Paramètres invalides', 400);

    const { id } = validation.data;
    await service.markAsRead(id, req.user.userId);

    res.status(204).send();
  },

  async markAllAsRead(req, res) {
    await service.markAllAsRead(req.user.userId);
    res.status(204).send();
  },
};
