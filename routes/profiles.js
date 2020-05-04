const express = require('express');
const { createProfile } = require('../controllers/profiles');

const Profile = require('../models/Profile');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('Tasker', 'User', 'Admin'), createProfile);

// router.route('/').post(protect, createProfile);

module.exports = router;
