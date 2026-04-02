const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    // Thông tin định danh & cá nhân (Giữ từ bản của Quân)
    salutation: { type: String, default: "", trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    
    // Thông tin địa chỉ chi tiết (Giữ từ bản của Quân)
    street: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    zipCode: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    country: { type: String, default: "Việt Nam", trim: true },

    // Thông tin liên lạc
    preferredContact: { type: String, enum: ["call", "email"], default: "call" },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },

    // Thông tin xe quan tâm (Giữ từ bản của Quân)
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    carName: { type: String, required: true, trim: true },
    budget: { type: String, default: "", trim: true },
    mileage: { type: String, default: "", trim: true },
    year: { type: String, default: "", trim: true },

    // Nội dung yêu cầu
    reason: { type: String, default: "", trim: true },
    additionalInfo: { type: String, default: "", trim: true },

    // Quản lý trạng thái (Gộp cả hai bản)
    status: {
      type: String,
      enum: ["new", "processing", "contacted", "resolved", "cancelled"],
      default: "new",
    },

    // PHẦN QUAN TRỌNG: Gộp nội dung phản hồi của Thư và ghi chú của Quân
    adminReply: { type: String, default: "", trim: true }, // Nội dung gửi cho khách
    adminNote: { type: String, default: "", trim: true },  // Ghi chú nội bộ của Admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);