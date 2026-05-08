
const service = require('../services/content.service');

async function getContent(req, res) {
  const { id } = req.params;
  const content = await service.getContent(id);
  res.apiSuccess('Content retrieved', content);
}

async function createContent(req, res) {
  const { title, description, type } = req.body;
  const content = await service.createContent({ title, description, type });
  res.apiCreated('Content created', content);
}

module.exports = {
  getContent,
  createContent
};
