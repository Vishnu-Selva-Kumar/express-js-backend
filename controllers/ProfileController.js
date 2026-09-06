const HTTP_STATUS = require('../constants/httpStatus');

class ProfileController {
  /**
   * GET /api/profile
   * Resource method: show (display authenticated user profile)
   */
  static async show(req, res) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile details.',
      user: req.user
    });
  }

  // Alias for index method
  static async index(req, res) {
    return ProfileController.show(req, res);
  }
}

module.exports = ProfileController;
