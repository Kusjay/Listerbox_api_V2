const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the review'],
    maxlength: 100
  },
  text: {
    type: String,
    required: [true, 'Please add some text']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  task: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
});

// Prevent user from submitting more than one review per task
ReviewSchema.index({ task: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function (taskId) {
  const obj = await this.aggregate([
    {
      $match: { task: taskId }
    },
    {
      $group: {
        _id: '$task',
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    await this.model('Task').findByIdAndUpdate(taskId, {
      averageRating: obj[0].averageRating
    });
  } catch (err) {
    console.log(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.task);
});

// Call getAverageRating before remove
ReviewSchema.pre('remove', function () {
  this.constructor.getAverageRating(this.task);
});

module.exports = mongoose.model('Review', ReviewSchema);
