const express = require("express");
const router = express.Router();
const {
  createQuotation,
  getAllQuotations,
  updateQuotationStatus,
  deleteQuotation,
} = require("../controllers/quotation.controller");

router.post("/", createQuotation);
router.get("/", getAllQuotations);
router.put("/:id", updateQuotationStatus);
router.delete("/:id", deleteQuotation);

module.exports = router;