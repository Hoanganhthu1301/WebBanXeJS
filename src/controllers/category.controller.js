const Category = require("../models/category.model");

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách danh mục thành công",
      categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh mục",
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên danh mục",
      });
    }

    const slug = slugify(name);

    const existingCategory = await Category.findOne({
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Danh mục đã tồn tại",
      });
    }

    const newCategory = await Category.create({
      name: name.trim(),
      slug,
      status: status || "active",
    });

    return res.status(201).json({
      message: "Thêm danh mục thành công",
      category: newCategory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi thêm danh mục",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Vui lòng nhập tên danh mục",
      });
    }

    const slug = slugify(name);

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        slug,
        status: status || "active",
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
      });
    }

    return res.status(200).json({
      message: "Cập nhật danh mục thành công",
      category: updatedCategory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật danh mục",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if (!deletedCategory) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục để xóa",
      });
    }

    return res.status(200).json({
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa danh mục",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};