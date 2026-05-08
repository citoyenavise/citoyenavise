
const service = require('../services/education.service');

async function getResources(req, res) {
  const resources = await service.getResources();
  res.apiSuccess('Resources retrieved', resources);
}

async function createResource(req, res) {
  const { title, content, level } = req.body;
  const resource = await service.createResource({ title, content, level });
  res.apiCreated('Resource created', resource);
}

module.exports = {
  getResources,
  createResource
};
