const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists in database
    const pool = getPool();
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware to check if user is admin (optional role-based access)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Assuming you add a role column to users table later
  // For now, you can implement admin logic as needed
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Optional: Middleware for session-based authentication (for cart functionality)
const authenticateSession = async (req, res, next) => {
  try {
    const sessionToken = req.headers['session-token'] || req.body.sessionToken;

    if (!sessionToken) {
      return next(); // Continue without user authentication
    }

    // You can implement session-based auth here if needed
    // For now, just pass through
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Session authentication error',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  authenticateSession
};
