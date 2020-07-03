const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Earning = require('../models/Earning');
const Payment = require('../models/Payment');
const Payout = require('../models/Payout');
const User = require('../models/User');
const Profile = require('../models/Profile');
const sendEmail = require('../utils/sendEmail');

// @desc    Request Payout
// @route   POST /api/v2/payouts/:taskOwnerId
// @access  Private/Tasker
exports.requestPayout = asyncHandler(async (req, res, next) => {
  let taskerPaymentDetails = await Payment.find({
    taskOwner: req.params.taskOwnerId,
    status: 'Paid'
  });

  let taskerEarning = await Earning.find({
    taskOwnerId: req.params.taskOwnerId
  });

  // Check if the tasker has an account number and bank name in profile
  let taskerBankDetails = await Profile.find({ user: req.params.taskOwnerId });

  const taskerAccountNumber = taskerBankDetails[0].accountNumber;
  const taskerBankName = taskerBankDetails[0].bankDetails;

  if (taskerAccountNumber == undefined && taskerBankDetails == undefined) {
    return next(
      new ErrorResponse(
        `No account number and bank name attached to you profile. Please go to your profile and update your account details`,
        400
      )
    );
  }

  if (!taskerPaymentDetails) {
    return next(
      new ErrorResponse(
        `No payment transaction for user ${req.params.taskOwnerId}`,
        404
      )
    );
  }

  if (!taskerEarning) {
    return next(
      new ErrorResponse(`No earnings for user ${req.params.taskOwnerId}`, 404)
    );
  }

  req.body.task = taskerPaymentDetails[0].task;
  req.body.referenceId = taskerPaymentDetails[0].referenceId;
  req.body.taskOwner = taskerPaymentDetails[0].taskOwner;

  if (req.body.amount > taskerEarning[0].availableForWithdrawal) {
    return next(
      new ErrorResponse(
        `Amount to be withdrawn is greater than the amount available for withdrawal`,
        400
      )
    );
  }

  const payout = await Payout.create(req.body);

  res.status(200).json({
    success: true,
    data: payout
  });

  // Send email to Listerbox admin requesting payout for tasker
  const tasker = req.user.name;
  const taskerId = req.user.id;
  const payoutAmount = req.body.amount;

  const message = `Hi Admin,\n\nTasker ${tasker} with ID of ${taskerId} has requested a payout of ₦${payoutAmount}, Please login to the dashboard to approve or decline this payout request.`;
  const email = 'hello@listerbox.com';

  await sendEmail({
    email,
    subject: `Payout Request`,
    message
  });
});

// @desc    Accept Payout
// @route   PUT /api/v2/payouts/acceptPayout/:taskOwner
// @access  Private/Admin
exports;
