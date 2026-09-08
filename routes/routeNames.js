/**
 * Application Route URLs and Endpoints
 * Centralized mapping for route paths used across route declarations and test suites.
 */
const routes = Object.freeze({
  api: Object.freeze({
    login: '/api/login',
    register: '/api/register',
    verifyEmail: '/api/verify-email',
    verifyPhone: '/api/verify-phone',
    forgotPassword: '/api/forgot-password',
    verifyResetToken: '/api/verify-reset-token',
    resetPassword: '/api/reset-password',
    profile: '/api/profile',
    logout: '/api/logout',

    // Admin Catalog endpoints
    admin: Object.freeze({
      categories: '/api/admin/categories',
      category: '/api/admin/categories/:id',
      subCategories: '/api/admin/subcategories',
      subCategory: '/api/admin/subcategories/:id',
      authors: '/api/admin/authors',
      author: '/api/admin/authors/:id',
      publishers: '/api/admin/publishers',
      publisher: '/api/admin/publishers/:id',
      languages: '/api/admin/languages',
      language: '/api/admin/languages/:id',
    }),
  }),

  web: Object.freeze({
    home: '/',
    media: '/media/:id/{*path}',
  }),

  /**
   * Helper functions for dynamic/parameterized Admin Catalog URLs
   */
  adminCategoryUrl: (id) => `/api/admin/categories/${id}`,
  adminSubCategoryUrl: (id) => `/api/admin/subcategories/${id}`,
  adminAuthorUrl: (id) => `/api/admin/authors/${id}`,
  adminPublisherUrl: (id) => `/api/admin/publishers/${id}`,
  adminLanguageUrl: (id) => `/api/admin/languages/${id}`,

  /**
   * Generate media stream URL
   * @param {number|string} id Attachment ID
   * @param {string} path Relative storage path
   * @returns {string}
   */
  mediaUrl: (id, path) => `/media/${id}/${path}`,

  /**
   * Generate password reset verification URL
   * @param {string} token
   * @param {string} email
   * @returns {string}
   */
  resetPasswordUrl: (token, email) => {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  },

  /**
   * Generate email verification URL
   * @param {string} token
   * @param {string} email
   * @returns {string}
   */
  verifyEmailUrl: (token, email) => {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  },
});

module.exports = routes;
