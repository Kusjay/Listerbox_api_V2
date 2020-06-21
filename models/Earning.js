const mongoose = require('mongoose');

const EarningSchema = new mongoose.Schema({
  netIncome: {
    type: Number,
    default: 0
  },
  withdrawn: {
    type: Number,
    default: 0
  },
  availableForWithdrawal: {
    type: Number,
    default: 0
  },
  taskOwnerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  taskId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  },
  paymentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Payment'
  },
  referenceId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Earning', EarningSchema);
