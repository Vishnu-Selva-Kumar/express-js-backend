const HTTP_STATUS = require('#constants/httpStatus');
const Publisher = require('#models/Publisher');

class PublisherController {
  /**
   * GET /api/admin/publishers
   * Resource method: index (list publishers)
   */
  static async index(req, res) {
    try {
      const publishers = await Publisher.all(req.query);
      return res.status(HTTP_STATUS.OK).json({
        message: 'Publishers retrieved successfully.',
        data: publishers
      });
    } catch (error) {
      console.error('Error fetching publishers:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve publishers.'
      });
    }
  }

  /**
   * POST /api/admin/publishers
   * Resource method: store (create new publisher)
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

      const publisher = await Publisher.create({ name, status });

      return res.status(HTTP_STATUS.CREATED).json({
        message: 'Publisher created successfully.',
        data: publisher
      });
    } catch (error) {
      console.error('Error creating publisher:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create publisher.'
      });
    }
  }

  /**
   * GET /api/admin/publishers/:id
   * Resource method: show (display single publisher)
   */
  static async show(req, res) {
    try {
      const publisher = await Publisher.findById(req.params.id);
      if (!publisher) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Publisher not found.'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        message: 'Publisher retrieved successfully.',
        data: publisher
      });
    } catch (error) {
      console.error('Error fetching publisher:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve publisher.'
      });
    }
  }

  /**
   * PUT /api/admin/publishers/:id
   * Resource method: update (update publisher)
   */
  static async update(req, res) {
    try {
      const publisher = await Publisher.findById(req.params.id);
      if (!publisher) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Publisher not found.'
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

      const updated = await Publisher.update(req.params.id, { name, status });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Publisher updated successfully.',
        data: updated
      });
    } catch (error) {
      console.error('Error updating publisher:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update publisher.'
      });
    }
  }

  /**
   * DELETE /api/admin/publishers/:id
   * Resource method: delete / destroy (delete publisher)
   */
  static async delete(req, res) {
    try {
      const publisher = await Publisher.findById(req.params.id);
      if (!publisher) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Publisher not found.'
        });
      }

      await Publisher.delete(req.params.id);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Publisher deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting publisher:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete publisher.'
      });
    }
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return PublisherController.delete(req, res);
  }
}

module.exports = PublisherController;
