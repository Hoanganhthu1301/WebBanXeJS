const mongoose = require("mongoose");
const Car = require("../models/car.model");
const Promotion = require("../models/promotion.model");
const {
  findBestPromotionForCar,
  calculatePricing,
} = require("../services/promotion.service")

const normalizeCarStatus = (quantity, currentStatus) => {
  const qty = Number(quantity) || 0;

  if (currentStatus === "hidden") {
    return "hidden";
  }

  if (qty <= 0) {
    return "sold";
  }

  if (currentStatus === "reserved") {
    return "reserved";
  }

  return "available";
};

const isSameId = (a, b) => {
  if (!a || !b) return false;
  return String(a) === String(b);
};

const findAllPromotionsForCar = async (car) => {
  const now = new Date();

  const promotions = await Promotion.find({
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).sort({ createdAt: -1 });

  return promotions.filter((promo) => {
    if (promo.applyScope === "all") {
      return true;
    }

    if (promo.applyScope === "brand") {
      return (
        promo.brand &&
        car.brand &&
        String(promo.brand).trim().toLowerCase() ===
          String(car.brand).trim().toLowerCase()
      );
    }

    if (promo.applyScope === "car") {
      if (!Array.isArray(promo.carIds) || promo.carIds.length === 0) {
        return false;
      }

      return promo.carIds.some((id) => isSameId(id, car._id));
    }

    return false;
  });
};

// USER
const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find({
      status: "available",
      quantity: { $gt: 0 },
    }).sort({ createdAt: -1 });

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

    const promotions = await findAllPromotionsForCar(car);
    const bestPromotion = await findBestPromotionForCar(car);
    const pricing = calculatePricing(car.price, bestPromotion);

    return res.status(200).json({
      message: "Lấy chi tiết xe thành công",
      car,
      promotion: bestPromotion || null,
      promotions,
      pricing,
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
      quantity,
      soldCount,
      year,
      fuel,
      transmission,
      mileage,
      color,
      image,
      images,
      model3dUrl, 
      description,
      overviewTitle,
      overviewText,
      highlights,
      features,
      status,
    } = req.body;

    if (!name || !brand || !category || price === undefined || price === null) {
      return res.status(400).json({
        message: "Vui lòng nhập tên xe, hãng xe, danh mục và giá",
      });
    }

    const parsedQuantity =
      quantity !== undefined && quantity !== null ? Number(quantity) : 1;

    const parsedSoldCount =
      soldCount !== undefined && soldCount !== null ? Number(soldCount) : 0;

    const finalStatus = normalizeCarStatus(parsedQuantity, status || "available");

    const newCar = await Car.create({
  name: String(name).trim(),
  brand: String(brand).trim(),
  category: String(category).trim(),
  price: Number(price),
  quantity: parsedQuantity,
  soldCount: parsedSoldCount,
  year: year ? Number(year) : new Date().getFullYear(),
  fuel: fuel || "Xăng",
  transmission: transmission || "Tự động",
  mileage: mileage ? Number(mileage) : 0,
  color: color || "",
  image: image || "",
  images: Array.isArray(images) ? images : [],
  model3dUrl: model3dUrl || "", // 🔥 QUAN TRỌNG
  description: description || "",
  overviewTitle: overviewTitle || "",
  overviewText: overviewText || "",
  highlights: Array.isArray(highlights) ? highlights : [],
  features: Array.isArray(features) ? features : [],
  status: finalStatus,
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
    const oldCar = await Car.findById(req.params.id);

    if (!oldCar) {
      return res.status(404).json({
        message: "Không tìm thấy xe để cập nhật",
      });
    }

    const {
  name,
  brand,
  category,
  price,
  quantity,
  soldCount,
  year,
  fuel,
  transmission,
  mileage,
  color,
  image,
  images,
  model3dUrl, // 🔥 thêm
  description,
  overviewTitle,
  overviewText,
  highlights,
  features,
  status,
} = req.body;

    const parsedQuantity =
      quantity !== undefined && quantity !== null
        ? Number(quantity)
        : oldCar.quantity;

    const parsedSoldCount =
      soldCount !== undefined && soldCount !== null
        ? Number(soldCount)
        : oldCar.soldCount;

    const finalStatus = normalizeCarStatus(
      parsedQuantity,
      status !== undefined ? status : oldCar.status
    );

    const updatedCar = await Car.findByIdAndUpdate(
  req.params.id,
  {
    name: name !== undefined ? name : oldCar.name,
    brand: brand !== undefined ? brand : oldCar.brand,
    category: category !== undefined ? category : oldCar.category,
    price: price !== undefined ? Number(price) : oldCar.price,
    quantity: parsedQuantity,
    soldCount: parsedSoldCount,
    year: year !== undefined ? Number(year) : oldCar.year,
    fuel: fuel !== undefined ? fuel : oldCar.fuel,
    transmission:
      transmission !== undefined ? transmission : oldCar.transmission,
    mileage: mileage !== undefined ? Number(mileage) : oldCar.mileage,
    color: color !== undefined ? color : oldCar.color,
    image: image !== undefined ? image : oldCar.image,
    images: Array.isArray(images) ? images : oldCar.images,
    model3dUrl:
      model3dUrl !== undefined ? model3dUrl : oldCar.model3dUrl, // 🔥 QUAN TRỌNG
    description:
      description !== undefined ? description : oldCar.description,
    overviewTitle:
      overviewTitle !== undefined ? overviewTitle : oldCar.overviewTitle,
    overviewText:
      overviewText !== undefined ? overviewText : oldCar.overviewText,
    highlights: Array.isArray(highlights) ? highlights : oldCar.highlights,
    features: Array.isArray(features) ? features : oldCar.features,
    status: finalStatus,
  },
  { new: true, runValidators: true }
);

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