const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Get database connection from pool (assumes you have a db connection setup)
let pool;

// Initialize pool (should be called from main app.js)
const initializePool = (dbPool) => {
  pool = dbPool;
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        p.id, 
        p.category_id, 
        p.name, 
        p.sku, 
        p.description, 
        p.price, 
        p.stock_quantity, 
        p.is_active, 
        p.image_url,
        p.created_at, 
        p.updated_at,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    connection.release();
    
    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
};

// Get product by ID
const getProductByID = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        p.id, 
        p.category_id, 
        p.name, 
        p.sku, 
        p.description, 
        p.price, 
        p.stock_quantity, 
        p.is_active, 
        p.image_url,
        p.created_at, 
        p.updated_at,
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    
    const [rows] = await connection.execute(query, [id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: error.message
    });
  }
};

// Add product with image upload
const addProduct = async (req, res) => {
  try {
    const { category_id, name, sku, description, price, stock_quantity } = req.body;
    
    // Validate required fields
    if (!category_id || !name || !sku || !price) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category_id, name, sku, price'
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Check if SKU already exists
      const [skuCheck] = await connection.execute(
        'SELECT id FROM products WHERE sku = ?',
        [sku]
      );
      
      if (skuCheck.length > 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        connection.release();
        return res.status(409).json({
          success: false,
          message: 'SKU already exists'
        });
      }
      
      // Prepare image filename
      const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;
      
      const query = `
        INSERT INTO products (category_id, name, sku, description, price, stock_quantity, image_url, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `;
      
      const [result] = await connection.execute(query, [
        category_id,
        name,
        sku,
        description || null,
        price,
        stock_quantity || 0,
        imageUrl
      ]);
      
      connection.release();
      
      res.status(201).json({
        success: true,
        message: 'Product added successfully',
        data: {
          id: result.insertId,
          category_id,
          name,
          sku,
          description,
          price,
          stock_quantity,
          image_url: imageUrl,
          is_active: 1
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, sku, description, price, stock_quantity, is_active } = req.body;
    
    if (!id || isNaN(id)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Check if product exists
      const [product] = await connection.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );
      
      if (product.length === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Check if new SKU already exists (if SKU is being updated)
      if (sku && sku !== product[0].sku) {
        const [skuCheck] = await connection.execute(
          'SELECT id FROM products WHERE sku = ? AND id != ?',
          [sku, id]
        );
        
        if (skuCheck.length > 0) {
          if (req.file) {
            fs.unlinkSync(req.file.path);
          }
          connection.release();
          return res.status(409).json({
            success: false,
            message: 'SKU already exists'
          });
        }
      }
      
      // Handle image update: delete old image if new one is uploaded
      let imageUrl = product[0].image_url;
      if (req.file) {
        imageUrl = `/uploads/products/${req.file.filename}`;
        
        // Delete old image
        if (product[0].image_url) {
          const oldImagePath = path.join(__dirname, '..', product[0].image_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      }
      
      const query = `
        UPDATE products 
        SET 
          category_id = COALESCE(?, category_id),
          name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          stock_quantity = COALESCE(?, stock_quantity),
          image_url = ?,
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await connection.execute(query, [
        category_id || null,
        name || null,
        sku || null,
        description || null,
        price || null,
        stock_quantity !== undefined ? stock_quantity : null,
        imageUrl,
        is_active !== undefined ? is_active : null,
        id
      ]);
      
      connection.release();
      
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: {
          id,
          category_id: category_id || product[0].category_id,
          name: name || product[0].name,
          sku: sku || product[0].sku,
          description: description || product[0].description,
          price: price || product[0].price,
          stock_quantity: stock_quantity !== undefined ? stock_quantity : product[0].stock_quantity,
          image_url: imageUrl,
          is_active: is_active !== undefined ? is_active : product[0].is_active
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    const connection = await pool.getConnection();
    
    try {
      // Check if product exists
      const [product] = await connection.execute(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );
      
      if (product.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Delete product image if exists
      if (product[0].image_url) {
        const imagePath = path.join(__dirname, '..', product[0].image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Delete product
      await connection.execute('DELETE FROM products WHERE id = ?', [id]);
      
      connection.release();
      
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        data: {
          id
        }
      });
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  initializePool,
  getAllProducts,
  getProductByID,
  addProduct,
  updateProduct,
  deleteProduct
};
