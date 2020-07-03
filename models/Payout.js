const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  task: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task',
    required: true
  },
  referenceId: {
    type: String,
    required: true
  },
  taskOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: [String],
    required: true,
    enum: ['Init', 'Paid', 'Rejected'],
    default: 'Init'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payout', PayoutSchema);
