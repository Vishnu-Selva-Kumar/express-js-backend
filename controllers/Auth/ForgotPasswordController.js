const crypto = require('crypto');
const User = require('../../models/User');
const PasswordReset = require('../../models/PasswordReset');
const HTTP_STATUS = require('../../constants/httpStatus');
const routes = require('../../routes/routeNames');
const mail = require('../../config/mail');

class ForgotPasswordController {
  /**
   * POST /api/forgot-password
   * Request a password reset link sent to email
   */
  static async store(req, res) {
    try {
      const { email } = req.body || {};

      // Input Validation
      const errors = {};
      if (!email) {
        errors.email = 'The email field is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'The email must be a valid email address.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed.',
          errors
        });
      }

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'We could not find a user with that email address.'
        });
      }

      // Generate a secure 64-character random hex token
      const token = crypto.randomBytes(32).toString('hex');

      // Persist token in password_resets table (expires in 60 minutes)
      await PasswordReset.create({
        user_id: user.id,
        email: user.email,
        token,
        expiresInMinutes: 60
      });

      // Generate verification / reset link using centralized routeNames helper
      const resetLink = routes.resetPasswordUrl(token, user.email);

      // Send transactional reset email
      await mail.sendTemplateEmail(
        'password-reset.html',
        {
          name: user.name,
          email: user.email,
          reset_link: resetLink,
          expires_in: 60
        },
        {
          to: user.email,
          subject: 'Reset Your Password'
        }
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password reset link sent to your email.'
      });
    } catch (error) {
      console.error('ForgotPassword error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  }
}

module.exports = ForgotPasswordController;
