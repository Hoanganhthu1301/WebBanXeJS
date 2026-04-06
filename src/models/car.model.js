const mongoose = require("mongoose");

const highlightSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    text: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const featureSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    text: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const carSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },

    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    year: {
      type: Number,
      default: new Date().getFullYear(),
    },
    fuel: {
      type: String,
      default: "Xăng",
    },
    transmission: {
      type: String,
      default: "Tự động",
    },
    mileage: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    model3dUrl: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },
    overviewTitle: {
      type: String,
      default: "",
    },
    overviewText: {
      type: String,
      default: "",
    },

    highlights: {
      type: [highlightSchema],
      default: [],
    },

    features: {
      type: [featureSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["available", "reserved", "sold", "hidden"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Car", carSchema);