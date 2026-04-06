const { getPool } = require('../config/db');

async function getCart(req, res) {
  try {
    const userId = req.user?.id;
    const sessionToken = req.headers['session-token'] || req.body.sessionToken;

    if (!userId && !sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'User authentication or session token required'
      });
    }

    const pool = getPool();
    let cartQuery, cartParams;

    if (userId) {
      cartQuery = 'SELECT id FROM cart WHERE user_id = ?';
      cartParams = [userId];
    } else {
      cartQuery = 'SELECT id FROM cart WHERE session_token = ?';
      cartParams = [sessionToken];
    }

    const [cartRows] = await pool.query(cartQuery, cartParams);

    if (cartRows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        data: { items: [], total: 0 }
      });
    }

    const cartId = cartRows[0].id;

    const [items] = await pool.query(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.price,
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.price as current_price,
        p.stock_quantity,
        p.image_url,
        c.name as category_name
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `, [cartId]);

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: { items, total, cartId }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
}

async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user?.id;
    const sessionToken = req.headers['session-token'] || req.body.sessionToken;

    if (!productId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid product ID and quantity required'
      });
    }

    if (!userId && !sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'User authentication or session token required'
      });
    }

    const pool = getPool();

    // Check if product exists and is active
    const [productRows] = await pool.query(
      'SELECT id, name, price, stock_quantity, is_active FROM products WHERE id = ?',
      [productId]
    );

    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productRows[0];
    if (!product.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Product is not available'
      });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.stock_quantity}`
      });
    }

    // Get or create cart
    let cartId;
    let cartQuery, cartParams;

    if (userId) {
      cartQuery = 'SELECT id FROM cart WHERE user_id = ?';
      cartParams = [userId];
    } else {
      cartQuery = 'SELECT id FROM cart WHERE session_token = ?';
      cartParams = [sessionToken];
    }

    const [cartRows] = await pool.query(cartQuery, cartParams);

    if (cartRows.length === 0) {
      // Create new cart
      const insertCartQuery = userId 
        ? 'INSERT INTO cart (user_id) VALUES (?)'
        : 'INSERT INTO cart (session_token) VALUES (?)';
      
      const [cartResult] = await pool.query(insertCartQuery, userId ? [userId] : [sessionToken]);
      cartId = cartResult.insertId;
    } else {
      cartId = cartRows[0].id;
    }

    // Check if item already exists in cart
    const [existingItem] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    if (existingItem.length > 0) {
      // Update existing item
      const newQuantity = existingItem[0].quantity + quantity;
      
      if (product.stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more items. Total would exceed stock (${product.stock_quantity})`
        });
      }

      await pool.query(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, existingItem[0].id]
      );
    } else {
      // Add new item
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [cartId, productId, quantity, product.price]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
}

async function updateCartItem(req, res) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user?.id;
    const sessionToken = req.headers['session-token'] || req.body.sessionToken;

    if (!itemId || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid cart item ID and quantity required'
      });
    }

    const pool = getPool();

    // Get cart item with cart ownership verification
    let ownershipQuery, ownershipParams;

    if (userId) {
      ownershipQuery = `
        SELECT ci.id, ci.quantity, p.stock_quantity 
        FROM cart_items ci 
        JOIN cart c ON ci.cart_id = c.id 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.id = ? AND c.user_id = ?
      `;
      ownershipParams = [itemId, userId];
    } else {
      ownershipQuery = `
        SELECT ci.id, ci.quantity, p.stock_quantity 
        FROM cart_items ci 
        JOIN cart c ON ci.cart_id = c.id 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.id = ? AND c.session_token = ?
      `;
      ownershipParams = [itemId, sessionToken];
    }

    const [itemRows] = await pool.query(ownershipQuery, ownershipParams);

    if (itemRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found or access denied'
      });
    }

    const item = itemRows[0];

    if (quantity === 0) {
      // Remove item from cart
      await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
      return res.status(200).json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    if (item.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${item.stock_quantity}`
      });
    }

    await pool.query(
      'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, itemId]
    );

    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
}

async function removeFromCart(req, res) {
  try {
    const { itemId } = req.params;
    const userId = req.user?.id;
    const sessionToken = req.headers['session-token'] || req.body.sessionToken;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Cart item ID required'
      });
    }

    const pool = getPool();

    // Verify ownership before deletion
    let ownershipQuery, ownershipParams;

    if (userId) {
      ownershipQuery = 'SELECT ci.id FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE ci.id = ? AND c.user_id = ?';
      ownershipParams = [itemId, userId];
    } else {
      ownershipQuery = 'SELECT ci.id FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE ci.id = ? AND c.session_token = ?';
      ownershipParams = [itemId, sessionToken];
    }

    const [itemRows] = await pool.query(ownershipQuery, ownershipParams);

    if (itemRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found or access denied'
      });
    }

    await pool.query('DELETE FROM cart_items WHERE id = ?', [itemId]);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
}

async function clearCart(req, res) {
  try {
    const userId = req.user?.id;
    const sessionToken = req.headers['session-token'] || req.body.sessionToken;

    if (!userId && !sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'User authentication or session token required'
      });
    }

    const pool = getPool();

    // Get cart ID
    let cartQuery, cartParams;

    if (userId) {
      cartQuery = 'SELECT id FROM cart WHERE user_id = ?';
      cartParams = [userId];
    } else {
      cartQuery = 'SELECT id FROM cart WHERE session_token = ?';
      cartParams = [sessionToken];
    }

    const [cartRows] = await pool.query(cartQuery, cartParams);

    if (cartRows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    const cartId = cartRows[0].id;

    // Clear all items from cart
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
