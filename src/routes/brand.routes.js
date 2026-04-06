const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Public
router.get("/", brandController.getAllBrands);

// Admin only
router.post("/", verifyToken, isAdmin, brandController.createBrand);
router.put("/:id", verifyToken, isAdmin, brandController.updateBrand);
router.delete("/:id", verifyToken, isAdmin, brandController.deleteBrand);

module.exports = router;