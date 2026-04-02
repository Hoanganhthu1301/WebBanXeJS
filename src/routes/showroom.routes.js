const express = require("express");
const router = express.Router();

const showroomController = require("../controllers/showroom.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", showroomController.getAllShowrooms);
router.get("/admin/all", verifyToken, isAdmin, showroomController.getAdminShowrooms);
router.post("/", verifyToken, isAdmin, showroomController.createShowroom);
router.put("/:id", verifyToken, isAdmin, showroomController.updateShowroom);
router.delete("/:id", verifyToken, isAdmin, showroomController.deleteShowroom);

module.exports = router;