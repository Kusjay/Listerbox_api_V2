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
  pendingClerance: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Earning', EarningSchema);
