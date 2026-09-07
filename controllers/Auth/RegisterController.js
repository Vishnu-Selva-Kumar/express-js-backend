const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Role = require('../../models/Role');
const HTTP_STATUS = require('../../constants/httpStatus');
const routes = require('../../routes/routeNames');
const mail = require('../../config/mail');

class RegisterController {
  /**
   * POST /api/register
   * Register a new user and dispatch a Welcome email with verification link
   */
  static async store(req, res) {
    try {
      const { name, email, phone, password, password_confirmation } = req.body || {};

      // Input Validation
      const errors = {};
      if (!name) errors.name = 'The name field is required.';
      if (!email) {
        errors.email = 'The email field is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'The email must be a valid email address.';
      }

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
          message: 'Validation failed.',
          errors
        });
      }

      // Check if email already registered
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          message: 'The email has already been taken.'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user using Role model constant declaration
      const user = await User.create({
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role_id: Role.ROLE_USER
      });

      // Generate signed email verification token (valid for 48 hours)
      const verificationToken = jwt.sign(
        { id: user.id, email: user.email, type: 'email_verification' },
        process.env.JWT_SECRET || 'super_secret_jwt_key_here',
        { expiresIn: '48h' }
      );

      // Generate verification link using centralized routes helper
      const verificationLink = routes.verifyEmailUrl(verificationToken, user.email);

      // Dispatch Welcome Email
      await mail.sendTemplateEmail(
        'welcome.html',
        {
          name: user.name,
          email: user.email,
          verification_link: verificationLink
        },
        {
          to: user.email,
          subject: `Welcome to ${process.env.MAIL_FROM_NAME || 'My Application'}!`
        }
      );

      return res.status(HTTP_STATUS.CREATED).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id,
          role_name: user.role_name
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error.'
      });
    }
  }
}

module.exports = RegisterController;
