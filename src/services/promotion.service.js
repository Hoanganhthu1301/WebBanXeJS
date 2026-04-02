const Promotion = require("../models/promotion.model");

const isPromotionActiveNow = (promotion) => {
  const now = new Date();
  return (
    promotion.status === "active" &&
    new Date(promotion.startDate) <= now &&
    new Date(promotion.endDate) >= now
  );
};

const calculatePricing = (carPrice, promotion) => {
  const originalPrice = Number(carPrice) || 0;

  if (!promotion) {
    return {
      originalPrice,
      discountAmount: 0,
      finalPrice: originalPrice,
    };
  }

  let discountAmount = 0;

  if (promotion.type === "amount") {
    discountAmount = Number(promotion.value) || 0;
  } else if (promotion.type === "percent") {
    discountAmount = Math.round(
      originalPrice * ((Number(promotion.value) || 0) / 100)
    );
  } else {
    discountAmount = 0;
  }

  if (discountAmount > originalPrice) {
    discountAmount = originalPrice;
  }

  return {
    originalPrice,
    discountAmount,
    finalPrice: Math.max(0, originalPrice - discountAmount),
  };
};

const findBestPromotionForCar = async (car) => {
  const promotions = await Promotion.find({
    status: "active",
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  }).sort({ createdAt: -1 });

  let carPromotion = null;
  let brandPromotion = null;
  let allPromotion = null;

  for (const promo of promotions) {
    if (!isPromotionActiveNow(promo)) continue;

    if (promo.applyScope === "car") {
      const matched = promo.carIds.some(
        (id) => id.toString() === car._id.toString()
      );
      if (matched && !carPromotion) {
        carPromotion = promo;
      }
    }

    if (
      promo.applyScope === "brand" &&
      promo.brand &&
      promo.brand.trim().toLowerCase() === String(car.brand).trim().toLowerCase()
    ) {
      if (!brandPromotion) {
        brandPromotion = promo;
      }
    }

    if (promo.applyScope === "all" && !allPromotion) {
      allPromotion = promo;
    }
  }

  return carPromotion || brandPromotion || allPromotion || null;
};

module.exports = {
  findBestPromotionForCar,
  calculatePricing,
};