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

    // Get user detail
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

// @desc    Complete request for user
// @route   PUT /api/v2/requests/usercompleterequest/:id
// @access  Private
exports.userCompleteRequest = asyncHandler(async (req, res, next) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Check if the user created the request
  if (request.user != req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to mark this service as completed`
      )
    );
  }

  // Check if the request has been accepted, rejected, cancelled, or completed
  if (request.status == 'Init') {
    return next(new ErrorResponse(`Task ${request.task} has been started`));
  } else if (request.status == 'Rejected') {
    return next(new ErrorResponse(`Task ${request.task} has been rejected`));
  } else if (request.status == 'Completed') {
    return next(new ErrorResponse(`Task ${request.task} has been completed`));
  } else if (request.status == 'Cancelled') {
    return next(new ErrorResponse(`Task ${request.task} has been cancelled`));
  } else if (request.status == 'Accepted') {
    updateRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed' },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updateRequest
    });

    // Get user detail
    let profile = await User.find({ _id: request.user });
    let userEmail = profile[0].email;
    let userName = profile[0].name;

    // Get the task title that matches the specific request
    let task = await Task.find({ _id: request.task });
    let taskName = task[0].title;
    let taskerName = req.user.name;

    // Get the Tasker's email
    let tasker = await User.find({ _id: request.taskerID });
    let taskerEmail = tasker[0].email;

    const message = `Hi ${taskerName},\n\n${userName} has marked the service '${taskName}' as completed.`;

    try {
      await sendEmail({
        email: taskerEmail,
        subject: `Service '${taskName}' completed by ${userName}`,
        message
      });
    } catch (err) {
      console.log(err);
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    return next(new ErrorResponse('Not authorized to complete request', 401));
  }
});

// @desc    Complete request for tasker
// @route   PUT /api/v2/requests/taskercompleterequest/:id
// @access  Private
exports.taskerCompleteRequest = asyncHandler(async (req, res, next) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Check if the tasker owns the request
  if (request.taskerID != req.user.id) {
    return next(
      new ErrorResponse(
        `Tasker ${req.user.id} is not authorized to mark this service as completed`
      )
    );
  }

  // Check if the request has been accepted, rejected, cancelled, or completed
  if (request.status == 'Init') {
    return next(new ErrorResponse(`Task ${request.task} has been started`));
  } else if (request.status == 'Rejected') {
    return next(new ErrorResponse(`Task ${request.task} has been rejected`));
  } else if (request.status == 'Completed') {
    return next(new ErrorResponse(`Task ${request.task} has been completed`));
  } else if (request.status == 'Cancelled') {
    return next(new ErrorResponse(`Task ${request.task} has been cancelled`));
  } else if (request.status == 'Accepted') {
    updateRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed' },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updateRequest
    });

    // Get user detail
    let profile = await User.find({ _id: request.user });
    let userEmail = profile[0].email;
    let userName = profile[0].name;

    // Get the task title that matches the specific request
    let task = await Task.find({ _id: request.task });
    let taskName = task[0].title;
    let taskerName = req.user.name;

    // Get the Tasker's email
    let tasker = await User.find({ _id: request.taskerID });
    let taskerEmail = tasker[0].email;

    const message = `Hi ${userName},\n\nTasker ${taskerName} has marked the service '${taskName}' as completed. Login into your dashboard to mark this service as completed, If you're satisfied with the service.`;

    try {
      await sendEmail({
        email: userEmail,
        subject: `Service '${taskName}' completed by Tasker ${taskerName}`,
        message
      });
    } catch (err) {
      console.log(err);
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    return next(new ErrorResponse('Not authorized to complete request', 401));
  }
});

// @desc    Reject request for tasker
// @route   PUT /api/v2/requests/taskerrejectrequest/:id
// @access  Private
exports.taskerRejectRequest = asyncHandler(async (req, res, next) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Check if the tasker owns the request
  if (request.taskerID != req.user.id) {
    return next(
      new ErrorResponse(
        `Tasker ${req.user.id} is not authorized to reject this service`
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
      { status: 'Rejected' },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updateRequest
    });

    // Get user detail
    let profile = await User.find({ _id: request.user });
    let userEmail = profile[0].email;
    let userName = profile[0].name;

    // Get the task title that matches the specific request
    let task = await Task.find({ _id: request.task });
    let taskName = task[0].title;
    let taskerName = req.user.name;

    // Get the Tasker's email
    let tasker = await User.find({ _id: request.taskerID });
    let taskerEmail = tasker[0].email;

    const message = `Hi ${userName},\n\nTasker ${taskerName} has rejected the service '${taskName}'`;

    try {
      await sendEmail({
        email: userEmail,
        subject: `Service '${taskName}' rejected by Tasker ${taskerName}`,
        message
      });
    } catch (err) {
      console.log(err);
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    return next(new ErrorResponse('Not authorized to reject request', 401));
  }
});

// @desc    Cancel request for user
// @route   PUT /api/v2/requests/usercancelrequest/:id
// @access  Private
exports.userCancelRequest = asyncHandler(async (req, res, next) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Check if the tasker owns the request
  if (request.user != req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to cancel this service`
      )
    );
  }

  // Check if the request has been accepted, rejected, cancelled, or completed
  if (request.status == 'Init') {
    return next(new ErrorResponse(`Task ${request.task} has been Initiated`));
  } else if (request.status == 'Rejected') {
    return next(new ErrorResponse(`Task ${request.task} has been rejected`));
  } else if (request.status == 'Completed') {
    return next(new ErrorResponse(`Task ${request.task} has been completed`));
  } else if (request.status == 'Cancelled') {
    return next(new ErrorResponse(`Task ${request.task} has been cancelled`));
  } else if (request.status == 'Accepted') {
    updateRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updateRequest
    });

    // Get user detail
    let profile = await User.find({ _id: request.user });
    let userEmail = profile[0].email;
    let userName = profile[0].name;

    // Get the task title that matches the specific request
    let task = await Task.find({ _id: request.task });
    let taskName = task[0].title;

    // Get the Tasker's email
    let tasker = await User.find({ _id: request.taskerID });
    let taskerEmail = tasker[0].email;
    let taskerName = tasker[0].name;

    const message = `Hi ${taskerName},\n\n${userName} has cancelled the service '${taskName}'`;

    try {
      await sendEmail({
        email: taskerEmail,
        subject: `Service '${taskName}' cancelled by ${userName}`,
        message
      });
    } catch (err) {
      console.log(err);
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } else {
    return next(
      new ErrorResponse('Not authorized to cancel this request', 401)
    );
  }
});

// @desc    Get all requests
// @desc    GET /api/v2/requests
// @route   GET /api/v2/tasks/:taskId/requests
// @access  Private
exports.getRequests = asyncHandler(async (req, res, next) => {
  if (req.params.taskId) {
    const requests = await Request.find({ task: req.params.taskId });

    if (!requests) {
      return next(
        new ErrorResponse(
          `No request found with the id of ${req.params.id}`,
          404
        )
      );
    }

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single request
// @desc    GET /api/v2/requests/:id
// @access  Private
exports.getRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id).populate({
    path: 'task',
    select: 'title'
  });

  if (!request) {
    return next(
      new ErrorResponse(`No request found with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Update request
// @route   PUT /api/v2/request/:id
// @access  Private
exports.updateRequest = asyncHandler(async (req, res, next) => {
  let request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure the request belongs to user or the user is an admin
  if (request.user.toString() != req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse(`Not authorized to update request`, 401));
  }

  request = await Request.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Delete request
// @route   DELETE /api/v2/request/:id
// @access  Private/Admin
exports.deleteRequest = asyncHandler(async (req, res, next) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure only admin can delete request
  if (req.user.role !== 'Admin') {
    return next(new ErrorResponse(`Not authorized to delete request`, 401));
  }

  await request.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
