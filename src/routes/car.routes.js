const express = require("express");
const router = express.Router();
const carController = require("../controllers/car.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

// Admin only
router.get("/admin/all", verifyToken, isAdmin, carController.getAllCarsForAdmin);
router.post("/", verifyToken, isAdmin, carController.createCar);
router.put("/:id", verifyToken, isAdmin, carController.updateCar);
router.delete("/:id", verifyToken, isAdmin, carController.deleteCar);

// Public
router.get("/", carController.getAllCars);
router.get("/:id", carController.getCarById);

module.exports = router;