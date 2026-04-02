const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    salutation: { type: String, default: "", trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    street: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    zipCode: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    preferredContact: { type: String, enum: ["call", "email"], default: "call" },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    carName: { type: String, required: true, trim: true },
    country: { type: String, default: "Việt Nam", trim: true },
    budget: { type: String, default: "", trim: true },
    mileage: { type: String, default: "", trim: true },
    year: { type: String, default: "", trim: true },
    reason: { type: String, default: "", trim: true },
    additionalInfo: { type: String, default: "", trim: true },
    status: {
      type: String,
      // Đã giữ lại "new" và "contacted" của bạn, thêm các trạng thái quy trình
      enum: ["new", "processing", "contacted", "resolved", "cancelled"],
      default: "new",
    },
    // THÊM: Ghi chú dành riêng cho Admin (Khách không thấy)
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);