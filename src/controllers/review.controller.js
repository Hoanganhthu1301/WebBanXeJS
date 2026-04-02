const Review = require("../models/review.model");
const Car = require("../models/car.model");

const createOrUpdateReview = async (req, res) => {
  try {
    const { carId, userId, userName, rating, comment } = req.body;

    if (!carId || !userId || !userName || !rating) {
      return res.status(400).json({
        message: "Thiếu thông tin đánh giá",
      });
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        message: "Số sao phải từ 1 đến 5",
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        message: "Xe không tồn tại",
      });
    }

    const review = await Review.findOneAndUpdate(
      { carId, userId },
      {
        carId,
        userId,
        userName: userName.trim(),
        rating: Number(rating),
        comment: (comment || "").trim(),
        status: "visible",
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Đánh giá thành công",
      review,
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
        ? (
            reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total
          ).toFixed(1)
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

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("carId", "name brand category image images")
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
  createOrUpdateReview,
  getReviewsByCar,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
};