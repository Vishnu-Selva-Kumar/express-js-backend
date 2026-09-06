const express = require('express');
const router = express.Router();
const LoginController = require('../controllers/Auth/LoginController');
const ProfileController = require('../controllers/ProfileController');
const auth = require('../middleware/auth');

// Public authentication routes
router.post('/login', LoginController.store);

// Authenticated routes
router.get('/profile', auth, ProfileController.show);
router.delete('/logout', auth, LoginController.delete);

module.exports = router;
