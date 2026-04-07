const { getPool } = require('../config/db');

// Get all products with optional filters
async function getAllProducts(req, res) {
  try {
    const { category_id, search, limit = 20, offset = 0 } = req.query;
    const pool = getPool();

    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = 1');

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
}

// Get single product by ID
async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
}

// Create new product (Admin only)
async function createProduct(req, res) {
  try {
    const { category_id, name, sku, description, price, stock_quantity, image_url } = req.body;

    if (!category_id || !name || !sku || !price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category_id, name, sku, price'
      });
    }

    const pool = getPool();

    // Check if SKU already exists
    const [existing] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, sku, description, price, stock_quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, name, sku, description || null, price, stock_quantity || 0, image_url || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
}

// Update product
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { category_id, name, sku, description, price, stock_quantity, image_url, is_active } = req.body;
    const pool = getPool();

    // Check if product exists
    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check SKU uniqueness
    if (sku) {
      const [skuExists] = await pool.query('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, id]);
      if (skuExists.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    const updates = [];
    const params = [];

    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id);
    }
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (sku) {
      updates.push('sku = ?');
      params.push(sku);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (stock_quantity !== undefined) {
      updates.push('stock_quantity = ?');
      params.push(stock_quantity);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
}

// Delete product (soft delete - set is_active to 0)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
}

// Get low stock products
async function getLowStockProducts(req, res) {
  try {
    const pool = getPool();

    const [products] = await pool.query(`
      SELECT * FROM v_low_stock
      ORDER BY stock_quantity ASC
    `);

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
};
