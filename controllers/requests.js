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
