const express = require('express');
const {
  addRequest,
  showRequestTasker,
  showRequestUser,
  acceptRequest,
  userCompleteRequest,
  taskerCompleteRequest,
  taskerRejectRequest,
  userCancelRequest,
  getRequests,
  getRequest,
  updateRequest,
  deleteRequest
} = require('../controllers/requests');

const Request = require('../models/Request');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('User', 'Admin'), addRequest)
  .get(
    protect,
    authorize('Admin'),
    advancedResults(Request, { path: 'task', select: 'title' }),
    getRequests
  );

router
  .route('/:id')
  .get(protect, authorize('Admin'), getRequest)
  .put(protect, authorize('User', 'Admin'), updateRequest)
  .delete(protect, authorize('Admin'), deleteRequest);

router
  .route('/showRequestTasker/:requestId')
  .get(protect, authorize('Tasker', 'Admin'), showRequestTasker);

router
  .route('/showRequestUser/:requestId')
  .get(protect, authorize('User', 'Admin'), showRequestUser);

router
  .route('/acceptrequest/:id')
  .put(protect, authorize('Tasker', 'Admin'), acceptRequest);

router
  .route('/usercompleterequest/:id')
  .put(protect, authorize('User', 'Admin'), userCompleteRequest);

router
  .route('/taskercompleterequest/:id')
  .put(protect, authorize('Tasker', 'Admin'), taskerCompleteRequest);

router
  .route('/taskerrejectrequest/:id')
  .put(protect, authorize('Tasker', 'Admin'), taskerRejectRequest);

router
  .route('/usercancelrequest/:id')
  .put(protect, authorize('User', 'Admin'), userCancelRequest);

module.exports = router;
