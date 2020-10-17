const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryPhoto,
} = require('../controllers/categories');

const advancedFilter = require('../middlewares/advancedFilter');
const Category = require('../models/Category');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

// Include other resources routes
const productRouter = require('./products');
const reviewRouter = require('./reviews');

// Reroute to correct router
router.use('/:categoryId/products', productRouter);
router.use('/:categoryId/reviews', reviewRouter);

router.route('/:id/photo').put(protect, authorize('admin'), categoryPhoto);

router
  .route('/')
  .get(advancedFilter(Category), getCategories)
  .post(protect, authorize('admin'), createCategory);

router
  .route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;
