const express = require('express');
const router = express.Router();
const routes = require('#routes/routeNames');
const LoginController = require('#controllers/Auth/LoginController');
const RegisterController = require('#controllers/Auth/RegisterController');
const VerificationController = require('#controllers/Auth/VerificationController');
const ForgotPasswordController = require('#controllers/Auth/ForgotPasswordController');
const ResetPasswordController = require('#controllers/Auth/ResetPasswordController');
const ProfileController = require('#controllers/ProfileController');
const CategoryController = require('#controllers/CategoryController');
const SubCategoryController = require('#controllers/SubCategoryController');
const AuthorController = require('#controllers/AuthorController');
const PublisherController = require('#controllers/PublisherController');
const LanguageController = require('#controllers/LanguageController');
const auth = require('#middleware/auth');
const admin = require('#middleware/admin');
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

// Admin Book Shopping Catalog CRUD routes
// Categories
router.get(routes.api.admin.categories, auth, admin, CategoryController.index);
router.post(routes.api.admin.categories, auth, admin, CategoryController.store);
router.get(routes.api.admin.category, auth, admin, CategoryController.show);
router.put(routes.api.admin.category, auth, admin, CategoryController.update);
router.delete(routes.api.admin.category, auth, admin, CategoryController.delete);

// Subcategories
router.get(routes.api.admin.subCategories, auth, admin, SubCategoryController.index);
router.post(routes.api.admin.subCategories, auth, admin, SubCategoryController.store);
router.get(routes.api.admin.subCategory, auth, admin, SubCategoryController.show);
router.put(routes.api.admin.subCategory, auth, admin, SubCategoryController.update);
router.delete(routes.api.admin.subCategory, auth, admin, SubCategoryController.delete);

// Authors
router.get(routes.api.admin.authors, auth, admin, AuthorController.index);
router.post(routes.api.admin.authors, auth, admin, AuthorController.store);
router.get(routes.api.admin.author, auth, admin, AuthorController.show);
router.put(routes.api.admin.author, auth, admin, AuthorController.update);
router.delete(routes.api.admin.author, auth, admin, AuthorController.delete);

// Publishers
router.get(routes.api.admin.publishers, auth, admin, PublisherController.index);
router.post(routes.api.admin.publishers, auth, admin, PublisherController.store);
router.get(routes.api.admin.publisher, auth, admin, PublisherController.show);
router.put(routes.api.admin.publisher, auth, admin, PublisherController.update);
router.delete(routes.api.admin.publisher, auth, admin, PublisherController.delete);

// Languages
router.get(routes.api.admin.languages, auth, admin, LanguageController.index);
router.post(routes.api.admin.languages, auth, admin, LanguageController.store);
router.get(routes.api.admin.language, auth, admin, LanguageController.show);
router.put(routes.api.admin.language, auth, admin, LanguageController.update);
router.delete(routes.api.admin.language, auth, admin, LanguageController.delete);

module.exports = router;
