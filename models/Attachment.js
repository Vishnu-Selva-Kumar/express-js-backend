const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const routes = require('../routes/routeNames');

class Attachment {
  /**
   * Create a new attachment record
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [id] = await db('attachments').insert({
      attachable_type: data.attachable_type,
      attachable_id: data.attachable_id,
      attachment_for: data.attachment_for,
      file_name: data.file_name,
      file_path: data.file_path,
      file_type: data.file_type,
      file_size: data.file_size
    });

    return Attachment.findById(id);
  }

  /**
   * Find attachment by ID
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async findById(id) {
    return db('attachments').where({ id }).first();
  }

  /**
   * Find all attachments for an attachable entity
   * @param {string} attachableType
   * @param {number} attachableId
   * @param {number|null} [attachmentFor=null]
   * @returns {Promise<Array<Object>>}
   */
  static async findByAttachable(attachableType, attachableId, attachmentFor = null) {
    const query = db('attachments')
      .where({
        attachable_type: attachableType,
        attachable_id: attachableId
      });

    if (attachmentFor !== null && attachmentFor !== undefined) {
      query.where('attachment_for', attachmentFor);
    }

    return query.orderBy('id', 'desc');
  }

  /**
   * Find latest attachment for an attachable entity
   * @param {string} attachableType
   * @param {number} attachableId
   * @param {number|null} [attachmentFor=null]
   * @returns {Promise<Object|undefined>}
   */
  static async findLatest(attachableType, attachableId, attachmentFor = null) {
    const query = db('attachments')
      .where({
        attachable_type: attachableType,
        attachable_id: attachableId
      });

    if (attachmentFor !== null && attachmentFor !== undefined) {
      query.where('attachment_for', attachmentFor);
    }

    return query.orderBy('id', 'desc').first();
  }

  /**
   * Delete an attachment by ID and optionally unlink the physical file
   * @param {number} id
   * @param {boolean} [unlinkFile=false]
   * @returns {Promise<number>}
   */
  static async deleteById(id, unlinkFile = false) {
    if (unlinkFile) {
      const attachment = await Attachment.findById(id);
      if (attachment && attachment.file_path) {
        Attachment.unlinkDiskFile(attachment.file_path);
      }
    }

    return db('attachments').where({ id }).del();
  }

  /**
   * Delete attachments for an attachable entity and optionally unlink files
   * @param {string} attachableType
   * @param {number} attachableId
   * @param {number|null} [attachmentFor=null]
   * @param {boolean} [unlinkFile=false]
   * @returns {Promise<number>}
   */
  static async deleteByAttachable(attachableType, attachableId, attachmentFor = null, unlinkFile = false) {
    const records = await Attachment.findByAttachable(attachableType, attachableId, attachmentFor);

    if (unlinkFile) {
      for (const record of records) {
        if (record.file_path) {
          Attachment.unlinkDiskFile(record.file_path);
        }
      }
    }

    const query = db('attachments')
      .where({
        attachable_type: attachableType,
        attachable_id: attachableId
      });

    if (attachmentFor !== null && attachmentFor !== undefined) {
      query.where('attachment_for', attachmentFor);
    }

    return query.del();
  }

  /**
   * Safely unlink file from disk across possible storage locations
   * @param {string} filePath
   */
  static unlinkDiskFile(filePath) {
    const candidatePaths = [
      path.resolve(process.cwd(), filePath),
      path.resolve(process.cwd(), 'storage', filePath),
      path.resolve(process.cwd(), 'storage/app', filePath)
    ];

    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p) && fs.lstatSync(p).isFile()) {
          fs.unlinkSync(p);
          break;
        }
      } catch (err) {
        // Ignore file removal errors on disk
      }
    }
  }

  /**
   * Resolve physical disk path for an attachment file_path
   * @param {string} filePath
   * @returns {string|null}
   */
  static resolveDiskPath(filePath) {
    const candidatePaths = [
      path.resolve(process.cwd(), filePath),
      path.resolve(process.cwd(), 'storage', filePath),
      path.resolve(process.cwd(), 'storage/app', filePath)
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p) && fs.lstatSync(p).isFile()) {
        return p;
      }
    }

    return null;
  }

  /**
   * Format attachment with full URL pointing to media route
   * @param {Object} attachment
   * @param {Object|string} [reqOrBaseUrl] Express request object or base URL string
   * @returns {Object|null}
   */
  static formatWithUrl(attachment, reqOrBaseUrl) {
    if (!attachment) return null;

    let base;
    if (reqOrBaseUrl && typeof reqOrBaseUrl === 'object' && reqOrBaseUrl.protocol && typeof reqOrBaseUrl.get === 'function') {
      base = `${reqOrBaseUrl.protocol}://${reqOrBaseUrl.get('host')}`;
    } else if (typeof reqOrBaseUrl === 'string' && reqOrBaseUrl.trim()) {
      base = reqOrBaseUrl.trim();
    } else {
      base = process.env.APP_URL || 'http://localhost:3000';
    }

    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanPath = attachment.file_path.startsWith('/')
      ? attachment.file_path.slice(1)
      : attachment.file_path;

    const mediaPath = routes.mediaUrl(attachment.id, cleanPath);
    return {
      ...attachment,
      url: `${cleanBase}${mediaPath}`,
      full_url: `${cleanBase}${mediaPath}`
    };
  }
}

module.exports = Attachment;
