const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Attachment = require('#models/Attachment');
const User = require('#models/User');
const Token = require('#models/Token');
const HTTP_STATUS = require('#constants/httpStatus');
const { PUBLIC_ATTACHMENT_TYPES } = require('#constants/attachment');

class AttachmentController {
  /**
   * GET /media/:id/:path
   * Stream / serve attachment file matching Laravel media logic
   */
  static async index(req, res) {
    try {
      const { id } = req.params;
      const attachment = await Attachment.findById(id);

      if (!attachment) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Attachment not found.'
        });
      }

      // Extract requested path from params or url
      let requestedPath = req.params.path || req.params[0];
      if (Array.isArray(requestedPath)) {
        requestedPath = requestedPath.join('/');
      } else if (!requestedPath) {
        const parts = req.url.split(`/media/${id}/`);
        if (parts.length > 1) {
          requestedPath = parts[1].split('?')[0];
        }
      }

      // Normalize path strings for comparison (remove leading/trailing slashes and decode)
      const normalize = (p) => decodeURIComponent(p || '').replace(/^\/+|\/+$/g, '');
      if (normalize(attachment.file_path) !== normalize(requestedPath)) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Attachment not found.'
        });
      }

      // Resolve file path on disk
      let filePath = path.resolve(process.cwd(), attachment.file_path);
      if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
        const altPathApp = path.resolve(process.cwd(), 'storage/app', attachment.file_path);
        const altPathStorage = path.resolve(process.cwd(), 'storage', attachment.file_path);

        if (fs.existsSync(altPathApp) && fs.lstatSync(altPathApp).isFile()) {
          filePath = altPathApp;
        } else if (fs.existsSync(altPathStorage) && fs.lstatSync(altPathStorage).isFile()) {
          filePath = altPathStorage;
        } else {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'File not found on disk.'
          });
        }
      }

      // Publicly accessible attachments check (e.g. avatar, public assets)
      const publicAttachmentTypes = PUBLIC_ATTACHMENT_TYPES;
      if (publicAttachmentTypes.includes(Number(attachment.attachment_for))) {
        return res.sendFile(filePath);
      }

      // Protected attachments check: verify user authentication
      let user = req.user;
      if (!user && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const tokenStr = req.headers.authorization.split(' ')[1];
        const tokenRecord = await Token.findValidToken(tokenStr);
        if (tokenRecord) {
          try {
            const decoded = jwt.verify(tokenStr, process.env.JWT_SECRET || 'super_secret_jwt_key_here');
            user = await User.findById(decoded.id);
          } catch {
            // Token invalid or expired
          }
        }
      }

      if (!user) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Unauthorized access.'
        });
      }

      const isAdmin = user.role_id === 1 || user.role_name === 'Administrator';
      const isOwner = (attachment.attachable_type === 'User' && Number(attachment.attachable_id) === Number(user.id)) ||
                      (attachment.user_id && Number(attachment.user_id) === Number(user.id));

      if (isAdmin || isOwner) {
        return res.sendFile(filePath);
      }

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Unauthorized access.'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = AttachmentController;
