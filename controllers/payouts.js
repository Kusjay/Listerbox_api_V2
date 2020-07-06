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
  let taskerBankDetails = await Profile.find({
    user: req.params.taskOwnerId
  }).select('+accountNumber bankName');

  const taskerAccountNumber = taskerBankDetails[0].accountNumber;
  const taskerBankName = taskerBankDetails[0].bankName;

  if (taskerAccountNumber == undefined && taskerBankName == undefined) {
    return next(
      new ErrorResponse(
        `No account number and bank name attached to your profile. Please go to your profile and update your account details`,
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
  } else {
    const payout = await Payout.create(req.body);

    await Earning.findOneAndUpdate(
      { taskOwnerId: taskerPaymentDetails[0].taskOwner },
      { pendingClerance: req.body.amount },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: payout
    });
  }

  // Send email to Listerbox admin requesting payout for tasker
  const tasker = req.user.name;
  const taskerId = req.user.id;
  const payoutAmount = req.body.amount;

  const message = `Hi Admin,\n\nTasker ${tasker} with ID of ${taskerId} has requested a payout of ₦${payoutAmount}, Please login to the dashboard to approve or decline this payout request.\n\nThanks,\nListerbox`;
  const email = 'hello@listerbox.com';

  try {
    await sendEmail({
      email,
      subject: `Payout Request`,
      message
    });
  } catch (err) {
    console.log(err);
  }
});

// @desc    Accept Payout
// @route   PUT /api/v2/payouts/acceptPayout/:Id
// @access  Private/Admin
exports.acceptPayout = asyncHandler(async (req, res, next) => {
  let payoutRequest = await Payout.findById(req.params.Id);

  if (!payoutRequest) {
    return next(
      new ErrorResponse(`No payout request id of ${req.params.Id}`, 404)
    );
  }

  let payout = await Payout.findOneAndUpdate(
    { _id: req.params.Id },
    { status: 'Paid' },
    { new: true, runValidators: true }
  );

  let earningDetails = await Earning.find({
    taskOwnerId: payoutRequest.taskOwner
  });

  const amountAvailableForWithdrawal = earningDetails[0].availableForWithdrawal;
  const earningWithdrawn = earningDetails[0].withdrawn;
  const amountWithdrawn = payoutRequest.amount;
  const pendingClerance = 0;

  // Total money withdrawn
  const totalWithdrawn = earningWithdrawn + amountWithdrawn;
  const availableWithdraw = amountAvailableForWithdrawal - totalWithdrawn;

  await Earning.findOneAndUpdate(
    { taskOwnerId: payoutRequest.taskOwner },
    {
      withdrawn: totalWithdrawn,
      availableForWithdrawal: availableWithdraw,
      pendingClerance
    },
    { new: true, runValidators: true }
  );

  // Send Email to tasker when payout is approved by admin
  let taskerDetails = await User.find({ _id: payoutRequest.taskOwner });

  const taskerName = taskerDetails[0].name;
  const taskerEmail = taskerDetails[0].email;

  const message = `Hi ${taskerName},\n\nYour payout of ₦${amountWithdrawn} has been approved, and transfered to your bank account.\n\nThanks,\nListerbox`;

  try {
    await sendEmail({
      email: taskerEmail,
      subject: 'Payout Approved',
      message
    });
  } catch (err) {
    console.log(err);
  }

  res.status(200).json({
    success: true,
    data: payout
  });
});

// @desc    Reject Payout
// @route   PUT /api/v2/payouts/rejectPayout/:Id
// @access  Private/Admin
exports.rejectPayout = asyncHandler(async (req, res, next) => {
  let payoutRequest = await Payout.findById(req.params.Id);

  if (!payoutRequest) {
    return next(
      new ErrorResponse(`No payout request id of ${req.params.Id}`, 404)
    );
  }

  let payout = await Payout.findOneAndUpdate(
    { _id: req.params.Id },
    { status: 'Rejected' },
    { new: true, runValidators: true }
  );

  let earningDetails = await Earning.find({
    taskOwnerId: payoutRequest.taskOwner
  });

  const amountAvailableForWithdrawal = earningDetails[0].availableForWithdrawal;
  const earningWithdrawn = earningDetails[0].withdrawn;
  const amountWithdrawn = payoutRequest.amount;
  const pendingClerance = 0;

  // Total money withdrawn
  const totalWithdrawn = earningWithdrawn + amountWithdrawn;
  const availableWithdraw = amountAvailableForWithdrawal - totalWithdrawn;

  await Earning.findOneAndUpdate(
    { taskOwnerId: payoutRequest.taskOwner },
    {
      withdrawn: totalWithdrawn,
      availableForWithdrawal: availableWithdraw,
      pendingClerance
    },
    { new: true, runValidators: true }
  );

  // Send Email to tasker when payout is approved by admin
  let taskerDetails = await User.find({ _id: payoutRequest.taskOwner });

  const taskerName = taskerDetails[0].name;
  const taskerEmail = taskerDetails[0].email;

  const message = `Hi ${taskerName},\n\nYour payout of ₦${amountWithdrawn} has been rejected, contact our customer care service for more details.\n\nThanks,\nListerbox`;

  try {
    await sendEmail({
      email: taskerEmail,
      subject: 'Payout Rejected',
      message
    });
  } catch (err) {
    console.log(err);
  }

  res.status(200).json({
    success: true,
    data: payout
  });
});
