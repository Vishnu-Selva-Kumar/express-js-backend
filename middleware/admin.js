const HTTP_STATUS = require('#constants/httpStatus');
const Role = require('#models/Role');

/**
 * Admin Role Authorization Middleware
 * Ensures the authenticated user has the Administrator role (role_id = 1)
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Unauthorized: Authentication required.'
    });
  }

  if (req.user.role_id !== Role.ROLE_ADMINISTRATOR) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Forbidden: Admin access required.'
    });
  }

  next();
};

module.exports = admin;
