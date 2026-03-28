const express = require("express");
const router = express.Router();

const depositController = require("../controllers/deposit.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// payOS
router.post("/payos/webhook", depositController.payOSWebhook);
router.post("/payos", verifyToken, depositController.createPayOSDeposit);
router.get("/order/:orderCode", depositController.getDepositByOrderCode);
router.put("/order/:orderCode/cancel", depositController.cancelPayOSDeposit);
router.put("/order/:orderCode/confirm", depositController.confirmDepositPaid);

// user
router.get("/my-deposits", verifyToken, depositController.getMyDeposits);
router.put("/:id/user-cancel", verifyToken, depositController.userCancelDeposit);

// admin / general
router.post("/", depositController.createDeposit);
router.get("/", depositController.getAllDeposits);

router.get("/:id", verifyToken, depositController.getDepositDetail);
router.put("/:id", verifyToken, depositController.updateDepositStatus);
router.put("/:id/assign", verifyToken, depositController.assignDepositStaff);
router.put("/:id/cancel", verifyToken, depositController.adminCancelDeposit);
router.put("/:id/confirm-by-staff", verifyToken, depositController.confirmDepositByStaff);
router.put("/:id/full-payment", verifyToken, depositController.confirmFullPayment);
router.put("/:id/complete", verifyToken, depositController.completeDepositOrder);
router.put("/:id/no-show", verifyToken, depositController.adminMarkNoShowAndForfeit);
router.delete("/:id", verifyToken, depositController.deleteDeposit);

router.put(
  "/:id/upload-invoice",
  verifyToken,
  upload.single("invoice"),
  depositController.uploadInvoiceForDeposit
);
router.put("/:id/confirm-refund", verifyToken, depositController.confirmRefundCompleted);
module.exports = router;