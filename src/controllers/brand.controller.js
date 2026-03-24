const Brand = require("../models/brand.model");

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách hãng thành công",
      brands,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy hãng",
      error: error.message,
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên hãng",
      });
    }

    const slug = slugify(name);

    const existingBrand = await Brand.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existingBrand) {
      return res.status(400).json({
        message: "Hãng đã tồn tại",
      });
    }

    const newBrand = await Brand.create({
      name: name.trim(),
      slug,
      status: status || "active",
    });

    return res.status(201).json({
      message: "Thêm hãng thành công",
      brand: newBrand,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi thêm hãng",
      error: error.message,
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên hãng",
      });
    }

    const slug = slugify(name);

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        slug,
        status: status || "active",
      },
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({
        message: "Không tìm thấy hãng",
      });
    }

    return res.status(200).json({
      message: "Cập nhật hãng thành công",
      brand: updatedBrand,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật hãng",
      error: error.message,
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const deletedBrand = await Brand.findByIdAndDelete(req.params.id);

    if (!deletedBrand) {
      return res.status(404).json({
        message: "Không tìm thấy hãng để xóa",
      });
    }

    return res.status(200).json({
      message: "Xóa hãng thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa hãng",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
};