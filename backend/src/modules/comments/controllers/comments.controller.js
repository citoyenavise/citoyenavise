
const service = require('../services/comments.service');

async function getComments(req, res) {
  const { targetId } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const comments = await service.getComments(targetId, parseInt(limit), parseInt(page));
  res.apiSuccess('Comments retrieved', comments);
}

async function createComment(req, res) {
  const { targetId } = req.params;
  const { content } = req.body;
  const comment = await service.createComment({ userId: req.user.id, targetId, content });
  res.apiCreated('Comment created', comment);
}

module.exports = {
  getComments,
  createComment
};
