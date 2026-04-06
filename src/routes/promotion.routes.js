const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Public (ai cũng xem được)
router.get("/", promotionController.getAllPromotions);
router.get("/car/:carId", promotionController.getPromotionsByCarId);
router.get("/:id", promotionController.getPromotionById);

// Admin only
router.post("/", verifyToken, isAdmin, promotionController.createPromotion);
router.put("/:id", verifyToken, isAdmin, promotionController.updatePromotion);
router.delete("/:id", verifyToken, isAdmin, promotionController.deletePromotion);

module.exports = router;