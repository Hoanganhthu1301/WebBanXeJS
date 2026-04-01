const mongoose = require("mongoose");

const revenueRowSchema = new mongoose.Schema(
  {
    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
    },
    carName: {
      type: String,
      default: "",
      trim: true,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "",
      trim: true,
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fullPaymentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    fullCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    fullyPaidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const revenueChartItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    fullPaymentRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    value: {
      type: Number,
      default: undefined,
      min: 0,
    },
  },
  { _id: false }
);

const revenueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["day", "month", "year"],
      required: true,
      trim: true,
    },

    filterDate: {
      type: String,
      default: null,
      trim: true,
    },

    filterMonth: {
      type: Number,
      default: null,
      min: 1,
      max: 12,
    },

    filterYear: {
      type: Number,
      required: true,
      min: 2000,
    },

    periodKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    depositRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    fullPaymentRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyRevenue: {
      type: [revenueChartItemSchema],
      default: [],
    },

    dailyRevenue: {
      type: [revenueChartItemSchema],
      default: [],
    },

    pieRevenue: {
      type: [revenueChartItemSchema],
      default: [],
    },

    rows: {
      type: [revenueRowSchema],
      default: [],
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

revenueSchema.index(
  { type: 1, filterDate: 1, filterMonth: 1, filterYear: 1 },
  { unique: true }
);

module.exports = mongoose.model("Revenue", revenueSchema);