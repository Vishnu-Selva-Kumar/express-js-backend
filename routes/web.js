const express = require('express');
const router = express.Router();
const routes = require('./routeNames');
const AttachmentController = require('../controllers/AttachmentController');

// Media streaming route
router.get(routes.web.media, AttachmentController.index);

module.exports = router;
