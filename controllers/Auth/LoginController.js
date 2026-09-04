const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { blacklistToken } = require('../../middleware/blacklist');

class LoginController {
  /**
   * POST /api/login
   * Resource method: store (create authenticated session)
   */
  static async store(req, res) {
    try {
      const { email, password } = req.body || {};

      // Input Validation
      const errors = {};
      if (!email) errors.email = 'The email field is required.';
      if (!password) errors.password = 'The password field is required.';

      if (Object.keys(errors).length > 0) {
        return res.status(422).json({
          message: 'Validation failed.',
          errors
        });
      }

      // Check user existence
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password.'
        });
      }

      // Verify bcrypt password hash
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role_id: user.role_id },
        process.env.JWT_SECRET || 'super_secret_jwt_key_here',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      return res.status(200).json({
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
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  /**
   * DELETE /api/logout
   * Resource method: delete / destroy (delete authenticated session)
   */
  static async delete(req, res) {
    blacklistToken(req.token);
    return res.status(200).json({
      message: 'Successfully logged out.'
    });
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return LoginController.delete(req, res);
  }
}

module.exports = LoginController;
