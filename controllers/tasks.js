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
