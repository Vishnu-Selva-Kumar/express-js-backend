const HTTP_STATUS = require('../constants/httpStatus');

/**
 * Recursively find all supported HTTP methods for a path across router layers
 * @param {Object} router
 * @param {string} reqPath
 * @returns {Array<string>}
 */
function getAllowedMethods(router, reqPath) {
  let methods = [];

  (router.stack || []).forEach((layer) => {
    if (layer.route && layer.match(reqPath)) {
      Object.keys(layer.route.methods).forEach((method) => {
        methods.push(method.toUpperCase());
      });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      methods = methods.concat(getAllowedMethods(layer.handle, reqPath));
    }
  });

  return Array.from(new Set(methods));
}

/**
 * Handle 404 (Not Found) and 405 (Method Not Allowed) routes in JSON format
 * @param {import('express').Application} app
 * @returns {import('express').RequestHandler}
 */
function notFoundAndMethodNotAllowedHandler(app) {
  return (req, res) => {
    const router = app.router || app._router;
    const allowedMethods = router ? getAllowedMethods(router, req.path) : [];

    if (allowedMethods.length > 0) {
      res.setHeader('Allow', allowedMethods.join(', '));
      return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({
        message: 'Method not allowed.',
        allowed_methods: allowedMethods
      });
    }

    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: 'Route not found.'
    });
  };
}

/**
 * Global error handler middleware formatting errors in JSON
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid JSON payload.'
    });
  }

  console.error('Unhandled application error:', err);
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: 'Internal server error.'
  });
}

module.exports = {
  notFoundAndMethodNotAllowedHandler,
  errorHandler
};
