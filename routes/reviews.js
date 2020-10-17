const express = require('express');
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews');
const advancedFilter = require('../middlewares/advancedFilter');
const Review = require('../models/Review');
const { protect } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(advancedFilter(Review, 'bootcamp', 'name'), getReviews)
  .post(protect, createReview);

router
  .route('/:id')
  .get(getReview)
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
