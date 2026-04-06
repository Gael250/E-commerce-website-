const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// Placeholder for authMiddleware - implement based on your authentication setup
// This should verify JWT tokens and attach user info to req.user
const authMiddleware = (req, res, next) => {
  // Check if Authorization header exists
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided'
    });
  }
  
  try {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    // TODO: Verify JWT token here using jsonwebtoken
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid token'
    });
  }
};

// Public routes
// GET all products
router.get('/products', productController.getAllProducts);

// GET product by ID
router.get('/products/:id', productController.getProductByID);

// Protected routes (require authentication)
// POST create new product with image upload
router.post('/products', authMiddleware, uploadMiddleware.single('image'), productController.addProduct);

// PUT update product with optional image upload
router.put('/products/:id', authMiddleware, uploadMiddleware.single('image'), productController.updateProduct);

// DELETE product
router.delete('/products/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
