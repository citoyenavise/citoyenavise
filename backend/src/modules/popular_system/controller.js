/**
 * Popular System Controller — Version officielle
 * Gestion des contenus populaires avec scoring temporal
 */

const { PopularQuerySchema } = require('./schema');
const { PopularService } = require('./service');

const PopularController = {
  async getPopular(req, res) {
    const parse = PopularQuerySchema.safeParse(req.query);
    if (!parse.success) return res.status(400).json(parse.error);

    const data = await PopularService.getPopular(parse.data);
    return res.json(data);
  },
};

module.exports = PopularController;
