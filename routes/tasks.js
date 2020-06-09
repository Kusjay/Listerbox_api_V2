const express = require('express');
const {
  addTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
} = require('../controllers/tasks');

const Task = require('../models/Task');

// Include other resource routers
const requestRouter = require('./requests');
const reviewRouter = require('./reviews');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:taskId/requests', requestRouter);
router.use('/:taskId/reviews', reviewRouter);

router
  .route('/')
  .post(protect, authorize('Tasker', 'Admin'), addTask)
  .get(
    advancedResults(Task, {
      path: 'profile',
      select: 'name'
    }),
    getTasks
  );

router
  .route('/:id')
  .get(getTask)
  .put(protect, authorize('Tasker', 'Admin'), updateTask)
  .delete(protect, authorize('Tasker', 'Admin'), deleteTask);

module.exports = router;
