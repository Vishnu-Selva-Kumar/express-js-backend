const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isTokenBlacklisted } = require('./blacklist');

/**
 * Authentication Middleware
 * Validates JWT Bearer token, checks blacklist, and verifies user exists
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'Unauthorized: Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_here');

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found or inactive' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = auth;
