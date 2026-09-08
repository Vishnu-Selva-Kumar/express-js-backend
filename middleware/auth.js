const jwt = require('jsonwebtoken');
const User = require('#models/User');
const Token = require('#models/Token');
const HTTP_STATUS = require('#constants/httpStatus');

/**
 * Authentication Middleware
 * Validates JWT Bearer token against database-stored tokens and verifies user exists
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized: No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Check database token validity
    const tokenRecord = await Token.findValidToken(token);
    if (!tokenRecord) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized: Invalid or revoked token.'
      });
    }

    // Verify JWT signature & expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_here');

    // Verify user exists and is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized: User not found or inactive'
      });
    }

    req.user = user;
    req.token = token;
    req.tokenRecord = tokenRecord;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized: Token expired'
      });
    }
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Unauthorized: Invalid token'
    });
  }
};

module.exports = auth;
