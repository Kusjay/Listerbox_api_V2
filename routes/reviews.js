const express = require('express');
const { addReview } = require('../controllers/reviews');

const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.route('/').post(protect, authorize('User', 'Admin'), addReview);

module.exports = router;
