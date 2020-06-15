const express = require('express');
const {
  getCustomers,
  initializePayment,
  verifyPayment
} = require('../controllers/payments');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/customers').get(protect, authorize('Admin'), getCustomers);

router
  .route('/initialize/:taskId')
  .get(protect, authorize('User', 'Admin'), initializePayment);

router
  .route('/verify/:referenceId')
  .get(protect, authorize('User', 'Admin'), verifyPayment);

module.exports = router;
