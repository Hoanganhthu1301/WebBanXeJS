const express = require("express");
const router = express.Router();
const carController = require("../controllers/car.controller");

router.get("/", carController.getAllCars); // user
router.get("/admin/all", carController.getAllCarsForAdmin); // admin
router.get("/:id", carController.getCarById);
router.post("/", carController.createCar);
router.put("/:id", carController.updateCar);
router.delete("/:id", carController.deleteCar);

module.exports = router;