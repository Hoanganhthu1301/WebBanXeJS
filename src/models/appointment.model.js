const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["view", "test_drive"],
      required: true,
      default: "view",
    },
    appointmentDate: {
      type: String,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    carName: {
      type: String,
      required: true,
      trim: true,
    },
    additionalInfo: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "done", "cancelled"],
      default: "pending",
    },
    adminReply: {
        type: String,
        default: "",
        trim: true,
        },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);