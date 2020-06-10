const https = require('https');
const paystack = require('paystack')(process.env.SECRET_KEY);

const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Payment = require('../models/Payment');
const Task = require('../models/Task');
const Request = require('../models/Request');

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

// @desc    Initializing payment
// @route   GET /api/v2/payments/initialize/:taskId
// @access  Private/Admin
exports.initializePayment = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.taskId);

  if (!task) {
    return next(
      new ErrorResponse(`No task with id of ${req.params.taskId}`),
      404
    );
  }

  // Check if the user has made a request before payment
  let request = await Request.find({ user: req.user.id });

  if (!request) {
    return next(
      new ErrorResponse(`No request made for user ${req.user.id}`),
      404
    );
  }

  let options = {
    host: process.env.PAYMENT_HOST,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  let referenceId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  let paymentData = JSON.stringify({
    reference: referenceId,
    amount: task.price * 100,
    email: req.user.email,
    callback_url: `${req.protocol}://${req.get(
      'host'
    )}/api/v2/payments/verify/${referenceId}`
  });

  let data = '';

  let paymentReq = https.request(options, (paymentRes) => {
    paymentRes.on('data', (chunk) => {
      data += chunk;
    });
    paymentRes.on('end', async () => {
      data = JSON.parse(data);
      if (data['status']) {
        // Pay %85 to the tasker and %15 to Listerbox
        const netAmount = (85 / 100) * task.price;

        let paymentDetails = {
          user: req.user.id,
          task: task.id,
          amount: netAmount,
          taskOwner: task.user,
          referenceId: referenceId,
          accessCode: data['data']['access_code'],
          status: 'Init'
        };

        console.log(data);
        console.log(data['data']['access_code']);

        await Payment.create(paymentDetails);

        let responseData = {
          payment_url: data['data']['authorization_url'],
          reference_id: referenceId
        };

        res.status(200).json({
          success: true,
          data: responseData
        });
      }
    });
  });

  paymentReq.on('error', (e) => {
    res.json(e);
    return;
  });

  // Write data to request body
  paymentReq.write(paymentData);
  paymentReq.end();
});
