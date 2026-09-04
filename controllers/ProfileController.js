class ProfileController {
  /**
   * GET /api/profile
   * Resource method: show (display authenticated user profile)
   */
  static async show(req, res) {
    return res.status(200).json({
      user: req.user
    });
  }

  // Alias for index method
  static async index(req, res) {
    return ProfileController.show(req, res);
  }
}

module.exports = ProfileController;
