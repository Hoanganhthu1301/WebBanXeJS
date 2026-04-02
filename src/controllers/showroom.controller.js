const Showroom = require("../models/showroom.model");

const getAllShowrooms = async (req, res) => {
  try {
    const showrooms = await Showroom.find({ status: "active" }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách showroom thành công",
      showrooms,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy showroom",
      error: error.message,
    });
  }
};

const getAdminShowrooms = async (req, res) => {
  try {
    const showrooms = await Showroom.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách showroom admin thành công",
      showrooms,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy showroom admin",
      error: error.message,
    });
  }
};

const createShowroom = async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      openHours,
      latitude,
      longitude,
      supportedBrands,
      status,
      note,
    } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ tên, địa chỉ, latitude và longitude",
      });
    }

    const showroom = await Showroom.create({
      name: String(name).trim(),
      address: String(address).trim(),
      phone: phone || "",
      openHours: openHours || "",
      latitude: Number(latitude),
      longitude: Number(longitude),
      supportedBrands: Array.isArray(supportedBrands)
        ? supportedBrands
        : typeof supportedBrands === "string" && supportedBrands.trim()
        ? supportedBrands.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
      status: status || "active",
      note: note || "",
    });

    return res.status(201).json({
      message: "Thêm showroom thành công",
      showroom,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi thêm showroom",
      error: error.message,
    });
  }
};

const updateShowroom = async (req, res) => {
  try {
    const showroom = await Showroom.findById(req.params.id);

    if (!showroom) {
      return res.status(404).json({
        message: "Không tìm thấy showroom",
      });
    }

    const {
      name,
      address,
      phone,
      openHours,
      latitude,
      longitude,
      supportedBrands,
      status,
      note,
    } = req.body;

    if (name !== undefined) showroom.name = String(name).trim();
    if (address !== undefined) showroom.address = String(address).trim();
    if (phone !== undefined) showroom.phone = phone;
    if (openHours !== undefined) showroom.openHours = openHours;
    if (latitude !== undefined) showroom.latitude = Number(latitude);
    if (longitude !== undefined) showroom.longitude = Number(longitude);
    if (supportedBrands !== undefined) {
      showroom.supportedBrands = Array.isArray(supportedBrands)
        ? supportedBrands
        : typeof supportedBrands === "string" && supportedBrands.trim()
        ? supportedBrands.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
    }
    if (status !== undefined) showroom.status = status;
    if (note !== undefined) showroom.note = note;

    await showroom.save();

    return res.status(200).json({
      message: "Cập nhật showroom thành công",
      showroom,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật showroom",
      error: error.message,
    });
  }
};

const deleteShowroom = async (req, res) => {
  try {
    const showroom = await Showroom.findById(req.params.id);

    if (!showroom) {
      return res.status(404).json({
        message: "Không tìm thấy showroom",
      });
    }

    await showroom.deleteOne();

    return res.status(200).json({
      message: "Xóa showroom thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa showroom",
      error: error.message,
    });
  }
};

module.exports = {
  getAllShowrooms,
  getAdminShowrooms,
  createShowroom,
  updateShowroom,
  deleteShowroom,
};