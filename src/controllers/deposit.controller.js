const Deposit = require("../models/deposit.model");
const Car = require("../models/car.model");
const User = require("../models/user.model");
const { createPayout } = require("../services/payosPayout.service");
const Promotion = require("../models/promotion.model");

const {
  notifyUser,
  notifyAllAdmins,
} = require("../services/notification.service");

const {
  createPaymentLink,
  generateOrderCode,
} = require("../services/payos.service");

const { getIO } = require("../utils/socket");

const ACTIVE_BOOKING_STATUSES = [
  "pending_payment",
  "paid",
  "confirmed",
  "waiting_full_payment",
  "ready_to_deliver",
];

const RESERVED_STATUSES = [
  "pending_payment",
  "paid",
  "confirmed",
  "waiting_full_payment",
  "ready_to_deliver",
];

const getUserId = (req) => req?.user?._id || req?.user?.id || null;

const getUserDisplayName = (req) =>
  req?.user?.fullName || req?.user?.name || req?.user?.email || "Nhân viên";

const emitToAdmins = (eventName, payload) => {
  try {
    const io = getIO();
    io.to("admins").emit(eventName, payload);
  } catch (error) {
    console.error(`Socket emit admins error [${eventName}]:`, error.message);
  }
};

const emitToUser = (userId, eventName, payload) => {
  try {
    if (!userId) return;
    const io = getIO();
    io.to(`user_${String(userId)}`).emit(eventName, payload);
  } catch (error) {
    console.error(`Socket emit user error [${eventName}]:`, error.message);
  }
};

const emitDepositChanged = (deposit, action, message) => {
  const payload = {
    action,
    message,
    deposit,
  };

  emitToAdmins("deposit_changed", payload);

  if (deposit?.userId) {
    emitToUser(deposit.userId, "deposit_changed", payload);
  }
};

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

const getApplicablePromotion = async (car, promotionId) => {
  if (!promotionId) return null;

  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new Error("Không tìm thấy voucher");
  }

  const now = new Date();

  if (promotion.status !== "active") {
    throw new Error("Voucher không hoạt động");
  }

  if (new Date(promotion.startDate) > now || new Date(promotion.endDate) < now) {
    throw new Error("Voucher đã hết hạn hoặc chưa bắt đầu");
  }

  const carBrand = String(car.brand || "").trim().toLowerCase();

  const isApplicable =
    promotion.applyScope === "all" ||
    (promotion.applyScope === "brand" &&
      String(promotion.brand || "").trim().toLowerCase() === carBrand) ||
    (promotion.applyScope === "car" &&
      Array.isArray(promotion.carIds) &&
      promotion.carIds.some((id) => String(id) === String(car._id)));

  if (!isApplicable) {
    throw new Error("Voucher không áp dụng cho xe này");
  }

  return promotion;
};

const calculateDiscountAmount = (carPrice, promotion) => {
  if (!promotion) return 0;

  const basePrice = Number(carPrice || 0);

  if (promotion.type === "amount") {
    return Math.max(Number(promotion.value || 0), 0);
  }

  if (promotion.type === "percent") {
    return Math.round((basePrice * Number(promotion.value || 0)) / 100);
  }

  return 0;
};

const buildDepositPricing = (carPrice, depositAmount, promotion) => {
  const financials = calculateFinancials(carPrice, depositAmount);
  const discountAmount = calculateDiscountAmount(carPrice, promotion);

  const finalEstimatedPrice = Math.max(
    Number(financials.totalEstimatedPrice || 0) - discountAmount,
    0
  );

  const remainingAmount = Math.max(
    finalEstimatedPrice - Number(depositAmount || 0),
    0
  );

  return {
    ...financials,
    discountAmount,
    finalEstimatedPrice,
    remainingAmount,
    promotionId: promotion ? promotion._id : null,
    promotionTitle: promotion ? promotion.title : "",
    promotionType: promotion ? promotion.type : "",
    promotionValue: promotion ? Number(promotion.value || 0) : 0,
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

const getReservedQuantityByCar = async (carId, excludeDepositId = null) => {
  const match = {
    carId,
    status: { $in: RESERVED_STATUSES },
  };

  if (excludeDepositId) {
    match._id = { $ne: excludeDepositId };
  }

  const result = await Deposit.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$carId",
        total: { $sum: 1 },
      },
    },
  ]);

  return result[0]?.total || 0;
};

const getCarAvailability = async (carId, excludeDepositId = null) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new Error("Không tìm thấy xe");
  }

  const totalQuantity = Number(car.quantity || 0);
  const reservedQuantity = await getReservedQuantityByCar(
    car._id,
    excludeDepositId
  );
  const availableQuantity = Math.max(totalQuantity - reservedQuantity, 0);

  return {
    car,
    totalQuantity,
    reservedQuantity,
    availableQuantity,
  };
};

const syncCarStatusByCarId = async (carId) => {
  const car = await Car.findById(carId);
  if (!car) return;

  const reservedQuantity = await getReservedQuantityByCar(car._id);
  const totalQuantity = Number(car.quantity || 0);

  const completedCount = await Deposit.countDocuments({
    carId: car._id,
    status: "completed",
  });

  car.soldCount = completedCount;

  if (totalQuantity <= 0) {
    car.status = "sold";
  } else if (reservedQuantity >= totalQuantity) {
    car.status = "reserved";
  } else {
    car.status = "available";
  }

  await car.save();
};

const syncCarStatusFromDeposit = async (deposit) => {
  if (!deposit?.carId) return;
  await syncCarStatusByCarId(deposit.carId);
};

const decreaseCarQuantityWhenCompleted = async (deposit) => {
  const car = await Car.findById(deposit.carId);
  if (!car) return;

  if (Number(car.quantity || 0) > 0) {
    car.quantity = Number(car.quantity || 0) - 1;
  }

  if (car.quantity < 0) {
    car.quantity = 0;
  }

  await car.save();
  await syncCarStatusByCarId(car._id);
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
      refundBankBin,
      refundBankAccountNumber,
      refundBankAccountName,
      promotionId,
    } = req.body;

    if (!fullName || !phone || !carId || !depositAmount) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, số điện thoại, xe và tiền cọc",
      });
    }

    const { car, availableQuantity } = await getCarAvailability(carId);

    if (!car) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    if (car.status === "sold" || Number(car.quantity || 0) <= 0) {
      return res.status(400).json({ message: "Xe này đã bán hoặc hết hàng" });
    }

    if (availableQuantity <= 0) {
      return res.status(400).json({
        message: "Xe đã hết suất đặt cọc",
      });
    }

    const depositCheck = validateDepositAmount(car.price, depositAmount);
    if (!depositCheck.ok) {
      return res.status(400).json({ message: depositCheck.message });
    }

    let promotion = null;

    if (promotionId) {
      try {
        promotion = await getApplicablePromotion(car, promotionId);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    const pricingData = buildDepositPricing(
      car.price,
      depositAmount,
      promotion
    );

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
      ...pricingData,

      pickupDate: pickupDate || "",
      pickupTimeSlot: pickupTimeSlot || "",
      deliveryMethod: deliveryMethod || "showroom",
      showroom: showroom?.trim() || "",
      deliveryAddress: deliveryAddress?.trim() || "",

      paymentMethod: "manual",
      paymentStatus: "paid",
      status: "paid",
      paidAt: new Date(),

      refundBankBin: refundBankBin?.trim() || "",
      refundBankAccountNumber: refundBankAccountNumber?.trim() || "",
      refundBankAccountName: refundBankAccountName?.trim() || "",
    });

    await syncCarStatusFromDeposit(newDeposit);

    emitToAdmins("new_deposit", {
      message: `Có đơn đặt cọc mới từ ${newDeposit.fullName}`,
      deposit: newDeposit,
    });

    emitDepositChanged(
      newDeposit,
      "created",
      `Đơn đặt cọc ${newDeposit.carName} đã được tạo`
    );

    await notifyAllAdmins({
      type: "new_deposit",
      title: "Đơn đặt cọc mới",
      message: `Có đơn đặt cọc mới từ ${newDeposit.fullName} cho xe ${newDeposit.carName}`,
      link: `/admin/deposits/${newDeposit._id}`,
      data: {
        depositId: newDeposit._id,
        carName: newDeposit.carName,
        orderCode: newDeposit.orderCode || "",
      },
    });

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
      refundBankBin,
      refundBankAccountNumber,
      refundBankAccountName,
      promotionId,
    } = req.body;

    if (!fullName || !phone || !carId || !depositAmount) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, số điện thoại, xe và tiền cọc",
      });
    }

    const { car, availableQuantity } = await getCarAvailability(carId);

    if (!car) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    if (car.status === "sold" || Number(car.quantity || 0) <= 0) {
      return res.status(400).json({ message: "Xe này đã bán hoặc hết hàng" });
    }

    if (availableQuantity <= 0) {
      return res.status(400).json({
        message: "Xe đã hết suất đặt cọc",
      });
    }

    const depositCheck = validateDepositAmount(car.price, depositAmount);
    if (!depositCheck.ok) {
      return res.status(400).json({ message: depositCheck.message });
    }

    let promotion = null;

    if (promotionId) {
      try {
        promotion = await getApplicablePromotion(car, promotionId);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    const pricingData = buildDepositPricing(
      car.price,
      depositCheck.value,
      promotion
    );

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
      paymentLink?.checkoutUrl || paymentLink?.data?.checkoutUrl || "";

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
      ...pricingData,

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

      refundBankBin: refundBankBin?.trim() || "",
      refundBankAccountNumber: refundBankAccountNumber?.trim() || "",
      refundBankAccountName: refundBankAccountName?.trim() || "",
    });

    await syncCarStatusFromDeposit(newDeposit);

    emitToAdmins("new_deposit_pending_payment", {
      message: `Có đơn đặt cọc PayOS mới từ ${newDeposit.fullName}`,
      deposit: newDeposit,
    });

    emitDepositChanged(
      newDeposit,
      "created_pending_payment",
      `Đơn cọc PayOS cho xe ${newDeposit.carName} đã được tạo`
    );

    await notifyAllAdmins({
      type: "new_deposit_payos",
      title: "Đơn cọc PayOS mới",
      message: `Có đơn đặt cọc PayOS mới từ ${newDeposit.fullName} cho xe ${newDeposit.carName}`,
      link: `/admin/deposits/${newDeposit._id}`,
      data: {
        depositId: newDeposit._id,
        carName: newDeposit.carName,
        orderCode: newDeposit.orderCode || "",
      },
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
    await syncCarStatusFromDeposit(deposit);

    emitToAdmins("deposit_paid", {
      message: `Khách đã thanh toán cọc xe ${deposit.carName}`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_paid", {
        message: `Bạn đã thanh toán cọc thành công cho xe ${deposit.carName}`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "paid",
      `Đơn cọc ${deposit.carName} đã thanh toán thành công`
    );

    await notifyAllAdmins({
      type: "deposit_paid",
      title: "Khách đã thanh toán cọc",
      message: `Khách đã thanh toán cọc cho xe ${deposit.carName}`,
      link: `/admin/deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_paid",
        title: "Thanh toán cọc thành công",
        message: `Bạn đã thanh toán cọc thành công cho xe ${deposit.carName}`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

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

    emitToAdmins("deposit_paid", {
      message: `Đã xác nhận khách thanh toán cọc xe ${deposit.carName}`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_paid", {
        message: `Đơn cọc xe ${deposit.carName} đã được xác nhận thanh toán`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "paid",
      `Đơn cọc ${deposit.carName} đã được xác nhận thanh toán`
    );

    await notifyAllAdmins({
      type: "deposit_paid_confirmed",
      title: "Đã xác nhận thanh toán cọc",
      message: `Admin đã xác nhận khách thanh toán cọc xe ${deposit.carName}`,
      link: `/admin/deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_paid_confirmed",
        title: "Đã xác nhận thanh toán cọc",
        message: `Đơn cọc xe ${deposit.carName} đã được xác nhận thanh toán`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

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

    emitToAdmins("deposit_confirmed", {
      message: `Nhân viên đã xác nhận cọc cho xe ${deposit.carName}`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_confirmed", {
        message: `Đơn cọc xe ${deposit.carName} đã được xác nhận`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "confirmed",
      `Đơn cọc ${deposit.carName} đã được xác nhận và chuyển sang chờ thanh toán phần còn lại`
    );

    await notifyUser({
      userId: deposit.userId,
      type: "deposit_confirmed",
      title: "Đơn cọc đã được xác nhận",
      message: `Đơn cọc xe ${deposit.carName} đã được xác nhận`,
      link: `/my-deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

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

    emitToAdmins("deposit_assigned", {
      message: `Đơn ${deposit.carName} đã được gán cho ${deposit.assignedStaffName}`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_assigned", {
        message: `Đơn cọc xe ${deposit.carName} đã có nhân viên phụ trách`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "assigned_staff",
      `Đơn cọc ${deposit.carName} đã được gán cho nhân viên phụ trách`
    );

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_assigned",
        title: "Đơn đã có người phụ trách",
        message: `Đơn cọc xe ${deposit.carName} đã có nhân viên phụ trách`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

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

    emitToAdmins("deposit_fully_paid", {
      message: `Khách đã thanh toán đủ cho xe ${deposit.carName}`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_fully_paid", {
        message: `Bạn đã thanh toán đủ cho xe ${deposit.carName}`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "fully_paid",
      `Đơn ${deposit.carName} đã thanh toán đầy đủ`
    );

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_fully_paid",
        title: "Đã xác nhận thanh toán đủ",
        message: `Đơn xe ${deposit.carName} đã được xác nhận thanh toán đầy đủ`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

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
    await decreaseCarQuantityWhenCompleted(deposit);

    emitToAdmins("deposit_completed", {
      message: `Đơn xe ${deposit.carName} đã hoàn tất`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_completed", {
        message: `Đơn xe ${deposit.carName} đã hoàn tất và giao xe thành công`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "completed",
      `Đơn ${deposit.carName} đã hoàn tất`
    );

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_completed",
        title: "Đơn hàng đã hoàn tất",
        message: `Đơn xe ${deposit.carName} đã hoàn tất và giao xe thành công`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

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
      .populate(
        "carId",
        "name brand category price year fuel transmission mileage color image images status quantity soldCount"
      )
      .populate("userId", "fullName name email phone")
      .populate("assignedStaffId", "fullName name email phone role")
      .populate("confirmedBy", "fullName name email phone role")
      .populate("invoiceUploadedBy", "fullName name email phone role")
      .populate("refundConfirmedBy", "fullName name email phone role");

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
      .populate("carId", "name brand category price image images status quantity soldCount")
      .populate("userId", "fullName name email phone")
      .populate("assignedStaffId", "fullName name email phone role")
      .populate("confirmedBy", "fullName name email phone role")
      .populate("refundConfirmedBy", "fullName name email phone role");

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

    emitToAdmins("deposit_cancelled", {
      message: `Đơn cọc xe ${deposit.carName} đã bị hủy`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_cancelled", {
        message: `Đơn cọc xe ${deposit.carName} đã bị hủy`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "cancelled",
      `Đơn cọc ${deposit.carName} đã bị hủy`
    );

    await notifyAllAdmins({
      type: "deposit_cancelled",
      title: "Đơn cọc đã bị hủy",
      message: `Đơn cọc xe ${deposit.carName} đã bị hủy`,
      link: `/admin/deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_cancelled",
        title: "Đơn cọc đã bị hủy",
        message: `Đơn cọc xe ${deposit.carName} đã bị hủy`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

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
      .populate("carId", "name brand category price image images status quantity soldCount")
      .populate("assignedStaffId", "fullName name email phone role")
      .populate("confirmedBy", "fullName name email phone role")
      .populate("refundConfirmedBy", "fullName name email phone role")
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
      .populate("carId", "name brand category price image status quantity soldCount")
      .populate("userId", "fullName name email phone")
      .populate("assignedStaffId", "fullName name email phone role")
      .populate("confirmedBy", "fullName name email phone role")
      .populate("refundConfirmedBy", "fullName name email phone role")
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

    const oldStatus = deposit.status;

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

    if (oldStatus !== "completed" && status === "completed") {
      await decreaseCarQuantityWhenCompleted(deposit);
    } else {
      await syncCarStatusFromDeposit(deposit);
    }

    emitDepositChanged(
      deposit,
      "status_updated",
      `Trạng thái đơn cọc ${deposit.carName} đã được cập nhật`
    );

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

    emitToAdmins("deposit_deleted", {
      message: `Đơn cọc xe ${deposit.carName} đã bị xóa`,
      depositId: id,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_deleted", {
        message: `Đơn cọc xe ${deposit.carName} đã bị xóa`,
        depositId: id,
      });
    }

    await notifyAllAdmins({
      type: "deposit_deleted",
      title: "Đơn cọc đã bị xóa",
      message: `Đơn cọc xe ${deposit.carName} đã bị xóa`,
      link: "/admin/deposits",
      data: {
        depositId: id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_deleted",
        title: "Đơn cọc đã bị xóa",
        message: `Đơn cọc xe ${deposit.carName} đã bị xóa`,
        link: "/my-deposits",
        data: {
          depositId: id,
          carName: deposit.carName,
        },
      });
    }

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

    emitDepositChanged(
      deposit,
      "invoice_uploaded",
      `Hóa đơn cho đơn ${deposit.carName} đã được tải lên`
    );

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
    const { reason } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt cọc" });
    }

    if (deposit.status === "completed") {
      return res.status(400).json({
        message: "Đơn đã hoàn tất, không thể hủy",
      });
    }

    deposit.cancelledAt = new Date();
    deposit.cancelledBy = req.user?._id || req.user?.id || null;
    deposit.cancelledByRole = "admin";

    if (deposit.paymentStatus !== "paid" || !deposit.paidAt) {
      deposit.status = "cancelled";
      deposit.paymentStatus =
        deposit.paymentStatus === "paid" ? "paid" : "cancelled";
      deposit.refundStatus = "none";
      deposit.refundReason = reason || "Admin hủy đơn";
      deposit.refundAmount = 0;
      deposit.refundAt = null;
      deposit.refundReferenceId = "";
      deposit.refundMethod = "";
      deposit.refundGatewayResponse = null;
      deposit.refundConfirmedBy = null;
      deposit.refundConfirmedAt = null;

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      emitToAdmins("deposit_cancelled", {
        message: `Admin đã hủy đơn xe ${deposit.carName}`,
        deposit,
      });

      if (deposit.userId) {
        emitToUser(deposit.userId, "deposit_cancelled", {
          message: `Đơn cọc xe ${deposit.carName} đã bị admin hủy`,
          deposit,
        });
      }

      emitDepositChanged(
        deposit,
        "cancelled_by_admin",
        `Admin đã hủy đơn cọc ${deposit.carName}`
      );

      await notifyAllAdmins({
        type: "deposit_cancelled_admin",
        title: "Admin đã hủy đơn",
        message: `Admin đã hủy đơn xe ${deposit.carName}`,
        link: `/admin/deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });

      if (deposit.userId) {
        await notifyUser({
          userId: deposit.userId,
          type: "deposit_cancelled_admin",
          title: "Đơn cọc đã bị admin hủy",
          message: `Đơn cọc xe ${deposit.carName} đã bị admin hủy`,
          link: `/my-deposits/${deposit._id}`,
          data: {
            depositId: deposit._id,
            carName: deposit.carName,
          },
        });
      }

      return res.status(200).json({
        message: "Admin đã hủy đơn thành công",
        deposit,
      });
    }

    const refundResult = await refundViaPayOS(
      deposit,
      reason || "Admin hủy đơn và hoàn cọc"
    );

    await deposit.save();
    await syncCarStatusFromDeposit(deposit);

    const adminRealtimeMessage = refundResult.ok
      ? `Admin đã hủy đơn ${deposit.carName} và gửi yêu cầu hoàn cọc`
      : refundResult.reasonType === "missing_bank_info"
      ? `Admin đã hủy đơn ${deposit.carName}, chờ hoàn cọc thủ công do thiếu thông tin tài khoản`
      : `Admin đã hủy đơn ${deposit.carName}, hoàn cọc tự động thất bại: ${refundResult.message}`;

    const userRealtimeMessage = refundResult.ok
      ? `Đơn cọc xe ${deposit.carName} đã bị hủy và đang xử lý hoàn cọc`
      : refundResult.reasonType === "missing_bank_info"
      ? `Đơn cọc xe ${deposit.carName} đã bị hủy và đang chờ hoàn cọc thủ công do thiếu thông tin tài khoản nhận hoàn`
      : `Đơn cọc xe ${deposit.carName} đã bị hủy. Hoàn cọc tự động thất bại: ${refundResult.message}. Vui lòng chờ admin xử lý thủ công`;

    emitToAdmins("deposit_cancelled", {
      message: adminRealtimeMessage,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_cancelled", {
        message: userRealtimeMessage,
        deposit,
      });
    }

    emitDepositChanged(deposit, "cancelled_by_admin", adminRealtimeMessage);

    await notifyAllAdmins({
      type: "deposit_cancelled_admin",
      title: "Admin đã hủy đơn",
      message: adminRealtimeMessage,
      link: `/admin/deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_cancelled_admin",
        title: "Đơn cọc đã bị hủy",
        message: userRealtimeMessage,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

    return res.status(200).json({
      message: refundResult.ok
        ? "Admin đã hủy đơn và gửi yêu cầu hoàn cọc qua PayOS"
        : refundResult.reasonType === "missing_bank_info"
        ? "Admin đã hủy đơn. Đơn được chuyển sang chờ hoàn cọc thủ công do thiếu thông tin tài khoản nhận hoàn."
        : `Admin đã hủy đơn. Hoàn cọc tự động thất bại: ${refundResult.message}. Đơn được chuyển sang chờ xử lý thủ công.`,
      deposit,
    });
  } catch (error) {
    console.error("adminCancelDeposit error:", error?.response?.data || error);
    return res.status(500).json({
      message: "Lỗi khi admin hủy đơn",
      error: error.message,
    });
  }
};



const isWithin24HoursFromPaidAt = (paidAt) => {
  if (!paidAt) return false;
  const now = Date.now();
  const paid = new Date(paidAt).getTime();
  return now - paid <= 24 * 60 * 60 * 1000;
};

const refundViaPayOS = async (deposit, reason) => {
  if (!deposit.refundBankBin || !deposit.refundBankAccountNumber) {
    deposit.refundStatus = "pending_refund";
    deposit.refundReason =
      reason || "Thiếu thông tin tài khoản nhận hoàn, chờ admin xử lý";
    deposit.refundAmount = Number(deposit.depositAmount || 0);
    deposit.refundAt = null;
    deposit.refundReferenceId = "";
    deposit.refundMethod = "manual";
    deposit.refundGatewayResponse = null;
    deposit.refundConfirmedBy = null;
    deposit.refundConfirmedAt = null;
    deposit.status = "cancelled";

    return {
      ok: false,
      pendingManual: true,
      reasonType: "missing_bank_info",
      message: "Thiếu thông tin tài khoản nhận hoàn",
    };
  }

  const referenceId = `refund_${deposit.orderCode}_${Date.now()}`;

  const payoutResult = await createPayout({
    referenceId,
    amount: Number(deposit.depositAmount || 0),
    description: `Hoan coc ${deposit.carName}`.slice(0, 25),
    toBin: deposit.refundBankBin,
    toAccountNumber: deposit.refundBankAccountNumber,
    category: ["refund"],
  });

  if (!payoutResult.success) {
    deposit.refundStatus = "pending_refund";
    deposit.refundReason =
      payoutResult.message || reason || "Gửi yêu cầu hoàn cọc thất bại";
    deposit.refundAmount = Number(deposit.depositAmount || 0);
    deposit.refundAt = null;
    deposit.refundReferenceId = referenceId;
    deposit.refundMethod = "payos_payout_failed";
    deposit.refundGatewayResponse = payoutResult.data || null;
    deposit.refundConfirmedBy = null;
    deposit.refundConfirmedAt = null;
    deposit.status = "cancelled";

    return {
      ok: false,
      pendingManual: true,
      reasonType: "payos_failed",
      message:
        payoutResult.message ||
        "Gửi payout thất bại, chuyển sang chờ admin xử lý",
    };
  }

  deposit.refundStatus = "pending_refund";
  deposit.refundReason = reason || "Đã gửi yêu cầu hoàn cọc qua PayOS";
  deposit.refundAmount = Number(deposit.depositAmount || 0);
  deposit.refundAt = null;
  deposit.refundReferenceId = referenceId;
  deposit.refundMethod = "payos_payout";
  deposit.refundGatewayResponse = payoutResult.data || null;
  deposit.refundConfirmedBy = null;
  deposit.refundConfirmedAt = null;
  deposit.status = "cancelled";

  return {
    ok: true,
    pendingManual: false,
    reasonType: "payos_sent",
    message: "Đã gửi yêu cầu hoàn cọc qua PayOS",
  };
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

    deposit.cancelledAt = new Date();
    deposit.cancelledBy = userId;
    deposit.cancelledByRole = "user";

    if (deposit.paymentStatus !== "paid" || !deposit.paidAt) {
      deposit.status = "cancelled";
      deposit.paymentStatus =
        deposit.paymentStatus === "paid" ? "paid" : "cancelled";
      deposit.refundStatus = "none";
      deposit.refundReason = "customer_cancelled_unpaid";
      deposit.refundAmount = 0;
      deposit.refundAt = null;
      deposit.refundReferenceId = "";
      deposit.refundMethod = "";
      deposit.refundGatewayResponse = null;
      deposit.refundConfirmedBy = null;
      deposit.refundConfirmedAt = null;

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      emitToAdmins("deposit_cancelled", {
        message: `Khách đã hủy đơn cọc xe ${deposit.carName}`,
        deposit,
      });

      emitToUser(deposit.userId, "deposit_cancelled", {
        message: `Bạn đã hủy đơn cọc xe ${deposit.carName}`,
        deposit,
      });

      emitDepositChanged(
        deposit,
        "cancelled_by_user",
        `Khách đã hủy đơn cọc ${deposit.carName}`
      );

      await notifyAllAdmins({
        type: "deposit_cancelled_by_user",
        title: "Khách đã hủy đơn",
        message: `${
          deposit.fullName || "Khách hàng"
        } đã hủy đơn cọc xe ${deposit.carName}`,
        link: `/admin/deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });

      await notifyUser({
        userId: deposit.userId,
        type: "deposit_cancelled_by_user",
        title: "Bạn đã hủy đơn",
        message: `Bạn đã hủy đơn cọc xe ${deposit.carName}`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });

      return res.status(200).json({
        message: "Bạn đã hủy đơn thành công",
        deposit,
      });
    }

    const within24h = isWithin24HoursFromPaidAt(deposit.paidAt);

    if (within24h) {
  const refundResult = await refundViaPayOS(
    deposit,
    "Khách hủy cọc trong vòng 24h"
  );

  await deposit.save();
  await syncCarStatusFromDeposit(deposit);

  const adminRealtimeMessage = refundResult.ok
    ? `Khách đã hủy đơn ${deposit.carName}, đang xử lý hoàn cọc`
    : refundResult.reasonType === "missing_bank_info"
    ? `Khách đã hủy đơn ${deposit.carName}, chờ hoàn cọc thủ công do thiếu thông tin tài khoản`
    : `Khách đã hủy đơn ${deposit.carName}, hoàn cọc tự động thất bại: ${refundResult.message}`;

  const userRealtimeMessage = refundResult.ok
    ? `Bạn đã hủy đơn ${deposit.carName}, hệ thống đang xử lý hoàn cọc`
    : refundResult.reasonType === "missing_bank_info"
    ? `Bạn đã hủy đơn ${deposit.carName}, hệ thống đang chờ hoàn cọc thủ công do thiếu thông tin tài khoản nhận hoàn`
    : `Bạn đã hủy đơn ${deposit.carName}. Hoàn cọc tự động thất bại: ${refundResult.message}. Vui lòng chờ admin xử lý thủ công`;

  emitToAdmins("deposit_cancelled", {
    message: adminRealtimeMessage,
    deposit,
  });

  emitToUser(deposit.userId, "deposit_cancelled", {
    message: userRealtimeMessage,
    deposit,
  });

  emitDepositChanged(
    deposit,
    "cancelled_by_user",
    adminRealtimeMessage
  );

  await notifyAllAdmins({
    type: "deposit_cancelled_by_user",
    title: "Khách đã hủy đơn",
    message: adminRealtimeMessage,
    link: `/admin/deposits/${deposit._id}`,
    data: {
      depositId: deposit._id,
      carName: deposit.carName,
    },
  });

  await notifyUser({
    userId: deposit.userId,
    type: "deposit_cancelled_by_user",
    title: "Đơn của bạn đã bị hủy",
    message: userRealtimeMessage,
    link: `/my-deposits/${deposit._id}`,
    data: {
      depositId: deposit._id,
      carName: deposit.carName,
    },
  });

  return res.status(200).json({
    message: refundResult.ok
      ? "Bạn đã hủy đơn và gửi yêu cầu hoàn cọc qua PayOS"
      : refundResult.reasonType === "missing_bank_info"
      ? "Bạn đã hủy đơn. Đơn đang chờ hoàn cọc thủ công do thiếu thông tin tài khoản nhận hoàn."
      : `Bạn đã hủy đơn. Yêu cầu hoàn cọc tự động thất bại: ${refundResult.message}. Vui lòng chờ admin xử lý thủ công.`,
    deposit,
  });
} else {
      deposit.status = "cancelled";
      deposit.refundStatus = "forfeited";
      deposit.refundReason = "Khách hủy cọc sau 24h, mất cọc";
      deposit.refundAmount = 0;
      deposit.refundAt = new Date();
      deposit.refundReferenceId = "";
      deposit.refundMethod = "";
      deposit.refundGatewayResponse = null;
      deposit.refundConfirmedBy = null;
      deposit.refundConfirmedAt = null;

      await deposit.save();
      await syncCarStatusFromDeposit(deposit);

      emitToAdmins("deposit_cancelled", {
        message: `Khách đã hủy đơn ${deposit.carName} sau 24h, mất cọc`,
        deposit,
      });

      emitToUser(deposit.userId, "deposit_cancelled", {
        message: `Bạn đã hủy đơn ${deposit.carName} sau 24h nên mất cọc`,
        deposit,
      });

      emitDepositChanged(
        deposit,
        "cancelled_by_user",
        `Khách đã hủy đơn ${deposit.carName} sau 24h nên mất cọc`
      );

      await notifyAllAdmins({
        type: "deposit_forfeited_by_user",
        title: "Khách hủy đơn quá hạn",
        message: `${
          deposit.fullName || "Khách hàng"
        } đã hủy đơn ${deposit.carName} sau 24h nên mất cọc`,
        link: `/admin/deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });

      await notifyUser({
        userId: deposit.userId,
        type: "deposit_forfeited_by_user",
        title: "Bạn đã mất cọc",
        message: `Bạn đã hủy đơn ${deposit.carName} sau 24h nên mất cọc`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });

      return res.status(200).json({
        message: "Bạn đã hủy đơn nhưng quá 24h nên mất cọc",
        deposit,
      });
    }
  } catch (error) {
    console.error("userCancelDeposit error:", error?.response?.data || error);
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
    deposit.refundAt = new Date();
    deposit.refundReferenceId = "";
    deposit.refundMethod = "";
    deposit.refundGatewayResponse = null;
    deposit.refundConfirmedBy = null;
    deposit.refundConfirmedAt = null;

    await deposit.save();
    await syncCarStatusFromDeposit(deposit);

    emitToAdmins("deposit_forfeited", {
      message: `Đơn ${deposit.carName} bị xử lý mất cọc do quá hạn nhận xe`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_forfeited", {
        message: `Đơn ${deposit.carName} đã bị hủy do quá hạn nhận xe hơn 7 ngày, cọc bị giữ`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "forfeited",
      `Đơn ${deposit.carName} đã bị xử lý mất cọc do quá hạn nhận xe`
    );

    await notifyAllAdmins({
      type: "deposit_forfeited",
      title: "Đơn bị xử lý mất cọc",
      message: `Đơn ${deposit.carName} bị xử lý mất cọc do quá hạn nhận xe`,
      link: `/admin/deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_forfeited",
        title: "Đơn bị hủy do quá hạn nhận xe",
        message: `Đơn ${deposit.carName} đã bị hủy do quá hạn nhận xe hơn 7 ngày, cọc bị giữ`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

    return res.status(200).json({
      message:
        "Đơn đã bị hủy do khách quá hạn nhận xe hơn 7 ngày, cọc bị giữ.",
      deposit,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xử lý quá hạn nhận xe",
      error: error.message,
    });
  }
};

const confirmRefundCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt cọc" });
    }

    if (!["pending_refund"].includes(deposit.refundStatus)) {
      return res.status(400).json({
        message: "Đơn này hiện không ở trạng thái chờ hoàn cọc",
      });
    }

    if (!["payos_payout", "manual"].includes(deposit.refundMethod)) {
      return res.status(400).json({
        message: "Đơn chưa có phương thức hoàn tiền hợp lệ để xác nhận",
      });
    }

    deposit.refundStatus = "refunded";
    deposit.status = "refunded";
    deposit.refundAt = new Date();
    deposit.refundConfirmedAt = new Date();
    deposit.refundConfirmedBy = req.user?._id || req.user?.id || null;

    await deposit.save();
    await syncCarStatusFromDeposit(deposit);

    emitToAdmins("deposit_refunded", {
      message: `Đơn ${deposit.carName} đã hoàn cọc thành công`,
      deposit,
    });

    if (deposit.userId) {
      emitToUser(deposit.userId, "deposit_refunded", {
        message: `Đơn ${deposit.carName} đã được hoàn cọc thành công`,
        deposit,
      });
    }

    emitDepositChanged(
      deposit,
      "refunded",
      `Đơn ${deposit.carName} đã được hoàn cọc thành công`
    );

    await notifyAllAdmins({
      type: "deposit_refunded",
      title: "Hoàn cọc thành công",
      message: `Đơn ${deposit.carName} đã hoàn cọc thành công`,
      link: `/admin/deposits/${deposit._id}`,
      data: {
        depositId: deposit._id,
        carName: deposit.carName,
      },
    });

    if (deposit.userId) {
      await notifyUser({
        userId: deposit.userId,
        type: "deposit_refunded",
        title: "Đã hoàn cọc thành công",
        message: `Đơn ${deposit.carName} đã được hoàn cọc thành công`,
        link: `/my-deposits/${deposit._id}`,
        data: {
          depositId: deposit._id,
          carName: deposit.carName,
        },
      });
    }

    return res.status(200).json({
      message: "Đã xác nhận hoàn cọc thành công",
      deposit,
    });
  } catch (error) {
    console.error("confirmRefundCompleted error:", error);
    return res.status(500).json({
      message: "Lỗi khi xác nhận hoàn cọc",
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
  confirmRefundCompleted,
};