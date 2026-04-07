const { getPool } = require('../config/db');

// Send order confirmation via WhatsApp
async function sendOrderConfirmation(req, res) {
  try {
    const { orderId, phoneNumber } = req.body;

    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, phoneNumber'
      });
    }

    const pool = getPool();

    // Get order details
    const [orders] = await pool.query(
      `SELECT o.*, CONCAT(u.first_name, ' ', u.last_name) as customer_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Get order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Format WhatsApp message
    const itemsText = items.map(item => `${item.name} x${item.quantity}`).join('\n');
    const message = `
Order Confirmation ${order.id}
---
Customer: ${order.customer_name}
Items:
${itemsText}

Subtotal: $${order.subtotal}
Shipping: $${order.shipping_cost}
Tax: $${order.tax}
Total: $${order.total}

Status: ${order.status}
Order Date: ${new Date(order.placed_at).toLocaleDateString()}
    `.trim();

    // TODO: Integrate with WhatsApp API (Twilio, Meta Business API, etc.)
    // This is a placeholder implementation

    return res.status(200).json({
      success: true,
      message: 'Order confirmation will be sent via WhatsApp',
      data: {
        orderId,
        phoneNumber,
        message
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error sending order confirmation',
      error: error.message
    });
  }
}

// Send order status update via WhatsApp
async function sendOrderStatusUpdate(req, res) {
  try {
    const { orderId, phoneNumber, status } = req.body;

    if (!orderId || !phoneNumber || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, phoneNumber, status'
      });
    }

    const pool = getPool();

    // Get order details
    const [orders] = await pool.query(
      `SELECT o.*, CONCAT(u.first_name, ' ', u.last_name) as customer_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Format status message based on status
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared for shipment.',
      shipped: 'Your order has been shipped! You can track it with the tracking number.',
      delivered: 'Your order has been delivered. Thank you for shopping with us!',
      cancelled: 'Your order has been cancelled.'
    };

    const statusMessage = statusMessages[status] || `Order status updated to: ${status}`;
    const message = `
Hi ${order.customer_name},

${statusMessage}

Order ID: ${order.id}
Status: ${status}
    `.trim();

    // TODO: Integrate with WhatsApp API

    return res.status(200).json({
      success: true,
      message: 'Order status update will be sent via WhatsApp',
      data: {
        orderId,
        phoneNumber,
        status,
        message
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error sending order status update',
      error: error.message
    });
  }
}

// Send promotional message via WhatsApp
async function sendPromotionalMessage(req, res) {
  try {
    const { phoneNumber, title, description, link } = req.body;

    if (!phoneNumber || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, title, description'
      });
    }

    const message = `
${title}

${description}
${link ? `\nLearn more: ${link}` : ''}
    `.trim();

    // TODO: Integrate with WhatsApp API

    return res.status(200).json({
      success: true,
      message: 'Promotional message will be sent via WhatsApp',
      data: {
        phoneNumber,
        message
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error sending promotional message',
      error: error.message
    });
  }
}

// Send reset password link via WhatsApp
async function sendPasswordResetLink(req, res) {
  try {
    const { phoneNumber, resetLink } = req.body;

    if (!phoneNumber || !resetLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phoneNumber, resetLink'
      });
    }

    const message = `
Click the link below to reset your password:
${resetLink}

This link expires in 1 hour.
If you didn't request a password reset, please ignore this message.
    `.trim();

    // TODO: Integrate with WhatsApp API

    return res.status(200).json({
      success: true,
      message: 'Password reset link will be sent via WhatsApp',
      data: {
        phoneNumber,
        message
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error sending password reset link',
      error: error.message
    });
  }
}

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendPromotionalMessage,
  sendPasswordResetLink
};
