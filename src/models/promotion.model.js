const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["amount", "percent", "gift"],
      required: true,
    },

    value: {
      type: Number,
      default: 0,
      min: 0,
    },

    giftItems: {
      type: [String],
      default: [],
    },

    applyScope: {
      type: String,
      enum: ["all", "brand", "car"],
      required: true,
      default: "all",
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    carIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
      },
    ],

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);