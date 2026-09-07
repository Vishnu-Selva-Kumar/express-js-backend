const bcrypt = require('bcrypt');
const User = require('#models/User');
const PasswordReset = require('#models/PasswordReset');
const Token = require('#models/Token');
const HTTP_STATUS = require('#constants/httpStatus');

class ResetPasswordController {
  /**
   * GET /api/verify-reset-token
   * Verify if a reset token is valid and unexpired
   */
  static async show(req, res) {
    try {
      const token = req.query.token || (req.body && req.body.token);
      const email = req.query.email || (req.body && req.body.email);

      const errors = {};
      if (!token) errors.token = 'The token field is required.';
      if (!email) errors.email = 'The email field is required.';

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed.',
          errors
        });
      }

      const resetRecord = await PasswordReset.findByTokenAndEmail(token, email);
      if (!resetRecord) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid or expired password reset token.'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset token is valid.',
        email,
        token
      });
    } catch (error) {
      console.error('VerifyResetToken error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  }

  /**
   * POST /api/reset-password
   * Reset the user password using a valid reset token
   */
  static async store(req, res) {
    try {
      const { email, token, password, password_confirmation } = req.body || {};

      // Input Validation
      const errors = {};
      if (!email) errors.email = 'The email field is required.';
      if (!token) errors.token = 'The token field is required.';
      if (!password) {
        errors.password = 'The password field is required.';
      } else if (password.length < 6) {
        errors.password = 'The password must be at least 6 characters.';
      }

      if (!password_confirmation) {
        errors.password_confirmation = 'The password confirmation field is required.';
      } else if (password && password !== password_confirmation) {
        errors.password_confirmation = 'The password confirmation does not match.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed.',
          errors
        });
      }

      // Verify token validity
      const resetRecord = await PasswordReset.findByTokenAndEmail(token, email);
      if (!resetRecord) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid or expired password reset token.'
        });
      }

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'We could not find a user with that email address.'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password in database
      await User.updatePassword(user.id, hashedPassword);

      // Invalidate used reset token
      await PasswordReset.deleteByEmail(email);

      // Revoke any previous auth tokens for security
      await Token.revokeAllForUser(user.id).catch(() => {});

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password has been successfully reset.'
      });
    } catch (error) {
      console.error('ResetPassword error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  }
}

module.exports = ResetPasswordController;
