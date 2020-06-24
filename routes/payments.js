const express = require('express');
const {
  getCustomers,
  initializePayment,
  verifyPayment,
  getTransactionReference,
  getTransaction,
  getTransactionsForTasker
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

router
  .route('/reference/:referenceId')
  .get(protect, authorize('Admin'), getTransactionReference);

router
  .route('/transaction/:taskId')
  .get(protect, authorize('Admin'), getTransaction);

router
  .route('/transaction/taskerId/:taskerId')
  .get(protect, authorize('Admin'), getTransactionsForTasker);

module.exports = router;
