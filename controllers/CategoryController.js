const HTTP_STATUS = require('#constants/httpStatus');
const Category = require('#models/Category');

class CategoryController {
  /**
   * GET /api/admin/categories
   * Resource method: index (list categories with optional filter)
   */
  static async index(req, res) {
    try {
      const categories = await Category.all(req.query);
      return res.status(HTTP_STATUS.OK).json({
        message: 'Categories retrieved successfully.',
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve categories.'
      });
    }
  }

  /**
   * POST /api/admin/categories
   * Resource method: store (create new category)
   */
  static async store(req, res) {
    try {
      const { name, status } = req.body || {};
      const errors = {};

      if (!name || !name.trim()) {
        errors.name = 'The name field is required.';
      } else {
        const existing = await Category.findByName(name.trim());
        if (existing) {
          errors.name = 'A category with this name already exists.';
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Validation failed.',
          errors
        });
      }

      const category = await Category.create({ name, status });

      return res.status(HTTP_STATUS.CREATED).json({
        message: 'Category created successfully.',
        data: category
      });
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to create category.'
      });
    }
  }

  /**
   * GET /api/admin/categories/:id
   * Resource method: show (display single category)
   */
  static async show(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Category not found.'
        });
      }

      return res.status(HTTP_STATUS.OK).json({
        message: 'Category retrieved successfully.',
        data: category
      });
    } catch (error) {
      console.error('Error fetching category:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to retrieve category.'
      });
    }
  }

  /**
   * PUT /api/admin/categories/:id
   * Resource method: update (update category)
   */
  static async update(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Category not found.'
        });
      }

      const { name, status } = req.body || {};
      const errors = {};

      if (name !== undefined) {
        if (!name.trim()) {
          errors.name = 'The name field cannot be empty.';
        } else {
          const existing = await Category.findByName(name.trim(), req.params.id);
          if (existing) {
            errors.name = 'A category with this name already exists.';
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
          message: 'Validation failed.',
          errors
        });
      }

      const updated = await Category.update(req.params.id, { name, status });

      return res.status(HTTP_STATUS.OK).json({
        message: 'Category updated successfully.',
        data: updated
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to update category.'
      });
    }
  }

  /**
   * DELETE /api/admin/categories/:id
   * Resource method: delete / destroy (delete category)
   */
  static async delete(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          message: 'Category not found.'
        });
      }

      await Category.delete(req.params.id);

      return res.status(HTTP_STATUS.OK).json({
        message: 'Category deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to delete category.'
      });
    }
  }

  // Alias for Laravel destroy convention
  static async destroy(req, res) {
    return CategoryController.delete(req, res);
  }
}

module.exports = CategoryController;
