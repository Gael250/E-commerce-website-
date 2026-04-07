// routes/categoryRoutes.js - Category routes

const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Import middleware if needed (e.g., authentication)
// const { protect } = require('../middleware/authMiddleware');

// Routes for categories
router.route('/')
  .get(getAllCategories)      // GET /api/categories - Get all categories
  .post(createCategory);      // POST /api/categories - Create a new category

router.route('/:id')
  .get(getCategoryById)       // GET /api/categories/:id - Get category by ID
  .put(updateCategory)        // PUT /api/categories/:id - Update category
  .delete(deleteCategory);    // DELETE /api/categories/:id - Delete category

module.exports = router;
