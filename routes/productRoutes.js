const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { uploadProductImage, handleUploadError } = require('../middleware/uploadMiddleware');

// Routes for products

// GET /api/products - Get all products with optional filters
router.get('/', productController.getAllProducts);

// GET /api/products/low-stock - Get low stock products
router.get('/low-stock', productController.getLowStockProducts);

// GET /api/products/:id - Get single product by ID
router.get('/:id', productController.getProductById);

// POST /api/products - Create new product (with image upload)
router.post('/',
  uploadProductImage,
  handleUploadError,
  productController.createProduct
);

// PUT /api/products/:id - Update product (with optional image upload)
router.put('/:id',
  uploadProductImage,
  handleUploadError,
  productController.updateProduct
);

// DELETE /api/products/:id - Delete product (soft delete)
router.delete('/:id', productController.deleteProduct);

module.exports = router;
