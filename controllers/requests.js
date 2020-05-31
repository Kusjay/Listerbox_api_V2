const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Request = require('../models/Request');
const Task = require('../models/Task');
const Profile = require('../models/Profile');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Add request
// @route   POST /api/v1/tasks/:taskId/requests
// @access  Private
exports.addRequest = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    return next(
      new ErrorResponse(`No task with id of ${req.params.taskId}`, 404)
    );
  }

  let taskerDetails = await Task.findById(req.params.taskId);
  let taskerId = taskerDetails.user;

  req.body.task = req.params.taskId;
  req.body.user = req.user.id;
  req.body.taskerID = taskerId;

  const request = await Request.create(req.body);

  res.status(201).json({
    success: true,
    data: request
  });
});

// @desc    Show request to tasker
// @route   POST /api/v2/requests/showResquestTasker/:requestId
// @access  Private
exports.showRequestTasker = asyncHandler(async (req, res, next) => {
  let showRequest = await Request.findById(req.params.requestId).populate({
    path: 'task user',
    select: 'title name'
  });

  if (!showRequest) {
    return next(
      new ErrorResponse(
        `No request with the id of ${req.params.requestId}`,
        404
      )
    );
  }

  // Check if the request belongs to the tasker
  if (req.user.id !== showRequest.taskerID.toString()) {
    return next(
      new ErrorResponse(
        `Tasker ${req.user.id} is not authorized to access task request ${req.params.requestId}`
      )
    );
  }

  res.status(201).json({
    success: true,
    data: showRequest
  });
});

// @desc    Show request to user
// @route   POST /api/v2/requests/showResquestUser/:requestId
// @access  Private
exports.showRequestUser = asyncHandler(async (req, res, next) => {
  let showRequest = await Request.findById(req.params.requestId).populate({
    path: 'task user',
    select: 'title name'
  });

  if (!showRequest) {
    return next(
      new ErrorResponse(
        `No request with the id of ${req.params.requestId}`,
        404
      )
    );
  }

  // Check if the request belongs to the user
  if (req.user.id !== showRequest.user._id.toString()) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access task request ${req.params.requestId}`
      )
    );
  }

  res.status(201).json({
    success: true,
    data: showRequest
  });
});

// @desc    Accept request
// @route   PUT /api/v2/requests/acceptrequest/:id
// @access  Private
exports.acceptRequest = asyncHandler(async (req, res, next) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Check if the request belongs to the tasker
  if (req.user.id !== request.taskerID.toString()) {
    return next(
      new ErrorResponse(
        `Tasker ${req.user.id} is not authorized to access task request ${req.params.requestId}`
      )
    );
  }

  // Check if the request has been accepted, rejected, cancelled, or completed
  if (request.status == 'Accepted') {
    return next(new ErrorResponse(`Task ${request.task} has been accepted`));
  } else if (request.status == 'Rejected') {
    return next(new ErrorResponse(`Task ${request.task} has been rejected`));
  } else if (request.status == 'Completed') {
    return next(new ErrorResponse(`Task ${request.task} has been completed`));
  } else if (request.status == 'Cancelled') {
    return next(new ErrorResponse(`Task ${request.task} has been cancelled`));
  } else if (request.status == 'Init') {
    updateRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Accepted' },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updateRequest
    });

    // Send email to user that tasker has accepted the task
    let profile = await User.find({ _id: request.user });
    let userEmail = profile[0].email;
    let userName = profile[0].name;

    // Get the task title that matches the specific request
    let task = await Task.find({ _id: request.task });
    let taskName = task[0].title;
    let taskerName = req.user.name;

    const message = `Hi ${userName},\n\nTasker ${taskerName} has accepted the service '${taskName}'.`;

    try {
      await sendEmail({
        email: userEmail,
        subject: `Service accepted from ${taskerName}`,
        message
      });
    } catch (err) {
      console.log(err);
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    return next(new ErrorResponse('Not authorized to accept request', 401));
  }
});
