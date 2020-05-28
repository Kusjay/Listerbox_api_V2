const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');

const RequestSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'Please add a location for your request'],
    maxlength: 100
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  time: {
    type: String
  },
  date: {
    type: String
  },
  description: {
    type: String,
    required: [true, 'Please add a description to your request']
  },
  status: {
    type: [String],
    required: true,
    enum: ['Init', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Init'
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
  },
  taskerID: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

// Geocode & create location field
RequestSchema.pre('save', async function (next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].zipcode,
    country: loc[0].countryCode
  };

  // Do not save address in DB
  this.address = undefined;
  next();
});

module.exports = mongoose.model('Request', RequestSchema);
