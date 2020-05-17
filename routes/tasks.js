const express = require('express');
const { addTask } = require('../controllers/tasks');

const Task = require('../models/Task');

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');

router.route('/').post(protect, authorize('Tasker', 'Admin'), addTask);

module.exports = router;
