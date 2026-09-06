/**
 * Application Route URLs and Endpoints
 * Centralized mapping for route paths used across route declarations and test suites.
 */
const routes = Object.freeze({
  api: Object.freeze({
    login: '/api/login',
    profile: '/api/profile',
    logout: '/api/logout',
  }),

  web: Object.freeze({
    media: '/media/:id/{*path}',
  }),

  /**
   * Generate media stream URL
   * @param {number|string} id Attachment ID
   * @param {string} path Relative storage path
   * @returns {string}
   */
  mediaUrl: (id, path) => `/media/${id}/${path}`,
});

module.exports = routes;
