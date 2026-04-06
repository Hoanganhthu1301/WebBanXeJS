const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Public (ai cũng xem được)
router.get("/", categoryController.getAllCategories);

// Admin only
router.post("/", verifyToken, isAdmin, categoryController.createCategory);
router.put("/:id", verifyToken, isAdmin, categoryController.updateCategory);
router.delete("/:id", verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;