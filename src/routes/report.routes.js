const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/revenue", verifyToken, isAdmin, reportController.getRevenueReport);
router.post(
  "/revenue/save",
  verifyToken,
  isAdmin,
  reportController.saveRevenueReport
);
router.get(
  "/revenue/saved",
  verifyToken,
  isAdmin,
  reportController.getSavedRevenueReports
);
router.get(
  "/revenue/saved/:id",
  verifyToken,
  isAdmin,
  reportController.getSavedRevenueDetail
);

module.exports = router;