const Appointment = require("../models/appointment.model");
const Car = require("../models/car.model");
const { sendRequestReplyEmail } = require("../utils/mailer");

const createAppointment = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      type,
      appointmentDate,
      appointmentTime,
      location,
      carId,
      additionalInfo,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !appointmentDate ||
      !appointmentTime ||
      !location ||
      !carId
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin lịch hẹn",
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: "Xe không tồn tại" });
    }

    const appointment = await Appointment.create({
      firstName,
      lastName,
      phone,
      email,
      type: type || "view",
      appointmentDate,
      appointmentTime,
      location,
      carId: car._id,
      carName: car.name,
      additionalInfo,
    });

    return res.status(201).json({
      message: "Đặt lịch thành công",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi đặt lịch",
      error: error.message,
    });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("carId", "name brand category price image images")
      .sort({ createdAt: -1 });

    return res.status(200).json({ appointments });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách lịch hẹn",
      error: error.message,
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, adminReply } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, adminReply },
      { new: true, runValidators: true }
    );

   if (appointment.email && adminReply) {
    await sendRequestReplyEmail({
        to: appointment.email,
        customerName: `${appointment.lastName} ${appointment.firstName}`,
        carName: appointment.carName,
        requestType: appointment.type === "test_drive" ? "test_drive" : "view",
        status,
        adminReply,
        extraInfo: `
        Ngày: ${appointment.appointmentDate || "—"}<br/>
        Giờ: ${appointment.appointmentTime || "—"}<br/>
        Địa điểm: ${appointment.location || "—"}
        `,
    });
    }

    return res.status(200).json({
      message: "Cập nhật lịch hẹn thành công",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật lịch hẹn",
      error: error.message,
    });
  }
};
const deleteAppointment = async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy lịch hẹn" });
    }

    return res.status(200).json({
      message: "Xóa lịch hẹn thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa lịch hẹn",
      error: error.message,
    });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
};