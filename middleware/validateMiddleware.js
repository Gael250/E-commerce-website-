const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),

  body('last_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),

  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Product creation/update validation
const validateProduct = [
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),

  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name is required and must be less than 255 characters'),

  body('sku')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU is required and must be less than 100 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Valid price is required'),

  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  handleValidationErrors
];

// Category validation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Category name is required and must be less than 150 characters'),

  body('slug')
    .trim()
    .isLength({ min: 1, max: 150 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug is required, must be lowercase alphanumeric with hyphens, and less than 150 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),

  handleValidationErrors
];

// Order creation validation
const validateOrderCreation = [
  body('shipping_address_id')
    .isInt({ min: 1 })
    .withMessage('Valid shipping address ID is required'),

  body('taxRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Tax rate must be between 0 and 1'),

  handleValidationErrors
];

// Shipping address validation
const validateShippingAddress = [
  body('address_line1')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Address line 1 is required and must be less than 255 characters'),

  body('address_line2')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address line 2 must be less than 255 characters'),

  body('city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required and must be less than 100 characters'),

  body('state')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State is required and must be less than 100 characters'),

  body('postal_code')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Valid postal code is required'),

  body('country')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country is required and must be less than 100 characters'),

  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),

  handleValidationErrors
];

// Cart item validation
const validateCartItem = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),

  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  handleValidationErrors
];

// Order status update validation
const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Valid order status is required'),

  handleValidationErrors
];

// Generic ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),

  handleValidationErrors
];

// Query parameter validation for pagination
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),

  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateCategory,
  validateOrderCreation,
  validateShippingAddress,
  validateCartItem,
  validateOrderStatus,
  validateId,
  validatePagination,
  handleValidationErrors
};
