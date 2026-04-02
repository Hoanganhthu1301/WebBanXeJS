const Quotation = require("../models/quotation.model");
const Car = require("../models/car.model");
const { sendRequestReplyEmail } = require("../utils/mailer");

const createQuotation = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      province,
      carId,
      additionalInfo,
    } = req.body;

    if (!firstName || !lastName || !phone || !carId) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, số điện thoại và xe cần báo giá",
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Xe không tồn tại" });
    }

    const quotation = await Quotation.create({
      firstName,
      lastName,
      phone,
      email,
      province,
      carId: car._id,
      carName: car.name,
      additionalInfo,
    });

    return res.status(201).json({
      message: "Gửi yêu cầu báo giá thành công",
      quotation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi gửi yêu cầu báo giá",
      error: error.message,
    });
  }
};

const getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("carId", "name brand category price image images")
      .sort({ createdAt: -1 });

    return res.status(200).json({ quotations });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách báo giá",
      error: error.message,
    });
  }
};

const updateQuotationStatus = async (req, res) => {
  try {
    const { status, adminReply } = req.body;

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status, adminReply },
      { new: true, runValidators: true }
    );
    if (quotation.email && adminReply) {
    await sendRequestReplyEmail({
        to: quotation.email,
        customerName: `${quotation.lastName} ${quotation.firstName}`,
        carName: quotation.carName,
        requestType: "quotation",
        status,
        adminReply,
        extraInfo: quotation.province ? `Khu vực: ${quotation.province}` : "",
    });
    }

    return res.status(200).json({
      message: "Cập nhật yêu cầu báo giá thành công",
      quotation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật yêu cầu báo giá",
      error: error.message,
    });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const deleted = await Quotation.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy yêu cầu báo giá" });
    }

    return res.status(200).json({
      message: "Xóa yêu cầu báo giá thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa yêu cầu báo giá",
      error: error.message,
    });
  }
};

module.exports = {
  createQuotation,
  getAllQuotations,
  updateQuotationStatus,
  deleteQuotation,
};