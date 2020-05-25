const express = require('express');
const { addRequest } = require('../controllers/requests');

const Request = require('../controllers/requests');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.route('/').post(protect, authorize('User', 'Admin'), addRequest);

module.exports = router;
