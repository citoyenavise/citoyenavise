const express = require('express');
const router = express.Router();
const controller = require('./controllers/ideas.controller');

router.get('/', (req, res, next) => controller.getAll(req, res, next));

module.exports = router;
