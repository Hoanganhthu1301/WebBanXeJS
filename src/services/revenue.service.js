const Deposit = require("../models/deposit.model");
const Revenue = require("../models/revenue.model");

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

const buildPeriodKey = ({ type, date, month, year }) => {
  if (type === "day") {
    const selected = date ? new Date(date) : new Date();
    const y = selected.getFullYear();
    const m = String(selected.getMonth() + 1).padStart(2, "0");
    const d = String(selected.getDate()).padStart(2, "0");
    return `day-${y}-${m}-${d}`;
  }

  if (type === "month") {
    const y = Number(year) || new Date().getFullYear();
    const m = String(Number(month) || new Date().getMonth() + 1).padStart(2, "0");
    return `month-${y}-${m}`;
  }

  if (type === "year") {
    const y = Number(year) || new Date().getFullYear();
    return `year-${y}`;
  }

  throw new Error("type không hợp lệ");
};

const calculateRevenueData = async ({ type = "day", date, month, year, note = "" }) => {
  const { startDate, endDate } = getDateRange({ type, date, month, year });

  const now = new Date();
  let selectedYear = Number(year) || now.getFullYear();
  let selectedMonth = null;
  let selectedDay = null;

  if (type === "day") {
    const selected = date ? new Date(date) : now;
    selectedYear = selected.getFullYear();
    selectedMonth = selected.getMonth() + 1;
    selectedDay = selected.getDate();
  } else if (type === "month") {
    selectedMonth = Number(month) || now.getMonth() + 1;
  }

  const deposits = await Deposit.find({
    $or: [
      { paidAt: { $gte: startDate, $lte: endDate } },
      { fullyPaidAt: { $gte: startDate, $lte: endDate } },
    ],
  }).lean();

  let depositRevenue = 0;
  let fullPaymentRevenue = 0;
  let depositCount = 0;
  let fullPaymentCount = 0;

  const orderIdSet = new Set();

  deposits.forEach((item) => {
    orderIdSet.add(String(item._id));

    if (isInRange(item.paidAt, startDate, endDate)) {
      depositRevenue += toMoney(item.depositAmount);
      depositCount += 1;
    }

    if (isInRange(item.fullyPaidAt, startDate, endDate)) {
      fullPaymentRevenue += toMoney(item.fullPaymentAmount);
      fullPaymentCount += 1;
    }
  });

  return {
    type,
    year: selectedYear,
    month: selectedMonth,
    day: selectedDay,
    periodKey: buildPeriodKey({ type, date, month, year }),
    startDate,
    endDate,
    depositRevenue,
    fullPaymentRevenue,
    totalRevenue: depositRevenue + fullPaymentRevenue,
    depositCount,
    fullPaymentCount,
    totalOrders: orderIdSet.size,
    note,
    lastCalculatedAt: new Date(),
  };
};

const saveRevenueToDb = async ({ type = "day", date, month, year, note = "" }) => {
  const revenueData = await calculateRevenueData({ type, date, month, year, note });

  const revenue = await Revenue.findOneAndUpdate(
    { periodKey: revenueData.periodKey },
    revenueData,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return revenue;
};

const getSavedRevenueList = async ({ type, year, month }) => {
  const query = {};

  if (type) query.type = type;
  if (year) query.year = Number(year);
  if (month) query.month = Number(month);

  return Revenue.find(query).sort({
    year: -1,
    month: -1,
    day: -1,
    createdAt: -1,
  });
};

const getSavedRevenueDetail = async (id) => {
  return Revenue.findById(id);
};

module.exports = {
  calculateRevenueData,
  saveRevenueToDb,
  getSavedRevenueList,
  getSavedRevenueDetail,
};