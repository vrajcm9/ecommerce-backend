const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  productPhoto,
  deleteProduct,
} = require('../controllers/products');

const Product = require('../models/Product');
const advancedFilter = require('../middlewares/advancedFilter');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(advancedFilter(Product, 'category', 'name'), getProducts)
  .post(protect, authorize('seller', 'admin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('seller', 'admin'), updateProduct)
  .delete(protect, authorize('seller', 'admin'), deleteProduct);

router
  .route('/:id/photo')
  .put(protect, authorize('seller', 'admin'), productPhoto);

module.exports = router;
