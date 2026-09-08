const HTTP_STATUS = require('#constants/httpStatus');
const Author = require('#models/Author');

class AuthorController {
  /**
   * GET /api/admin/authors
   * Resource method: index (list authors)
   */
  static async index(req, res) {
    try {
      const authors = await Author.all(req.query);
      return res.status(HTTP_STATUS.OK).json({
        message: 'Authors retrieved successfully.',
        data: authors
      });
    } catch (error) {
      console.error('Error fetching authors:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve authors.'
      });
    }
  }

  /**
   * POST /api/admin/authors
   * Resource method: store (create new author)
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

      const author = await Author.create({ name, status });

      return res.status(HTTP_STATUS.CREATED).json({
        message: 'Author created successfully.',
        data: author
      });
    } catch (error) {
      console.error('Error creating author:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create author.'
      });
    }
  }

  /**
   * GET /api/admin/authors/:id
   * Resource method: show (display single author)
   */
  static async show(req, res) {
    try {
      const author = await Author.findById(req.params.id);
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Author not found.'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        message: 'Author retrieved successfully.',
        data: author
      });
    } catch (error) {
      console.error('Error fetching author:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve author.'
      });
    }
  }

  /**
   * PUT /api/admin/authors/:id
   * Resource method: update (update author)
   */
  static async update(req, res) {
    try {
      const author = await Author.findById(req.params.id);
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Author not found.'
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

      const updated = await Author.update(req.params.id, { name, status });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Author updated successfully.',
        data: updated
      });
    } catch (error) {
      console.error('Error updating author:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update author.'
      });
    }
  }

  /**
   * DELETE /api/admin/authors/:id
   * Resource method: delete / destroy (delete author)
   */
  static async delete(req, res) {
    try {
      const author = await Author.findById(req.params.id);
      if (!author) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Author not found.'
        });
      }

      await Author.delete(req.params.id);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Author deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting author:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete author.'
      });
    }
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return AuthorController.delete(req, res);
  }
}

module.exports = AuthorController;
