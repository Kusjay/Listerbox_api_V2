const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Profile = require('../models/Profile');

// @desc    Get all profiles
// @route   GET /api/v2/profiles
// @access  Public
// exports.getProfiles = asyncHandler(async (req, res, next) => {
//   res.status(200).json(res.advancedResults);
// });

// @desc    Create new profile
// @route   GET /api/v2/profiles
// @access  Private
exports.createProfile = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check for created profile
  const createdProfile = await Profile.findOne({ user: req.user.id });

  // If the user is not an admin, they can only create one profile
  if (createdProfile && req.user.role !== 'Admin') {
    return next(
      new ErrorResponse(
        `The user with id ${req.user.id} has already created a profile`,
        400
      )
    );
  }

  const profile = await Profile.create(req.body);

  res.status(201).json({
    success: true,
    data: profile
  });
});
