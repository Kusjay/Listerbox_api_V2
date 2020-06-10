const https = require('https');
const paystack = require('paystack')(process.env.SECRET_KEY);

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payment = require('../models/Payment');

// @desc    Get all customers
// @route   GET /api/v2/payments/customers
// @access  Private/Admin\
exports.getCustomers = asyncHandler(async (req, res, next) => {
  const customer = await paystack.customer.list();

  if (!customer) {
    return next(new ErrorResponse(`No customers found`, 404));
  }

  return res.status(200).json({
    success: true,
    data: customer
  });
});
