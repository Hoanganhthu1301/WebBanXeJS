const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/appointment.controller");

router.post("/", createAppointment);
router.get("/", getAllAppointments);
router.put("/:id", updateAppointmentStatus);
router.delete("/:id", deleteAppointment);

module.exports = router;