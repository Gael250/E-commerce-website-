const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getCart);                    // View cart
router.post('/', protect, addToCart);                 // Add item
router.put('/:itemId', protect, updateCartItem);      // Update quantity
router.delete('/clear', protect, clearCart);          // Clear entire cart
router.delete('/:itemId', protect, removeCartItem);   // Remove one item

module.exports = router;