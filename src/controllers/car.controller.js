const Car = require("../models/car.model");

// USER
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find({ status: "available" }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách xe thành công",
      cars,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách xe",
      error: error.message,
    });
  }
};

// ADMIN
const getAllCarsForAdmin = async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách xe cho admin thành công",
      cars,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách xe admin",
      error: error.message,
    });
  }
};

const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        message: "Không tìm thấy xe",
      });
    }

    return res.status(200).json({
      message: "Lấy chi tiết xe thành công",
      car,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy chi tiết xe",
      error: error.message,
    });
  }
};

const createCar = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      year,
      fuel,
      transmission,
      mileage,
      color,
      image,
      images,
      description,
      overviewTitle,
      overviewText,
      highlights,
      features,
      status,
    } = req.body;

    if (!name || !brand || !category || !price) {
      return res.status(400).json({
        message: "Vui lòng nhập tên xe, hãng xe, danh mục và giá",
      });
    }

    const newCar = await Car.create({
      name: String(name).trim(),
      brand: String(brand).trim(),
      category: String(category).trim(),
      price: Number(price),
      year: year ? Number(year) : new Date().getFullYear(),
      fuel: fuel || "Xăng",
      transmission: transmission || "Tự động",
      mileage: mileage ? Number(mileage) : 0,
      color: color || "",
      image: image || "",
      images: Array.isArray(images) ? images : [],
      description: description || "",
      overviewTitle: overviewTitle || "",
      overviewText: overviewText || "",
      highlights: Array.isArray(highlights) ? highlights : [],
      features: Array.isArray(features) ? features : [],
      status: status || "available",
    });

    return res.status(201).json({
      message: "Thêm xe thành công",
      car: newCar,
    });
  } catch (error) {
    console.error("CREATE CAR ERROR:", error);
    return res.status(500).json({
      message: "Lỗi server khi thêm xe",
      error: error.message,
    });
  }
};

const updateCar = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      year,
      fuel,
      transmission,
      mileage,
      color,
      image,
      images,
      description,
      overviewTitle,
      overviewText,
      highlights,
      features,
      status,
    } = req.body;

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      {
        name,
        brand,
        category,
        price: price ? Number(price) : price,
        year: year ? Number(year) : year,
        fuel,
        transmission,
        mileage: mileage ? Number(mileage) : mileage,
        color,
        image,
        images: Array.isArray(images) ? images : [],
        description,
        overviewTitle,
        overviewText,
        highlights: Array.isArray(highlights) ? highlights : [],
        features: Array.isArray(features) ? features : [],
        status,
      },
      { new: true, runValidators: true }
    );

    if (!updatedCar) {
      return res.status(404).json({
        message: "Không tìm thấy xe để cập nhật",
      });
    }

    return res.status(200).json({
      message: "Cập nhật xe thành công",
      car: updatedCar,
    });
  } catch (error) {
    console.error("UPDATE CAR ERROR:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật xe",
      error: error.message,
    });
  }
};

const deleteCar = async (req, res) => {
  try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);

    if (!deletedCar) {
      return res.status(404).json({
        message: "Không tìm thấy xe để xóa",
      });
    }

    return res.status(200).json({
      message: "Xóa xe thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa xe",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCars,
  getAllCarsForAdmin,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};