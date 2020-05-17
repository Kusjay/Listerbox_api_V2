const express = require('express');
const {
  createProfile,
  getProfiles,
  getProfile,
  updateProfile,
  deleteProfile,
  profilePhotoUpload
} = require('../controllers/profiles');

const Profile = require('../models/Profile');

// Include other resource routers
const taskRouter = require('./tasks');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:profileId/tasks', taskRouter);

router
  .route('/:id/photo')
  .put(protect, authorize('Tasker', 'User', 'Admin'), profilePhotoUpload);

router.route('/').get(advancedResults(Profile), getProfiles);

router
  .route('/')
  .post(protect, authorize('Tasker', 'User', 'Admin'), createProfile);

router
  .route('/:id')
  .get(getProfile)
  .put(protect, authorize('Tasker', 'User', 'Admin'), updateProfile)
  .delete(protect, authorize('Tasker', 'User', 'Admin'), deleteProfile);

module.exports = router;
