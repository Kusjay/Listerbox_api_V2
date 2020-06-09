const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Task = require('../models/Task');
const Request = require('../models/Request');

// @desc    Add review
// @route   GET /api/v2/tasks/:taskId/reviews
// @access  Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.task = req.params.taskId;
  req.body.user = req.user.id;

  const task = await Task.findById(req.params.taskId);

  if (!task) {
    return next(
      new ErrorResponse(`No task with id of ${req.params.taskId}`, 404)
    );
  }

  // Make sure the request is completed before submitting a review
  let request = await Request.find({ task: req.params.taskId });

  if (!request) {
    return next(
      new ErrorResponse(`No request with the id of ${req.params.id}`, 404)
    );
  }

  let requestStatus = request[0].status[0];

  if (requestStatus !== 'Completed') {
    return next(
      new ErrorResponse(
        `This Service request '${task.title}' has not been completed`
      )
    );
  }

  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});
