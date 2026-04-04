const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Thiếu GEMINI_API_KEY trong file .env");
}

const ai = new GoogleGenAI({
  apiKey,
});

const askGemini = async (prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("Gemini raw response:", response);

    return response.text || "Xin lỗi, tôi chưa thể trả lời lúc này.";
  } catch (error) {
    console.error("Gemini service error:");
    console.error(error);
    throw error;
  }
};

module.exports = {
  askGemini,
};