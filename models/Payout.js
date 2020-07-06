const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  amount: {
    type: Number,
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
    enum: ['Pending', 'Paid', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payout', PayoutSchema);
