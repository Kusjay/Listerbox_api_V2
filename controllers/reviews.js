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

// @desc    Get all reviews
// @route   GET /api/v2/reviews
// @route   GET /api/v2/tasks/:taskId/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.taskId) {
    const reviews = await Review.find({ task: req.params.taskId });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get a single review
// @desc    GET /api/v2/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'task',
    select: 'title'
  });

  if (!review) {
    return next(
      new ErrorResponse(`No review found with the id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v2/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(new ErrorResponse(`No review with id ${req.params.id}`, 404));
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse(`Not authorized to update review`, 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/v2/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure the review belongs to the user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse(`Not authorized to delete review`, 401));
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
