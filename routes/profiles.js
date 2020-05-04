const express = require('express');
const {
  createProfile,
  getProfiles,
  getProfile
} = require('../controllers/profiles');

const Profile = require('../models/Profile');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(advancedResults(Profile), getProfiles);

router
  .route('/')
  .post(protect, authorize('Tasker', 'User', 'Admin'), createProfile);

router.route('/:id').get(getProfile);

module.exports = router;
