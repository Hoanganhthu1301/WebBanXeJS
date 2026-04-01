const Deposit = require("../models/deposit.model");

const toMoney = (value) => Number(value || 0);

const isInRange = (date, startDate, endDate) => {
  if (!date) return false;
  const d = new Date(date);
  return d >= startDate && d <= endDate;
};

const getDateRange = ({ type = "day", date, month, year }) => {
  const now = new Date();
  let startDate;
  let endDate;

  if (type === "day") {
    const selected = date ? new Date(date) : now;
    startDate = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
      0,
      0,
      0,
      0
    );
    endDate = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
      23,
      59,
      59,
      999
    );
  } else if (type === "month") {
    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth = Number(month) || now.getMonth() + 1;
    startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
    endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
  } else if (type === "year") {
    const selectedYear = Number(year) || now.getFullYear();
    startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
    endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  } else {
    throw new Error("type không hợp lệ");
  }

  return { startDate, endDate };
};

const buildMonthlyRevenue = (deposits, selectedYear) => {
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    name: `T${i + 1}`,
    revenue: 0,
    depositRevenue: 0,
    fullPaymentRevenue: 0,
  }));

  deposits.forEach((item) => {
    if (item.paidAt) {
      const paidAt = new Date(item.paidAt);
      if (paidAt.getFullYear() === selectedYear) {
        const monthIndex = paidAt.getMonth();
        const value = toMoney(item.depositAmount);
        monthly[monthIndex].depositRevenue += value;
        monthly[monthIndex].revenue += value;
      }
    }

    if (item.fullyPaidAt) {
      const fullyPaidAt = new Date(item.fullyPaidAt);
      if (fullyPaidAt.getFullYear() === selectedYear) {
        const monthIndex = fullyPaidAt.getMonth();
        const value = toMoney(item.fullPaymentAmount);
        monthly[monthIndex].fullPaymentRevenue += value;
        monthly[monthIndex].revenue += value;
      }
    }
  });

  return monthly;
};

const buildDailyRevenueInMonth = (deposits, selectedMonth, selectedYear) => {
  const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

  const daily = Array.from({ length: totalDays }, (_, i) => ({
    name: `${i + 1}`,
    revenue: 0,
    depositRevenue: 0,
    fullPaymentRevenue: 0,
  }));

  deposits.forEach((item) => {
    if (item.paidAt) {
      const paidAt = new Date(item.paidAt);
      if (
        paidAt.getFullYear() === selectedYear &&
        paidAt.getMonth() + 1 === selectedMonth
      ) {
        const dayIndex = paidAt.getDate() - 1;
        const value = toMoney(item.depositAmount);
        daily[dayIndex].depositRevenue += value;
        daily[dayIndex].revenue += value;
      }
    }

    if (item.fullyPaidAt) {
      const fullyPaidAt = new Date(item.fullyPaidAt);
      if (
        fullyPaidAt.getFullYear() === selectedYear &&
        fullyPaidAt.getMonth() + 1 === selectedMonth
      ) {
        const dayIndex = fullyPaidAt.getDate() - 1;
        const value = toMoney(item.fullPaymentAmount);
        daily[dayIndex].fullPaymentRevenue += value;
        daily[dayIndex].revenue += value;
      }
    }
  });

  return daily;
};

const getRevenueReport = async (req, res) => {
  try {
    const { type = "day", date, month, year } = req.query;

    const { startDate, endDate } = getDateRange({ type, date, month, year });

    const now = new Date();
    const selectedYear = Number(year) || now.getFullYear();
    const selectedMonth =
      type === "month" ? Number(month) || now.getMonth() + 1 : now.getMonth() + 1;

    const reportYearStart = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
    const reportYearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    const deposits = await Deposit.find({
      $or: [
        { paidAt: { $gte: reportYearStart, $lte: reportYearEnd } },
        { fullyPaidAt: { $gte: reportYearStart, $lte: reportYearEnd } },
      ],
    })
      .populate("userId", "fullName name email")
      .populate("carId", "name brand")
      .sort({ createdAt: -1 });

    let depositRevenue = 0;
    let fullPaymentRevenue = 0;

    const rows = deposits
      .map((item) => {
        let depositCollected = 0;
        let fullCollected = 0;

        if (isInRange(item.paidAt, startDate, endDate)) {
          depositCollected = toMoney(item.depositAmount);
          depositRevenue += depositCollected;
        }

        if (isInRange(item.fullyPaidAt, startDate, endDate)) {
          fullCollected = toMoney(item.fullPaymentAmount);
          fullPaymentRevenue += fullCollected;
        }

        return {
          _id: item._id,
          carName: item.carName || item.carId?.name || "",
          customerName:
            item.fullName ||
            item.userId?.fullName ||
            item.userId?.name ||
            item.userId?.email ||
            "",
          status: item.status,
          depositAmount: toMoney(item.depositAmount),
          fullPaymentAmount: toMoney(item.fullPaymentAmount),
          depositCollected,
          fullCollected,
          paidAt: item.paidAt,
          fullyPaidAt: item.fullyPaidAt,
        };
      })
      .filter((item) => item.depositCollected > 0 || item.fullCollected > 0);

    const totalRevenue = depositRevenue + fullPaymentRevenue;

    const monthlyRevenue = buildMonthlyRevenue(deposits, selectedYear);
    const dailyRevenue =
      type === "month"
        ? buildDailyRevenueInMonth(deposits, selectedMonth, selectedYear)
        : [];

    const pieRevenue = [
      { name: "Tiền cọc", value: depositRevenue },
      { name: "Thanh toán còn lại", value: fullPaymentRevenue },
    ];

    return res.status(200).json({
      message: "Lấy báo cáo doanh thu thành công",
      filter: {
        type,
        date: date || null,
        month: type === "month" ? selectedMonth : null,
        year: selectedYear,
        startDate,
        endDate,
      },
      summary: {
        depositRevenue,
        fullPaymentRevenue,
        totalRevenue,
        totalOrders: rows.length,
      },
      charts: {
        monthlyRevenue,
        dailyRevenue,
        pieRevenue,
      },
      rows,
    });
  } catch (error) {
    console.error("getRevenueReport error:", error);
    return res.status(500).json({
      message: "Lỗi lấy báo cáo doanh thu",
      error: error.message,
    });
  }
};

module.exports = {
  getRevenueReport,
};