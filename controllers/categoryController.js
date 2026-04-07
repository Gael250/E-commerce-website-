const { getPool } = require('../config/db');

// Get all categories
async function getAllCategories(req, res) {
  try {
    const pool = getPool();

    const [categories] = await pool.query(
      'SELECT id, name, slug, description, created_at, updated_at FROM categories ORDER BY name ASC'
    );

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
}

// Get single category by ID
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [categories] = await pool.query(
      'SELECT id, name, slug, description, created_at, updated_at FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
}

// Get category by slug
async function getCategoryBySlug(req, res) {
  try {
    const { slug } = req.params;
    const pool = getPool();

    const [categories] = await pool.query(
      'SELECT id, name, slug, description, created_at, updated_at FROM categories WHERE slug = ?',
      [slug]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: categories[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
}

// Create new category (Admin only)
async function createCategory(req, res) {
  try {
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, slug'
      });
    }

    const pool = getPool();

    // Check if slug already exists
    const [existing] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Slug already exists'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description)
       VALUES (?, ?, ?)`,
      [name, slug, description || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
}

// Update category
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;
    const pool = getPool();

    // Check if category exists
    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check slug uniqueness if being updated
    if (slug) {
      const [slugExists] = await pool.query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
      if (slugExists.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Slug already exists'
        });
      }
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (slug) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
}

// Delete category
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [categories] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const [products] = await pool.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id]);
    if (products.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete category with existing products'
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
