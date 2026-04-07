const { getPool } = require('../config/db');

// Get all orders (admin) or user orders
async function getAllOrders(req, res) {
  try {
    const userId = req.user?.id;
    const { status, limit = 20, offset = 0 } = req.query;
    const isAdmin = req.user?.role === 'admin'; // adjust based on your auth setup
    const pool = getPool();

    let query = `
      SELECT o.*, CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const params = [];

    // Non-admin users can only see their own orders
    if (!isAdmin) {
      query += ' WHERE o.user_id = ?';
      params.push(userId);
    }

    if (status) {
      query += params.length > 0 ? ' AND o.status = ?' : ' WHERE o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.placed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
}

// Get single order by ID
async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const pool = getPool();

    const [orders] = await pool.query(
      `SELECT o.*, CONCAT(u.first_name, ' ', u.last_name) as customer_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (orders[0].user_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const order = orders[0];
    order.items = items;

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
}

// Create order from cart
async function createOrder(req, res) {
  try {
    const userId = req.user?.id;
    const { shipping_address_id, taxRate = 0.08 } = req.body;

    if (!userId || !shipping_address_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: shipping_address_id'
      });
    }

    const pool = getPool();

    // Verify shipping address belongs to user
    const [addresses] = await pool.query(
      'SELECT id FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [shipping_address_id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipping address not found'
      });
    }

    // Get user's cart
    const [carts] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [userId]);

    if (carts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const cartId = carts[0].id;

    // Get cart items
    const [cartItems] = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity, ci.price,
              p.stock_quantity, p.price as current_price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Verify stock availability and calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ID ${item.product_id}`
        });
      }
      subtotal += item.price * item.quantity;
    }

    const shippingCost = 10; // Fixed shipping cost - adjust as needed
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + shippingCost + tax;

    // Create order
    const [orderResult] = await pool.query(
      `INSERT INTO orders (user_id, shipping_address_id, subtotal, shipping_cost, tax, total, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, shipping_address_id, subtotal, shippingCost, tax, total]
    );

    const orderId = orderResult.insertId;

    // Create order items and update stock
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );

      // Update product stock
      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart items
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        total,
        status: 'pending'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
}

// Update order status
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: status'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const pool = getPool();

    const [orders] = await pool.query('SELECT id FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
}

// Get order summary view
async function getOrderSummary(req, res) {
  try {
    const pool = getPool();

    const [summary] = await pool.query('SELECT * FROM v_order_summary ORDER BY placed_at DESC');

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order summary',
      error: error.message
    });
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrderSummary
};
 