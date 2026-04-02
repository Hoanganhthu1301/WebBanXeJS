const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    fullName: {
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
    note: {
      type: String,
      default: "",
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
    carPrice: {
      type: Number,
      default: 0,
    },

    depositPercent: {
      type: Number,
      default: 5,
    },
    depositAmount: {
      type: Number,
      required: true,
    },

    vatAmount: {
      type: Number,
      default: 0,
    },
    registrationFee: {
      type: Number,
      default: 0,
    },
    licensePlateFee: {
      type: Number,
      default: 20000000,
    },
    insuranceFee: {
      type: Number,
      default: 1560000,
    },

    totalEstimatedPrice: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },

    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      default: null,
    },
    promotionTitle: {
      type: String,
      default: "",
      trim: true,
    },
    promotionType: {
      type: String,
      enum: ["amount", "percent", "gift", ""],
      default: "",
    },
    promotionValue: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalEstimatedPrice: {
      type: Number,
      default: 0,
    },

    pickupDate: {
      type: String,
      default: "",
      trim: true,
    },
    pickupTimeSlot: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryMethod: {
      type: String,
      enum: ["showroom", "home_delivery"],
      default: "showroom",
    },
    showroom: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryAddress: {
      type: String,
      default: "",
      trim: true,
    },

    orderCode: {
      type: Number,
      default: null,
      index: true,
    },
    checkoutUrl: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["manual", "payos"],
      default: "payos",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "cancelled", "failed"],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "confirmed",
        "waiting_full_payment",
        "ready_to_deliver",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "pending_payment",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedStaffName: {
      type: String,
      default: "",
      trim: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    confirmedByName: {
      type: String,
      default: "",
      trim: true,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },

    fullPaymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", ""],
      default: "",
    },
    fullPaymentAmount: {
      type: Number,
      default: 0,
    },
    fullyPaidAt: {
      type: Date,
      default: null,
    },

    invoiceImage: {
      type: String,
      default: "",
      trim: true,
    },
    invoiceNote: {
      type: String,
      default: "",
      trim: true,
    },
    invoiceUploadedAt: {
      type: Date,
      default: null,
    },
    invoiceUploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    refundStatus: {
      type: String,
      enum: ["none", "pending_refund", "refunded", "forfeited"],
      default: "none",
    },
    refundReason: {
      type: String,
      default: "",
      trim: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundAt: {
      type: Date,
      default: null,
    },
    refundBankBin: {
      type: String,
      default: "",
      trim: true,
    },
    refundBankAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    refundBankAccountName: {
      type: String,
      default: "",
      trim: true,
    },
    refundReferenceId: {
      type: String,
      default: "",
      trim: true,
    },
    refundMethod: {
      type: String,
      enum: ["", "payos_payout", "manual", "payos_payout_failed"],
      default: "",
    },

    refundGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    refundConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    refundConfirmedAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelledByRole: {
      type: String,
      enum: ["admin", "user", ""],
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deposit", depositSchema);