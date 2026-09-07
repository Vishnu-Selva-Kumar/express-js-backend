const express = require('express');
const router = express.Router();
const routes = require('#routes/routeNames');
const LoginController = require('#controllers/Auth/LoginController');
const RegisterController = require('#controllers/Auth/RegisterController');
const VerificationController = require('#controllers/Auth/VerificationController');
const ForgotPasswordController = require('#controllers/Auth/ForgotPasswordController');
const ResetPasswordController = require('#controllers/Auth/ResetPasswordController');
const ProfileController = require('#controllers/ProfileController');
const auth = require('#middleware/auth');
const { uploadProfile } = require('#middleware/upload');

// Public authentication & registration routes
router.post(routes.api.login, LoginController.store);
router.post(routes.api.register, RegisterController.store);

// Verification routes
router.get(routes.api.verifyEmail, VerificationController.verifyEmail);
router.post(routes.api.verifyPhone, VerificationController.verifyPhone);

// Password reset routes
router.post(routes.api.forgotPassword, ForgotPasswordController.store);
router.get(routes.api.verifyResetToken, ResetPasswordController.show);
router.post(routes.api.resetPassword, ResetPasswordController.store);

// Authenticated profile routes
router.get(routes.api.profile, auth, ProfileController.show);
router.put(routes.api.profile, auth, uploadProfile.single('attachment'), ProfileController.update);

// Authenticated logout route
router.delete(routes.api.logout, auth, LoginController.delete);

module.exports = router;
