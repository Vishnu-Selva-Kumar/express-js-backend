const HTTP_STATUS = require('#constants/httpStatus');
const Language = require('#models/Language');

class LanguageController {
  /**
   * GET /api/admin/languages
   * Resource method: index (list languages)
   */
  static async index(req, res) {
    try {
      const languages = await Language.all(req.query);
      return res.status(HTTP_STATUS.OK).json({
        message: 'Languages retrieved successfully.',
        data: languages
      });
    } catch (error) {
      console.error('Error fetching languages:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve languages.'
      });
    }
  }

  /**
   * POST /api/admin/languages
   * Resource method: store (create new language)
   */
  static async store(req, res) {
    try {
      const { name, status } = req.body || {};
      const errors = {};

      if (!name || !name.trim()) {
        errors.name = 'The name field is required.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Validation failed.',
          errors
        });
      }

      const language = await Language.create({ name, status });

      return res.status(HTTP_STATUS.CREATED).json({
        message: 'Language created successfully.',
        data: language
      });
    } catch (error) {
      console.error('Error creating language:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create language.'
      });
    }
  }

  /**
   * GET /api/admin/languages/:id
   * Resource method: show (display single language)
   */
  static async show(req, res) {
    try {
      const language = await Language.findById(req.params.id);
      if (!language) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Language not found.'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        message: 'Language retrieved successfully.',
        data: language
      });
    } catch (error) {
      console.error('Error fetching language:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve language.'
      });
    }
  }

  /**
   * PUT /api/admin/languages/:id
   * Resource method: update (update language)
   */
  static async update(req, res) {
    try {
      const language = await Language.findById(req.params.id);
      if (!language) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Language not found.'
        });
      }

      const { name, status } = req.body || {};
      const errors = {};

      if (name !== undefined && !name.trim()) {
        errors.name = 'The name field cannot be empty.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Validation failed.',
          errors
        });
      }

      const updated = await Language.update(req.params.id, { name, status });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Language updated successfully.',
        data: updated
      });
    } catch (error) {
      console.error('Error updating language:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update language.'
      });
    }
  }

  /**
   * DELETE /api/admin/languages/:id
   * Resource method: delete / destroy (delete language)
   */
  static async delete(req, res) {
    try {
      const language = await Language.findById(req.params.id);
      if (!language) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Language not found.'
        });
      }

      await Language.delete(req.params.id);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Language deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting language:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete language.'
      });
    }
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return LanguageController.delete(req, res);
  }
}

module.exports = LanguageController;
