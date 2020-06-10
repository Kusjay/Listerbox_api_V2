const express = require('express');
const {
  addReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview
} = require('../controllers/reviews');

const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('User', 'Admin'), addReview)
  .get(
    advancedResults(Review, {
      path: 'task',
      select: 'title'
    }),
    getReviews
  );

router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('User', 'Admin'), updateReview)
  .delete(protect, authorize('Admin'), deleteReview);

module.exports = router;
