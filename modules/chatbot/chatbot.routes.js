/**
 * Chatbot Routes
 */

const express = require('express');
const router = express.Router();
const ChatbotController = require('./chatbot.controller');


router.post('/chatbot', ChatbotController.handleMessage);

module.exports = router;
