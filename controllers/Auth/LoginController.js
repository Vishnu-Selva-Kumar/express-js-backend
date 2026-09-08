const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('#models/User');
const Token = require('#models/Token');
const HTTP_STATUS = require('#constants/httpStatus');

class LoginController {
  /**
   * POST /api/login
   * Resource method: store (authenticate user, issue JWT, store in tokens table)
   */
  static async store(req, res) {
    try {
      const { email, password } = req.body || {};

      // Input Validation
      const errors = {};
      if (!email) errors.email = 'The email field is required.';
      if (!password) errors.password = 'The password field is required.';

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Validation failed.',
          errors
        });
      }

      // Check user existence
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          message: 'Invalid email or password.'
        });
      }

      // Verify bcrypt password hash
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT with unique identifier
      const token = jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id, jti: `${Date.now()}-${Math.round(Math.random() * 1e9)}` },
        process.env.JWT_SECRET || 'super_secret_jwt_key_here',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Persist token in tokens table with user_id
      await Token.create({
        user_id: user.id,
        token,
        name: 'auth_token'
      });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role_id: user.role_id,
          role_name: user.role_name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error.'
      });
    }
  }

  /**
   * DELETE /api/logout
   * Resource method: delete / destroy (revoke token from tokens table)
   */
  static async delete(req, res) {
    try {
      if (req.token) {
        await Token.revoke(req.token);
      }
      return res.status(HTTP_STATUS.OK).json({
        message: 'Successfully logged out.'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error.'
      });
    }
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return LoginController.delete(req, res);
  }
}

module.exports = LoginController;
