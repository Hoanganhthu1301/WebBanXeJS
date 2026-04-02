const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
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
    province: {
      type: String,
      default: "Việt Nam",
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
      enum: ["new", "quoted", "done"],
      default: "new",
    },
    adminReply: {
        type: String,
        default: "",
        trim: true,
        },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quotation", quotationSchema);