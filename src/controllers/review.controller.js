const Review = require("../models/review.model");
const Car = require("../models/car.model");
const Deposit = require("../models/deposit.model");

const getUserId = (req) => req?.user?._id || req?.user?.id || null;
const getUserName = (req) =>
  req?.user?.fullName || req?.user?.name || req?.user?.email || "Người dùng";

const recalculateCarRating = async (carId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        carId: carId,
        status: "visible",
      },
    },
    {
      $group: {
        _id: "$carId",
        avgRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats[0]?.avgRating || 0;
  const ratingCount = stats[0]?.ratingCount || 0;

  await Car.findByIdAndUpdate(carId, {
    ratingAverage: Number(avgRating.toFixed(1)),
    ratingCount,
  });

  return {
    ratingAverage: Number(avgRating.toFixed(1)),
    ratingCount,
  };
};

const createReview = async (req, res) => {
  try {
    const userId = getUserId(req);
    const userName = getUserName(req);
    const { carId, rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập để đánh giá",
      });
    }

    if (!carId || !rating) {
      return res.status(400).json({
        message: "Thiếu thông tin đánh giá",
      });
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Số sao phải là số nguyên từ 1 đến 5",
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        message: "Xe không tồn tại",
      });
    }

    // Chỉ user đã mua và hoàn tất đơn mới được review
    const completedDeposit = await Deposit.findOne({
      userId,
      carId,
      status: "completed",
    });

    if (!completedDeposit) {
      return res.status(403).json({
        message: "Bạn phải mua và nhận xe thành công mới được đánh giá",
      });
    }

    // 1 user chỉ được review 1 lần / 1 xe
    const existingReview = await Review.findOne({ carId, userId });
    if (existingReview) {
      return res.status(409).json({
        message: "Bạn đã đánh giá xe này rồi",
      });
    }

    const review = await Review.create({
      carId,
      userId,
      userName: userName.trim(),
      orderRef: completedDeposit._id,
      rating: numericRating,
      comment: (comment || "").trim(),
      status: "visible",
    });

    const ratingInfo = await recalculateCarRating(car._id);

    return res.status(201).json({
      message: "Đánh giá thành công",
      review,
      ...ratingInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi gửi đánh giá",
      error: error.message,
    });
  }
};

const getReviewsByCar = async (req, res) => {
  try {
    const { carId } = req.params;

    const reviews = await Review.find({
      carId,
      status: "visible",
    }).sort({ createdAt: -1 });

    const total = reviews.length;
    const avgRating =
      total > 0
        ? Number(
            (
              reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total
            ).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      reviews,
      total,
      avgRating,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy đánh giá",
      error: error.message,
    });
  }
};

const getMyReviewForCar = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { carId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Vui lòng đăng nhập",
      });
    }

    const review = await Review.findOne({ carId, userId });

    return res.status(200).json({
      reviewed: !!review,
      review,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra đánh giá",
      error: error.message,
    });
  }
};

const canReviewCar = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { carId } = req.params;

    if (!userId) {
      return res.status(200).json({
        canReview: false,
        reviewed: false,
        purchased: false,
        message: "Vui lòng đăng nhập để đánh giá",
      });
    }

    const completedDeposit = await Deposit.findOne({
      userId,
      carId,
      status: "completed",
    });

    const existingReview = await Review.findOne({ carId, userId });

    return res.status(200).json({
      canReview: !!completedDeposit && !existingReview,
      reviewed: !!existingReview,
      purchased: !!completedDeposit,
      message: !completedDeposit
        ? "Bạn phải mua và nhận xe thành công mới được đánh giá"
        : existingReview
        ? "Bạn đã đánh giá xe này rồi"
        : "Bạn có thể đánh giá xe này",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi kiểm tra quyền đánh giá",
      error: error.message,
    });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("carId", "name brand category image images ratingAverage ratingCount")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi lấy tất cả đánh giá",
      error: error.message,
    });
  }
};

const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["visible", "hidden"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái đánh giá không hợp lệ",
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá",
      });
    }

    await recalculateCarRating(review.carId);

    return res.status(200).json({
      message: "Cập nhật trạng thái đánh giá thành công",
      review,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi cập nhật trạng thái đánh giá",
      error: error.message,
    });
  }
};

const deleteReview = async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá",
      });
    }

    await recalculateCarRating(deleted.carId);

    return res.status(200).json({
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server khi xóa đánh giá",
      error: error.message,
    });
  }
};

module.exports = {
  createReview,
  getReviewsByCar,
  getMyReviewForCar,
  canReviewCar,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
};