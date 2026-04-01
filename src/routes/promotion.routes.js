const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");

router.get("/", promotionController.getAllPromotions);
router.get("/car/:carId", promotionController.getPromotionsByCarId);
router.get("/:id", promotionController.getPromotionById);
router.post("/", promotionController.createPromotion);
router.put("/:id", promotionController.updatePromotion);
router.delete("/:id", promotionController.deletePromotion);

module.exports = router;