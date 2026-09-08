const HTTP_STATUS = require('#constants/httpStatus');
const SubCategory = require('#models/SubCategory');
const Category = require('#models/Category');

class SubCategoryController {
  /**
   * GET /api/admin/subcategories
   * Resource method: index (list subcategories with optional filter)
   */
  static async index(req, res) {
    try {
      const subcategories = await SubCategory.all(req.query);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subcategories retrieved successfully.',
        data: subcategories
      });
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve subcategories.'
      });
    }
  }

  /**
   * POST /api/admin/subcategories
   * Resource method: store (create new subcategory)
   */
  static async store(req, res) {
    try {
      const { name, category_id, status } = req.body || {};
      const errors = {};

      if (!name || !name.trim()) {
        errors.name = 'The name field is required.';
      }

      if (category_id) {
        const categoryExists = await Category.findById(category_id);
        if (!categoryExists) {
          errors.category_id = 'The selected category does not exist.';
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed.',
          errors
        });
      }

      const subcategory = await SubCategory.create({ name, category_id, status });

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Subcategory created successfully.',
        data: subcategory
      });
    } catch (error) {
      console.error('Error creating subcategory:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to create subcategory.'
      });
    }
  }

  /**
   * GET /api/admin/subcategories/:id
   * Resource method: show (display single subcategory)
   */
  static async show(req, res) {
    try {
      const subcategory = await SubCategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subcategory not found.'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subcategory retrieved successfully.',
        data: subcategory
      });
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve subcategory.'
      });
    }
  }

  /**
   * PUT /api/admin/subcategories/:id
   * Resource method: update (update subcategory)
   */
  static async update(req, res) {
    try {
      const subcategory = await SubCategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subcategory not found.'
        });
      }

      const { name, category_id, status } = req.body || {};
      const errors = {};

      if (name !== undefined && !name.trim()) {
        errors.name = 'The name field cannot be empty.';
      }

      if (category_id !== undefined && category_id !== null) {
        const categoryExists = await Category.findById(category_id);
        if (!categoryExists) {
          errors.category_id = 'The selected category does not exist.';
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          success: false,
          message: 'Validation failed.',
          errors
        });
      }

      const updated = await SubCategory.update(req.params.id, { name, category_id, status });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subcategory updated successfully.',
        data: updated
      });
    } catch (error) {
      console.error('Error updating subcategory:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to update subcategory.'
      });
    }
  }

  /**
   * DELETE /api/admin/subcategories/:id
   * Resource method: delete / destroy (delete subcategory)
   */
  static async delete(req, res) {
    try {
      const subcategory = await SubCategory.findById(req.params.id);
      if (!subcategory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Subcategory not found.'
        });
      }

      await SubCategory.delete(req.params.id);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Subcategory deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to delete subcategory.'
      });
    }
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return SubCategoryController.delete(req, res);
  }
}

module.exports = SubCategoryController;
