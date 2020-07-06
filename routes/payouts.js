const express = require('express');
const { requestPayout, acceptPayout } = require('../controllers/payouts');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/:taskOwnerId')
  .post(protect, authorize('Tasker', 'Admin'), requestPayout);

router
  .route('/acceptPayout/:Id')
  .put(protect, authorize('Admin'), acceptPayout);

module.exports = router;
