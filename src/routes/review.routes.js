const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewsByCar,
  getMyReviewForCar,
  canReviewCar,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} = require("../controllers/review.controller");

const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Public
router.get("/", getAllReviews);
router.get("/car/:carId", getReviewsByCar);

// User
router.get("/car/:carId/my-review", verifyToken, getMyReviewForCar);
router.get("/car/:carId/can-review", verifyToken, canReviewCar);
router.post("/", verifyToken, createReview);

// Admin
router.put("/:id", verifyToken, isAdmin, updateReviewStatus);
router.delete("/:id", verifyToken, isAdmin, deleteReview);

module.exports = router;