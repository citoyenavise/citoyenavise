/**
 * Media Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

const { authRequired } = require('../../core/middleware/auth');
const MediaController = require('./controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// Upload media
router.post('/', authRequired, upload.single('file'), MediaController.upload);

// Get media
router.get('/:id', MediaController.getMedia);

// Delete media
router.delete('/:id', authRequired, MediaController.deleteMedia);

module.exports = router;
