const Car = require("../models/car.model");
const Promotion = require("../models/promotion.model");
const Showroom = require("../models/showroom.model");
const { askGemini } = require("../services/gemini.service");

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const chatWithBot = async (req, res) => {
  try {
    const { message, carId, userLocation } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        message: "Thiếu nội dung câu hỏi",
      });
    }

    const [showrooms, promotions, cars] = await Promise.all([
      Showroom.find({ status: "active" }).lean(),
      Promotion.find().sort({ createdAt: -1 }).limit(5).lean(),
      Car.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    let currentCar = null;
    if (carId) {
      currentCar = await Car.findById(carId).lean();
    }

    let nearestShowrooms = [];
    if (
      userLocation &&
      typeof userLocation.latitude === "number" &&
      typeof userLocation.longitude === "number"
    ) {
      nearestShowrooms = showrooms
        .map((item) => ({
          ...item,
          distanceKm: getDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            item.latitude,
            item.longitude
          ),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3);
    }

    const prompt = `
Bạn là trợ lý AI cho website bán xe.
Chỉ trả lời bằng tiếng Việt.
Giọng văn lịch sự, ngắn gọn, rõ ràng.
Chỉ dùng dữ liệu được cung cấp bên dưới, không tự bịa thêm.
Nếu chưa có dữ liệu thì nói rõ là hiện hệ thống chưa có thông tin đó.

Dữ liệu xe:
${JSON.stringify(cars, null, 2)}

Xe người dùng đang xem:
${JSON.stringify(currentCar, null, 2)}

Dữ liệu khuyến mãi:
${JSON.stringify(promotions, null, 2)}

Dữ liệu showroom:
${JSON.stringify(showrooms, null, 2)}

Showroom gần người dùng nhất:
${JSON.stringify(nearestShowrooms, null, 2)}

Câu hỏi của người dùng:
${message}
`;

    const answer = await askGemini(prompt);

    return res.status(200).json({
      message: "Chatbot trả lời thành công",
      answer,
    });
  } catch (error) {
  console.error("CHATBOT ERROR:", error);

  return res.status(500).json({
    message: "Lỗi chatbot",
    error: error.message,
  });
}
};

module.exports = {
  chatWithBot,
};