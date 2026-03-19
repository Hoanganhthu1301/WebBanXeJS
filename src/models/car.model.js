const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      default: new Date().getFullYear()
    },
    fuel: {
      type: String,
      default: 'Xăng'
    },
    transmission: {
      type: String,
      default: 'Tự động'
    },
    mileage: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['available', 'hidden'],
      default: 'available'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Car', carSchema);