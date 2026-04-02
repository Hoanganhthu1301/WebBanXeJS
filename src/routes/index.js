const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const notificationRoutes = require("./notification.routes");
const reportRoutes = require("./report.routes");
const promotionRoutes = require("./promotion.routes");
const payosRoutes = require("./payos.routes");

router.get("/test", (req, res) => {
  res.json({
    message: "API test success",
  });
});

// Các route cơ bản
router.use("/auth", authRoutes);
router.use("/cars", require("./car.routes"));
router.use("/categories", require("./category.routes"));
router.use("/brands", require("./brand.routes"));
router.use("/contacts", require("./contact.routes"));
router.use("/deposits", require("./deposit.routes"));
router.use("/admin/users", require("./adminUser.routes"));
router.use("/favorites", require("./favorite.routes"));
router.use("/notifications", notificationRoutes);
router.use("/reports", reportRoutes);
router.use("/promotions", promotionRoutes);
router.use("/payos", payosRoutes);

// GỘP: Thêm các route tính năng mới của Thư
router.use("/showrooms", require("./showroom.routes"));
router.use("/chatbot", require("./chatbot.routes"));

module.exports = router;