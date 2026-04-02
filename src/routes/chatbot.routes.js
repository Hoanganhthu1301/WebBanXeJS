const express = require("express");
const router = express.Router();

const chatbotController = require("../controllers/chatbot.controller");

router.post("/", chatbotController.chatWithBot);

module.exports = router;