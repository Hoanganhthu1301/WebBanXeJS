  const Deposit = require("../models/deposit.model");
  const Car = require("../models/car.model");
  const User = require("../models/user.model");

  const {
    createPaymentLink,
    generateOrderCode,
  } = require("../services/payos.service");

  const ACTIVE_BOOKING_STATUSES = [
    "pending_payment",
    "paid",
    "confirmed",
    "waiting_full_payment",
    "ready_to_deliver",
  ];

  const getUserId = (req) => req?.user?._id || req?.user?.id || null;

  const getUserDisplayName = (req) =>
    req?.user?.fullName || req?.user?.name || req?.user?.email || "Nhân viên";



  const calculateFinancials = (carPrice, depositAmount) => {
    const basePrice = Number(carPrice || 0);
    const deposit = Number(depositAmount || 0);
    const vatAmount = Math.round(basePrice * 0.1);
    const registrationFee = Math.round(basePrice * 0.1);
    const licensePlateFee = 20000000;
    const insuranceFee = 1560000;
    const totalEstimatedPrice =
      basePrice + vatAmount + registrationFee + licensePlateFee + insuranceFee;
    const remainingAmount = Math.max(totalEstimatedPrice - deposit, 0);

    return {
      vatAmount,
      registrationFee,
      licensePlateFee,
      insuranceFee,
      totalEstimatedPrice,
      remainingAmount,
    };
  };

  const validateDepositAmount = (carPrice, depositAmount) => {
    const value = Number(depositAmount || 0);
    const minDeposit = Math.ceil(Number(carPrice || 0) * 0.05);

    if (!Number.isFinite(value) || value <= 0) {
      return {
        ok: false,
        message: "Số tiền cọc không hợp lệ",
        minDeposit,
      };
    }

    if (value < minDeposit) {
      return {
        ok: false,
        message: `Tiền cọc tối thiểu là ${minDeposit.toLocaleString("vi-VN")}đ`,
        minDeposit,
      };
    }

    return {
      ok: true,
      minDeposit,
      value,
    };
  };

  const syncCarStatusFromDeposit = async (deposit) => {
    const car = await Car.findById(deposit.carId);
    if (!car) return;

    if (deposit.status === "completed") {
      car.status = "sold";
      await car.save();
      return;
    }

    if (["paid", "confirmed", "scheduled"].includes(deposit.status)) {
      car.status = "reserved";
      await car.save();
      return;
    }

    if (deposit.status === "cancelled") {
      const activeDeposit = await Deposit.findOne({
        carId: deposit.carId,
        _id: { $ne: deposit._id },
        status: { $in: ["paid", "confirmed", "scheduled"] },
      });

      car.status = activeDeposit ? "reserved" : "available";
      await car.save();
      return;
    }

    if (deposit.status === "pending_payment") {
      const activeDeposit = await Deposit.findOne({
        carId: deposit.carId,
        _id: { $ne: deposit._id },
        status: { $in: ["paid", "confirmed", "scheduled"] },
      });

      car.status = activeDeposit ? "reserved" : "available";
      await car.save();
    }
  };

  const createDeposit = async (req, res) => {
    try {
      const {
        fullName,
        phone,
        email,
        note,
        carId,
        depositAmount,
        pickupDate,
        pickupTimeSlot,
        deliveryMethod,
        showroom,
        deliveryAddress,
      } = req.body;

      if (!fullName || !phone || !carId || !depositAmount) {
        return res.status(400).json({
          message: "Vui lòng nhập đầy đủ họ tên, số điện thoại, xe và tiền cọc",
        });
      }

      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ message: "Không tìm thấy xe" });
      }

      if (car.status === "sold") {
        return res.status(400).json({ message: "Xe này đã bán" });
      }

      const activeDeposit = await Deposit.findOne({
        carId: car._id,
        status: { $in: ACTIVE_BOOKING_STATUSES },
      });

      if (activeDeposit) {
        return res.status(400).json({
          message: "Xe này đang được giữ bởi đơn khác",
        });
      }

      const depositCheck = validateDepositAmount(car.price, depositAmount);
      if (!depositCheck.ok) {
        return res.status(400).json({ message: depositCheck.message });
      }

      const financials = calculateFinancials(car.price, depositAmount);

      const newDeposit = await Deposit.create({
        userId: getUserId(req),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || "",
        note: note?.trim() || "",

        carId: car._id,
        carName: car.name,
        carPrice: Number(car.price || 0),

        depositPercent: 5,
        depositAmount: Number(depositAmount),
        ...financials,

        pickupDate: pickupDate || "",
        pickupTimeSlot: pickupTimeSlot || "",
        deliveryMethod: deliveryMethod || "showroom",
        showroom: showroom?.trim() || "",
        deliveryAddress: deliveryAddress?.trim() || "",

        paymentMethod: "manual",
        paymentStatus: "paid",
        status: "paid",
        paidAt: new Date(),
      });

      await syncCarStatusFromDeposit(newDeposit);

      return res.status(201).json({
        message: "Tạo đơn đặt cọc thành công",
        deposit: newDeposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi tạo đơn đặt cọc",
        error: error.message,
      });
    }
  };

  const createPayOSDeposit = async (req, res) => {
    try {
      const {
        fullName,
        phone,
        email,
        note,
        carId,
        depositAmount,
        pickupDate,
        pickupTimeSlot,
        deliveryMethod,
        showroom,
        deliveryAddress,
      } = req.body;

      if (!fullName || !phone || !carId || !depositAmount) {
        return res.status(400).json({
          message: "Vui lòng nhập đầy đủ họ tên, số điện thoại, xe và tiền cọc",
        });
      }

      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ message: "Không tìm thấy xe" });
      }

      if (car.status === "sold") {
        return res.status(400).json({ message: "Xe này đã bán" });
      }

      const activeDeposit = await Deposit.findOne({
        carId: car._id,
        status: { $in: ACTIVE_BOOKING_STATUSES },
      });

      if (activeDeposit) {
        return res.status(400).json({
          message: "Xe này đang được giữ bởi đơn khác",
        });
      }

      const depositCheck = validateDepositAmount(car.price, depositAmount);
      if (!depositCheck.ok) {
        return res.status(400).json({ message: depositCheck.message });
      }

      const financials = calculateFinancials(car.price, depositCheck.value);
      const orderCode = generateOrderCode();

      const paymentLink = await createPaymentLink({
        orderCode,
        amount: depositCheck.value,
        description: `Coc ${car.name}`,
        carName: car.name,
        carId: car._id.toString(),
      });

      console.log("paymentLink normalized:", paymentLink);

      const checkoutUrl =
        paymentLink?.checkoutUrl ||
        paymentLink?.data?.checkoutUrl ||
        "";

      if (!checkoutUrl) {
        return res.status(500).json({
          message: "PayOS không trả về checkoutUrl",
        });
      }

      const newDeposit = await Deposit.create({
        userId: getUserId(req),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || "",
        note: note?.trim() || "",

        carId: car._id,
        carName: car.name,
        carPrice: Number(car.price || 0),

        depositPercent: 5,
        depositAmount: Number(depositCheck.value),
        ...financials,

        pickupDate: pickupDate || "",
        pickupTimeSlot: pickupTimeSlot || "",
        deliveryMethod: deliveryMethod || "showroom",
        showroom: showroom?.trim() || "",
        deliveryAddress: deliveryAddress?.trim() || "",

        orderCode,
        paymentMethod: "payos",
        paymentStatus: "unpaid",
        status: "pending_payment",
        checkoutUrl,
      });

      return res.status(201).json({
        message: "Tạo đơn cọc PayOS thành công",
        deposit: newDeposit,
        checkoutUrl,
        orderCode,
      });
    } catch (error) {
      console.error("createPayOSDeposit error:", error);
      return res.status(500).json({
        message: "Lỗi tạo đơn cọc PayOS",
        error: error.message,
      });
    }
  };

  const payOSWebhook = async (req, res) => {
    try {
      const orderCode =
        req.body?.data?.orderCode ||
        req.body?.orderCode ||
        req.body?.code ||
        null;

      if (!orderCode) {
        return res.status(400).json({ message: "Thiếu orderCode từ webhook" });
      }

      const deposit = await Deposit.findOne({ orderCode: Number(orderCode) });
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      deposit.paymentStatus = "paid";
      deposit.status = "paid";
      deposit.paidAt = new Date();
      await deposit.save();

      return res.status(200).json({
        message: "Webhook cập nhật thanh toán thành công",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi webhook PayOS",
        error: error.message,
      });
    }
  };

  const confirmDepositPaid = async (req, res) => {
    try {
      const { orderCode } = req.params;

      const deposit = await Deposit.findOne({ orderCode: Number(orderCode) });
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      deposit.paymentStatus = "paid";
      deposit.status = "paid";
      deposit.paidAt = new Date();
      await deposit.save();

      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Đã xác nhận khách đã thanh toán cọc",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi xác nhận thanh toán cọc",
        error: error.message,
      });
    }
  };

  const confirmDepositByStaff = async (req, res) => {
    try {
      const { id } = req.params;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy phiếu đặt cọc" });
      }

      if (deposit.paymentStatus !== "paid") {
        return res.status(400).json({
          message: "Chưa thể xác nhận vì khách chưa thanh toán cọc",
        });
      }

      deposit.status = "waiting_full_payment";
      deposit.confirmedBy = getUserId(req);
      deposit.confirmedByName = getUserDisplayName(req);
      deposit.confirmedAt = new Date();

      if (!deposit.assignedStaffId) {
        deposit.assignedStaffId = getUserId(req);
        deposit.assignedStaffName = getUserDisplayName(req);
        deposit.assignedAt = new Date();
      }

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Đã xác nhận cọc và chuyển sang chờ thanh toán phần còn lại",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi khi xác nhận cọc",
        error: error.message,
      });
    }
  };

  const assignDepositStaff = async (req, res) => {
    try {
      const { id } = req.params;
      const { staffId } = req.body;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy phiếu đặt cọc" });
      }

      const staff = await User.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: "Không tìm thấy nhân viên" });
      }

      deposit.assignedStaffId = staff._id;
      deposit.assignedStaffName =
        staff.fullName || staff.name || staff.email || "";
      deposit.assignedAt = new Date();

      await deposit.save();

      return res.status(200).json({
        message: "Đã gán người phụ trách đơn",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi khi gán người phụ trách",
        error: error.message,
      });
    }
  };

  const confirmFullPayment = async (req, res) => {
    try {
      const { id } = req.params;
      const { fullPaymentMethod } = req.body;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy phiếu đặt cọc" });
      }

      if (!["waiting_full_payment", "confirmed", "paid"].includes(deposit.status)) {
        return res.status(400).json({
          message: "Đơn không ở trạng thái chờ thanh toán phần còn lại",
        });
      }

      deposit.fullPaymentMethod = fullPaymentMethod || "bank_transfer";
      deposit.fullPaymentAmount = Number(deposit.remainingAmount || 0);
      deposit.remainingAmount = 0;
      deposit.status = "ready_to_deliver";
      deposit.fullyPaidAt = new Date();

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Đã xác nhận khách thanh toán đủ",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi khi xác nhận thanh toán đủ",
        error: error.message,
      });
    }
  };

  const completeDepositOrder = async (req, res) => {
    try {
      const { id } = req.params;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy phiếu đặt cọc" });
      }

      if (deposit.status !== "ready_to_deliver") {
        return res.status(400).json({
          message: "Chỉ được hoàn tất khi đơn đã thanh toán đủ",
        });
      }

      deposit.status = "completed";
      deposit.deliveredAt = new Date();
      deposit.completedAt = new Date();

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Đã giao xe và hoàn tất đơn hàng",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi khi hoàn tất đơn hàng",
        error: error.message,
      });
    }
  };

const getDepositDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const deposit = await Deposit.findById(id)
      .populate("carId", "name brand category price year fuel transmission mileage color image images status")
      .populate("userId", "fullName name email phone")
      .populate("assignedStaffId", "fullName name email phone role")
      .populate("confirmedBy", "fullName name email phone role")
      .populate("invoiceUploadedBy", "fullName name email phone role");

    if (!deposit) {
      return res.status(404).json({ message: "Không tìm thấy chi tiết đơn" });
    }

    return res.status(200).json({
      message: "Lấy chi tiết đơn thành công",
      deposit,
    });
  } catch (error) {
    console.error("getDepositDetail error:", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy chi tiết đơn",
      error: error.message,
    });
  }
};

  const getDepositByOrderCode = async (req, res) => {
    try {
      const { orderCode } = req.params;

      const deposit = await Deposit.findOne({ orderCode: Number(orderCode) })
        .populate("carId", "name brand category price image images status")
        .populate("userId", "fullName name email phone")
        .populate("assignedStaffId", "fullName name email phone role")
        .populate("confirmedBy", "fullName name email phone role");

      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      return res.status(200).json({
        message: "Lấy đơn cọc thành công",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi lấy đơn cọc",
        error: error.message,
      });
    }
  };

  const cancelPayOSDeposit = async (req, res) => {
    try {
      const { orderCode } = req.params;

      const deposit = await Deposit.findOne({ orderCode: Number(orderCode) });
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      if (deposit.status === "completed") {
        return res.status(400).json({
          message: "Đơn đã hoàn tất, không thể hủy",
        });
      }

      deposit.status = "cancelled";
      deposit.paymentStatus =
        deposit.paymentStatus === "paid" ? deposit.paymentStatus : "cancelled";

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Hủy đơn cọc thành công",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi hủy đơn cọc",
        error: error.message,
      });
    }
  };

  const getMyDeposits = async (req, res) => {
    try {
      const userId = getUserId(req);

      const deposits = await Deposit.find({ userId })
        .populate("carId", "name brand category price image images status")
        .populate("assignedStaffId", "fullName name email phone role")
        .populate("confirmedBy", "fullName name email phone role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Lấy đơn đặt cọc của bạn thành công",
        deposits,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi server khi lấy đơn đặt cọc",
        error: error.message,
      });
    }
  };

  const getAllDeposits = async (req, res) => {
    try {
      const deposits = await Deposit.find()
        .populate("carId", "name brand category price image status")
        .populate("userId", "fullName name email phone")
        .populate("assignedStaffId", "fullName name email phone role")
        .populate("confirmedBy", "fullName name email phone role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: "Lấy danh sách đơn đặt cọc thành công",
        deposits,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi lấy danh sách đơn đặt cọc",
        error: error.message,
      });
    }
  };

  const updateDepositStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, paymentStatus } = req.body;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      if (status) deposit.status = status;
      if (paymentStatus) deposit.paymentStatus = paymentStatus;

      if (status === "paid" && !deposit.paidAt) {
        deposit.paidAt = new Date();
      }

      if (status === "waiting_full_payment" && !deposit.confirmedAt) {
        deposit.confirmedAt = new Date();
        deposit.confirmedBy = getUserId(req);
        deposit.confirmedByName = getUserDisplayName(req);
      }

      if (status === "ready_to_deliver" && !deposit.fullyPaidAt) {
        deposit.fullyPaidAt = new Date();
      }

      if (status === "completed" && !deposit.completedAt) {
        deposit.deliveredAt = new Date();
        deposit.completedAt = new Date();
      }

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Cập nhật trạng thái đơn thành công",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi cập nhật trạng thái đơn",
        error: error.message,
      });
    }
  };

  const deleteDeposit = async (req, res) => {
    try {
      const { id } = req.params;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      if (deposit.status !== "cancelled") {
        return res.status(400).json({
          message: "Chỉ nên xóa đơn đã hủy",
        });
      }

      await Deposit.findByIdAndDelete(id);
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Xóa đơn cọc thành công",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi xóa đơn cọc",
        error: error.message,
      });
    }
  };
  const uploadInvoiceForDeposit = async (req, res) => {
    try {
      const { id } = req.params;
      const { invoiceNote } = req.body;

      const deposit = await Deposit.findById(id);
      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Vui lòng chọn file hóa đơn" });
      }

      deposit.invoiceImage = `/uploads/invoices/${req.file.filename}`;
      deposit.invoiceNote = invoiceNote?.trim() || "";
      deposit.invoiceUploadedAt = new Date();
      deposit.invoiceUploadedBy = req.user?._id || req.user?.id || null;

      await deposit.save();

      return res.status(200).json({
        message: "Tải hóa đơn thành công",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi upload hóa đơn",
        error: error.message,
      });
    }
  };
  const adminCancelDeposit = async (req, res) => {
    try {
    const { id } = req.params;
    const { invoiceNote } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt cọc" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh hóa đơn" });
    }

    deposit.invoiceImage = `/uploads/invoices/${req.file.filename}`;
    deposit.invoiceNote = invoiceNote || "";
    deposit.invoiceUploadedAt = new Date();
    deposit.invoiceUploadedBy = req.user.id;

    await deposit.save();

    return res.status(200).json({
      message: "Upload hóa đơn thành công",
      deposit,
    });
  } catch (error) {
    console.error("uploadInvoiceForDeposit error:", error);
    return res.status(500).json({
      message: "Upload hóa đơn thất bại",
      error: error.message,
    });
  }
  };
  const isWithin24Hours = (createdAt) => {
    if (!createdAt) return false;
    const now = new Date();
    const created = new Date(createdAt);
    return now.getTime() - created.getTime() <= 24 * 60 * 60 * 1000;
  };
  const isPickupExpiredOver7Days = (pickupDate) => {
    if (!pickupDate) return false;

    const pickup = new Date(pickupDate);
    if (Number.isNaN(pickup.getTime())) return false;

    const now = new Date();
    pickup.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (now.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDays > 7;
  };
  const userCancelDeposit = async (req, res) => {
    try {
      const userId = req.user?._id || req.user?.id;
      const deposit = await Deposit.findById(req.params.id);

      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      if (String(deposit.userId) !== String(userId)) {
        return res.status(403).json({ message: "Bạn không có quyền hủy đơn này" });
      }

      if (deposit.status === "completed") {
        return res.status(400).json({ message: "Đơn đã hoàn tất, không thể hủy" });
      }

      deposit.status = "cancelled";
      deposit.cancelledAt = new Date();
      deposit.cancelledBy = userId;
      deposit.cancelledByRole = "user";

      const within24h = isWithin24Hours(deposit.createdAt);

      if (deposit.paymentStatus === "paid") {
        if (within24h) {
          deposit.refundStatus = "refunded";
          deposit.refundReason = "customer_cancelled_within_24h";
          deposit.refundAmount = Number(deposit.depositAmount || 0);
          deposit.refundAt = new Date();
        } else {
          deposit.refundStatus = "forfeited";
          deposit.refundReason = "customer_cancelled_after_24h";
          deposit.refundAmount = 0;
        }
      } else {
        deposit.paymentStatus = "cancelled";
        deposit.refundStatus = "none";
        deposit.refundReason = "customer_cancelled_unpaid";
        deposit.refundAmount = 0;
      }

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: within24h
          ? "Bạn đã hủy đơn và được hoàn cọc."
          : "Bạn đã hủy đơn nhưng quá 24h nên mất cọc.",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi khi người dùng hủy đơn",
        error: error.message,
      });
    }
  };
  const adminMarkNoShowAndForfeit = async (req, res) => {
    try {
      const deposit = await Deposit.findById(req.params.id);

      if (!deposit) {
        return res.status(404).json({ message: "Không tìm thấy đơn cọc" });
      }

      if (!isPickupExpiredOver7Days(deposit.pickupDate)) {
        return res.status(400).json({
          message: "Chưa quá 7 ngày kể từ lịch nhận xe, chưa thể xử lý mất cọc",
        });
      }

      deposit.status = "cancelled";
      deposit.cancelledAt = new Date();
      deposit.cancelledBy = req.user?._id || req.user?.id || null;
      deposit.cancelledByRole = "admin";
      deposit.refundStatus = "forfeited";
      deposit.refundReason = "no_show_over_7_days";
      deposit.refundAmount = 0;

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      return res.status(200).json({
        message: "Đơn đã bị hủy do khách quá hạn nhận xe hơn 7 ngày, cọc bị giữ.",
        deposit,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi xử lý quá hạn nhận xe",
        error: error.message,
      });
    }
  };
  module.exports = {
    createDeposit,
    createPayOSDeposit,
    payOSWebhook,
    confirmDepositPaid,
    confirmDepositByStaff,
    assignDepositStaff,
    confirmFullPayment,
    completeDepositOrder,
    getDepositDetail,
    getDepositByOrderCode,
    cancelPayOSDeposit,
    getMyDeposits,
    getAllDeposits,
    updateDepositStatus,
    deleteDeposit,
    uploadInvoiceForDeposit,
    adminCancelDeposit,
    userCancelDeposit,
    adminMarkNoShowAndForfeit,
  };