const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/revenue", verifyToken, isAdmin, reportController.getRevenueReport);

module.exports = router;