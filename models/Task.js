const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'Please add a task name']
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    price: {
      type: Number,
      required: [true, 'Please add a price']
    },
    averageRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating can not be more than 5']
    },
    categories: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        'Catering',
        'Handyman',
        'Cleaning Service',
        'Laundry Service',
        'House Help',
        'Delivery Service',
        'Electrician',
        'Generator Repairer',
        'Plumbing',
        'Painting',
        'Help Moving',
        'Grocery Shopping & Delivery'
      ]
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    profile: {
      type: mongoose.Schema.ObjectId,
      ref: 'Profile',
      required: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Cascade delete requests when a task is deleted
TaskSchema.pre('remove', async function (next) {
  await this.model('Request').deleteMany({ task: this._id });
});

// Reverse populate with virtuals for Requests
TaskSchema.virtual('request', {
  ref: 'Request',
  localField: '_id',
  foreignField: 'task',
  justOne: false
});

module.exports = mongoose.model('Task', TaskSchema);
