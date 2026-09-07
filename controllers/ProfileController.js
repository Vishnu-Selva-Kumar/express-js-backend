const path = require('path');
const HTTP_STATUS = require('#constants/httpStatus');
const User = require('#models/User');
const Attachment = require('#models/Attachment');
const { ATTACHABLE_TYPE, ATTACHMENT_FOR, ATTACHMENT_DESTINATIONS } = require('#constants/attachment');

class ProfileController {
  /**
   * GET /api/profile
   * Resource method: show (display authenticated user profile with attachment)
   */
  static async show(req, res) {
    const attachment = await Attachment.findLatest(
      ATTACHABLE_TYPE.USER,
      req.user.id,
      ATTACHMENT_FOR.USER.PROFILE
    );

    const formattedAttachment = Attachment.formatWithUrl(attachment, req);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile details.',
      user: {
        ...req.user,
        attachment: formattedAttachment
      }
    });
  }

  /**
   * PUT /api/profile
   * Resource method: update (update profile details and optional attachment file)
   */
  static async update(req, res) {
    try {
      let updatedUser = req.user;

      // Update basic fields if provided
      if (req.body && (req.body.name || req.body.phone)) {
        updatedUser = await User.update(req.user.id, {
          name: req.body.name,
          phone: req.body.phone
        });
      }

      // Handle file attachment upload if file is present
      if (req.file) {
        // Remove previous profile attachment and unlink old file from disk
        await Attachment.deleteByAttachable(
          ATTACHABLE_TYPE.USER,
          req.user.id,
          ATTACHMENT_FOR.USER.PROFILE,
          true
        );

        // Calculate relative file path using profile storage destination
        const destFolder = ATTACHMENT_DESTINATIONS.PROFILES || 'storage/app/profiles';
        const relativePath = path.join(destFolder, req.file.filename).replace(/\\/g, '/');

        await Attachment.create({
          attachable_type: ATTACHABLE_TYPE.USER,
          attachable_id: req.user.id,
          attachment_for: ATTACHMENT_FOR.USER.PROFILE,
          file_name: req.file.originalname,
          file_path: relativePath,
          file_type: req.file.mimetype,
          file_size: req.file.size
        });
      }

      const attachment = await Attachment.findLatest(
        ATTACHABLE_TYPE.USER,
        req.user.id,
        ATTACHMENT_FOR.USER.PROFILE
      );

      const formattedAttachment = Attachment.formatWithUrl(attachment, req);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          ...updatedUser,
          attachment: formattedAttachment
        }
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Failed to update profile.'
      });
    }
  }

  // Alias for index method
  static async index(req, res) {
    return ProfileController.show(req, res);
  }
}

module.exports = ProfileController;
