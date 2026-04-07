const { getPool } = require('../config/db');

// Get all shipping addresses for user
async function getUserShippingAddresses(req, res) {
  try {
    const userId = req.user?.id;
    const pool = getPool();

    const [addresses] = await pool.query(
      'SELECT id, address_line1, address_line2, city, state, postal_code, country, phone, created_at, updated_at FROM shipping_addresses WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shipping addresses',
      error: error.message
    });
  }
}

// Get single shipping address
async function getShippingAddressById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const pool = getPool();

    const [addresses] = await pool.query(
      'SELECT id, address_line1, address_line2, city, state, postal_code, country, phone, created_at, updated_at FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipping address not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: addresses[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shipping address',
      error: error.message
    });
  }
}

// Create new shipping address
async function createShippingAddress(req, res) {
  try {
    const userId = req.user?.id;
    const { address_line1, address_line2, city, state, postal_code, country, phone } = req.body;

    if (!address_line1 || !city || !state || !postal_code || !country) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: address_line1, city, state, postal_code, country'
      });
    }

    const pool = getPool();

    const [result] = await pool.query(
      `INSERT INTO shipping_addresses (user_id, address_line1, address_line2, city, state, postal_code, country, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, address_line1, address_line2 || null, city, state, postal_code, country, phone || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Shipping address created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating shipping address',
      error: error.message
    });
  }
}

// Update shipping address
async function updateShippingAddress(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { address_line1, address_line2, city, state, postal_code, country, phone } = req.body;
    const pool = getPool();

    // Check if address exists and belongs to user
    const [addresses] = await pool.query(
      'SELECT id FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipping address not found'
      });
    }

    const updates = [];
    const params = [];

    if (address_line1) {
      updates.push('address_line1 = ?');
      params.push(address_line1);
    }
    if (address_line2 !== undefined) {
      updates.push('address_line2 = ?');
      params.push(address_line2);
    }
    if (city) {
      updates.push('city = ?');
      params.push(city);
    }
    if (state) {
      updates.push('state = ?');
      params.push(state);
    }
    if (postal_code) {
      updates.push('postal_code = ?');
      params.push(postal_code);
    }
    if (country) {
      updates.push('country = ?');
      params.push(country);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    await pool.query(
      `UPDATE shipping_addresses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return res.status(200).json({
      success: true,
      message: 'Shipping address updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating shipping address',
      error: error.message
    });
  }
}

// Delete shipping address
async function deleteShippingAddress(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const pool = getPool();

    const [addresses] = await pool.query(
      'SELECT id FROM shipping_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Shipping address not found'
      });
    }

    // Check if address is used in any orders
    const [orders] = await pool.query(
      'SELECT id FROM orders WHERE shipping_address_id = ? LIMIT 1',
      [id]
    );

    if (orders.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete address that is used in existing orders'
      });
    }

    await pool.query('DELETE FROM shipping_addresses WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Shipping address deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting shipping address',
      error: error.message
    });
  }
}

module.exports = {
  getUserShippingAddresses,
  getShippingAddressById,
  createShippingAddress,
  updateShippingAddress,
  deleteShippingAddress
};
