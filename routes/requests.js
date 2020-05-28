const express = require('express');
const {
  addRequest,
  showRequestTasker,
  showRequestUser
} = require('../controllers/requests');

const Request = require('../controllers/requests');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.route('/').post(protect, authorize('User', 'Admin'), addRequest);

router
  .route('/showRequestTasker/:requestId')
  .get(protect, authorize('Tasker', 'Admin'), showRequestTasker);

router
  .route('/showRequestUser/:requestId')
  .get(protect, authorize('User', 'Admin'), showRequestUser);

module.exports = router;
