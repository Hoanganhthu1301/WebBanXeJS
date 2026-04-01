const mongoose = require("mongoose");
const Promotion = require("../models/promotion.model");
const Car = require("../models/car.model");
const {
  findBestPromotionForCar,
  calculatePricing,
} = require("../services/promotion.service");

// CREATE
const createPromotion = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      value,
      giftItems,
      applyScope,
      brand,
      carIds,
      startDate,
      endDate,
      status,
    } = req.body;

    if (!title || !type || !applyScope || !startDate || !endDate) {
      return res.status(400).json({
        message: "Thiếu thông tin bắt buộc",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
      });
    }

    if (type === "gift" && (!Array.isArray(giftItems) || giftItems.length === 0)) {
      return res.status(400).json({
        message: "Ưu đãi quà tặng phải có ít nhất 1 quà tặng",
      });
    }

    if ((type === "amount" || type === "percent") && (!value || Number(value) < 0)) {
      return res.status(400).json({
        message: "Giá trị giảm không hợp lệ",
      });
    }

    if (type === "percent" && Number(value) > 100) {
      return res.status(400).json({
        message: "Phần trăm giảm không được vượt quá 100",
      });
    }

    if (applyScope === "brand" && !brand) {
      return res.status(400).json({
        message: "Ưu đãi theo hãng phải có brand",
      });
    }

    if (applyScope === "car" && (!Array.isArray(carIds) || carIds.length === 0)) {
      return res.status(400).json({
        message: "Ưu đãi theo xe phải có danh sách carIds",
      });
    }

    const promotion = await Promotion.create({
      title: String(title).trim(),
      description: description || "",
      type,
      value: Number(value) || 0,
      giftItems: Array.isArray(giftItems) ? giftItems : [],
      applyScope,
      brand: brand || "",
      carIds: Array.isArray(carIds) ? carIds : [],
      startDate,
      endDate,
      status: status || "active",
    });

    return res.status(201).json({
      message: "Tạo ưu đãi thành công",
      promotion,
    });
  } catch (error) {
    console.error("CREATE PROMOTION ERROR:", error);
    return res.status(500).json({
      message: "Lỗi server khi tạo ưu đãi",
      error: error.message,
    });
  }
};

// GET ALL
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("carIds", "name brand price image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách ưu đãi thành công",
      promotions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy danh sách ưu đãi",
      error: error.message,
    });
  }
};

// GET BY ID
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id).populate(
      "carIds",
      "name brand price image"
    );

    if (!promotion) {
      return res.status(404).json({
        message: "Không tìm thấy ưu đãi",
      });
    }

    return res.status(200).json({
      message: "Lấy chi tiết ưu đãi thành công",
      promotion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy chi tiết ưu đãi",
      error: error.message,
    });
  }
};

// UPDATE
const updatePromotion = async (req, res) => {
  try {
    const oldPromotion = await Promotion.findById(req.params.id);

    if (!oldPromotion) {
      return res.status(404).json({
        message: "Không tìm thấy ưu đãi để cập nhật",
      });
    }

    const updateData = { ...req.body };

    const startDate = updateData.startDate || oldPromotion.startDate;
    const endDate = updateData.endDate || oldPromotion.endDate;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "Ngày bắt đầu không được lớn hơn ngày kết thúc",
      });
    }

    if (
      updateData.type === "percent" &&
      updateData.value !== undefined &&
      Number(updateData.value) > 100
    ) {
      return res.status(400).json({
        message: "Phần trăm giảm không được vượt quá 100",
      });
    }

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        title: updateData.title !== undefined ? updateData.title : oldPromotion.title,
        description:
          updateData.description !== undefined
            ? updateData.description
            : oldPromotion.description,
        type: updateData.type !== undefined ? updateData.type : oldPromotion.type,
        value:
          updateData.value !== undefined
            ? Number(updateData.value)
            : oldPromotion.value,
        giftItems: Array.isArray(updateData.giftItems)
          ? updateData.giftItems
          : oldPromotion.giftItems,
        applyScope:
          updateData.applyScope !== undefined
            ? updateData.applyScope
            : oldPromotion.applyScope,
        brand: updateData.brand !== undefined ? updateData.brand : oldPromotion.brand,
        carIds: Array.isArray(updateData.carIds)
          ? updateData.carIds
          : oldPromotion.carIds,
        startDate,
        endDate,
        status: updateData.status !== undefined ? updateData.status : oldPromotion.status,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Cập nhật ưu đãi thành công",
      promotion: updatedPromotion,
    });
  } catch (error) {
    console.error("UPDATE PROMOTION ERROR:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật ưu đãi",
      error: error.message,
    });
  }
};

// DELETE
const deletePromotion = async (req, res) => {
  try {
    const deletedPromotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!deletedPromotion) {
      return res.status(404).json({
        message: "Không tìm thấy ưu đãi để xóa",
      });
    }

    return res.status(200).json({
      message: "Xóa ưu đãi thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa ưu đãi",
      error: error.message,
    });
  }
};

// GET APPLICABLE PROMOTION FOR CAR
const getApplicablePromotionForCar = async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({
        message: "carId không hợp lệ",
      });
    }

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        message: "Không tìm thấy xe",
      });
    }

    const promotion = await findBestPromotionForCar(car);
    const pricing = calculatePricing(car.price, promotion);

    return res.status(200).json({
      message: "Lấy ưu đãi áp dụng cho xe thành công",
      car,
      promotion,
      pricing,
    });
  } catch (error) {
    console.error("GET APPLICABLE PROMOTION ERROR:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy ưu đãi áp dụng cho xe",
      error: error.message,
    });
  }
};

const getPromotionsByCarId = async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ message: "carId không hợp lệ" });
    }

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    const now = new Date();

    const promotions = await Promotion.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { applyScope: "all" },
        {
          applyScope: "brand",
          brand: {
            $regex: `^${String(car.brand).trim()}$`,
            $options: "i",
          },
        },
        {
          applyScope: "car",
          carIds: car._id,
        },
      ],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Lấy danh sách ưu đãi của xe thành công",
      promotions,
    });
  } catch (error) {
    console.error("GET PROMOTIONS BY CAR ERROR:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getApplicablePromotionForCar,
  getPromotionsByCarId,
};