const Contact = require("../models/contact.model");
const Car = require("../models/car.model");
const { sendRequestReplyEmail } = require("../utils/mailer"); 

const createContact = async (req, res) => {
  try {
    const {
      salutation, firstName, lastName, company, street,
      district, zipCode, city, preferredContact, phone,
      email, carId, country, budget, mileage, year,
      reason, additionalInfo,
    } = req.body;

    if (!firstName || !lastName || !phone || !carId) {
      return res.status(400).json({
        message: "Vui lòng nhập họ, tên, số điện thoại và chọn xe",
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        message: "Xe không tồn tại",
      });
    }

    const newContact = await Contact.create({
      salutation: salutation || "",
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company || "",
      street: street || "",
      district: district || "",
      zipCode: zipCode || "",
      city: city || "",
      preferredContact: preferredContact || "call",
      phone: phone.trim(),
      email: (email || "").trim(),
      carId: car._id,
      carName: car.name,
      country: country || "Việt Nam",
      budget: budget || "",
      mileage: mileage || "",
      year: year || "",
      reason: reason || "",
      additionalInfo: (additionalInfo || "").trim(),
    });

    // TÍNH NĂNG CỦA QUÂN: Tự động gửi email xác nhận ngay khi khách gửi yêu cầu
    if (newContact.email) {
      // Tận dụng hàm mailer của Thư để gửi mail xác nhận nhanh
      sendRequestReplyEmail({
        to: newContact.email,
        customerName: `${newContact.lastName} ${newContact.firstName}`,
        carName: car.name,
        requestType: "consultation",
        status: "new",
        adminReply: "Chúng tôi đã nhận được yêu cầu của bạn và sẽ liên hệ sớm nhất qua số điện thoại này.",
      }).catch(err => console.log('Lỗi gửi mail xác nhận tự động:', err));
    }

    return res.status(201).json({
      message: "Gửi yêu cầu tư vấn thành công",
      contact: newContact,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi gửi yêu cầu tư vấn",
      error: error.message,
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("carId", "name brand category price image images")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách yêu cầu tư vấn thành công",
      contacts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách yêu cầu",
      error: error.message,
    });
  }
};

const updateContactStatus = async (req, res) => {
  try {
    // GỘP: Lấy cả status, adminReply (của Thư) và adminNote (của Quân)
    const { status, adminReply, adminNote } = req.body;

    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminReply, 
        adminNote // Lưu lại ghi chú nội bộ của Admin nếu cần
      },
      { new: true, runValidators: true }
    );

    if (!updatedContact) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu tư vấn",
      });
    }

    // TÍNH NĂNG CỦA THƯ: Gửi email khi Admin phản hồi khách
    if (updatedContact.email && adminReply) {
      await sendRequestReplyEmail({
        to: updatedContact.email,
        customerName: `${updatedContact.lastName} ${updatedContact.firstName}`,
        carName: updatedContact.carName,
        requestType: "consultation",
        status,
        adminReply,
      });
    }

    return res.status(200).json({
      message: "Cập nhật yêu cầu thành công",
      contact: updatedContact,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật yêu cầu",
      error: error.message,
    });
  }
};

const deleteContact = async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedContact) {
      return res.status(404).json({
        message: "Không tìm thấy yêu cầu để xóa",
      });
    }
    return res.status(200).json({
      message: "Xóa yêu cầu tư vấn thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa yêu cầu",
      error: error.message,
    });
  }
};

module.exports = {
  createContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
};