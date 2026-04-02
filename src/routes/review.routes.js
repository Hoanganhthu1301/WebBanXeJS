const express = require("express");
const router = express.Router();

const {
  createOrUpdateReview,
  getReviewsByCar,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} = require("../controllers/review.controller");

router.post("/", createOrUpdateReview);
router.get("/", getAllReviews);
router.get("/car/:carId", getReviewsByCar);
router.put("/:id", updateReviewStatus);
router.delete("/:id", deleteReview);

module.exports = router;