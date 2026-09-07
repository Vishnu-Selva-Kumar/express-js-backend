const jwt = require('jsonwebtoken');
const User = require('#models/User');
const Otp = require('#models/Otp');
const HTTP_STATUS = require('#constants/httpStatus');

class VerificationController {
  /**
   * GET /api/verify-email
   * Verify user's email address using token
   */
  static async verifyEmail(req, res) {
    try {
      const token = req.query.token || (req.body && req.body.token);

      if (!token) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Verification token is required.',
          errors: { token: 'The token field is required.' }
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_here');
      } catch (err) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid or expired verification token.'
        });
      }

      if (decoded.type !== 'email_verification' || !decoded.id) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: 'Invalid verification token type.'
        });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'User not found.'
        });
      }

      if (user.email_verified_at) {
        return res.status(HTTP_STATUS.OK).json({
          message: 'Email has already been verified.'
        });
      }

      await User.markEmailAsVerified(user.id);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Email verified successfully.'
      });
    } catch (error) {
      console.error('VerifyEmail error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error.'
      });
    }
  }

  /**
   * POST /api/verify-phone
   * Verify user's phone number using OTP
   */
  static async verifyPhone(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { email, phone, otp } = req.body || {};

      let targetUser;

      if (userId) {
        targetUser = await User.findById(userId);
      } else if (email) {
        targetUser = await User.findByEmail(email);
      } else {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Validation failed.',
          errors: { email: 'The email field is required when unauthenticated.' }
        });
      }

      if (!targetUser) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'User not found.'
        });
      }

      // If OTP is provided, validate format and verify against otps table
      if (otp !== undefined && otp !== null) {
        const otpStr = String(otp).trim();
        if (!/^\d{4,6}$/.test(otpStr)) {
          return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            message: 'Validation failed.',
            errors: { otp: 'The OTP must be 4 to 6 digits.' }
          });
        }

        const isValidOtp = await Otp.verify({ user_id: targetUser.id, otp: otpStr });
        if (!isValidOtp) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Invalid or expired OTP.'
          });
        }
      }

      // If phone was provided and differs from stored phone, update it
      if (phone && phone !== targetUser.phone) {
        await User.update(targetUser.id, { phone });
      }

      await User.markPhoneAsVerified(targetUser.id);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Phone verified successfully.'
      });
    } catch (error) {
      console.error('VerifyPhone error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error.'
      });
    }
  }
}

module.exports = VerificationController;
