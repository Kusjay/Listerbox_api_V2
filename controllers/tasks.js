const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Task = require('../models/Task');
const Profile = require('../models/Profile');

// @desc    Add task
// @route   POST /api/v2/profiles/:profileId/tasks
// @access  Private
exports.addTask = asyncHandler(async (req, res, next) => {
  req.body.profile = req.params.profileId;
  req.body.user = req.user.id;

  const profile = await Profile.findById(req.params.profileId);

  if (!profile) {
    return next(
      new ErrorResponse(`No profile with id of ${req.params.profileId}`),
      404
    );
  }

  // Make sure user is profile owner
  if (profile.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a task to profile ${profile._id}`,
        401
      )
    );
  }

  const task = await Task.create(req.body);

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    GET all task
// @route   GET /api/v2/tasks
// @route   GET /api/v2/profiles/:profileId/tasks
// @access  Public
exports.getTasks = asyncHandler(async (req, res, next) => {
  if (req.params.profileId) {
    const tasks = await Task.find({ profile: req.params.profileId });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single task
// @route   GET /api/v2/tasks/:id
// @access  Public

exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id).populate({
    path: 'profile',
    select: 'name description'
  });

  if (!task) {
    return next(new ErrorResponse(`No task with id of ${req.params.id}`), 404);
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/v2/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`No task with id of ${req.params.id}`), 404);
  }

  // Make sure the user is the owner of the task
  if (task.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update task ${task._id}`,
        401
      )
    );
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete Task
// @route   DELETE /api/v2/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse(`No task with id of ${req.params.id}`), 404);
  }

  // Make sure the user is the owner of the task
  if (task.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete task ${task._id}`,
        401
      )
    );
  }

  await task.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
