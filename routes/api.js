const express = require('express');
const router = express.Router();
const routes = require('./routeNames');
const LoginController = require('../controllers/Auth/LoginController');
const ProfileController = require('../controllers/ProfileController');
const auth = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');

// Public authentication routes
router.post(routes.api.login, LoginController.store);

// Authenticated profile routes
router.get(routes.api.profile, auth, ProfileController.show);
router.put(routes.api.profile, auth, uploadProfile.single('attachment'), ProfileController.update);

// Authenticated logout route
router.delete(routes.api.logout, auth, LoginController.delete);

module.exports = router;
