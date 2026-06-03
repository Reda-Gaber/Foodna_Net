const db = require('../../config/db');
const ChatbotOrchestrator = require('./chatbot.orchestrator');
const ChatbotUtils = require('./chatbot.utils');
const Logger = require('../../core/utils/logger');

const MAX_HISTORY = 8;

class ChatbotController {

  static async handleMessage(req, res) {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, message: 'الرجاء إرسال رسالة' });
      }

      if (typeof message !== 'string') {
        return res.status(400).json({ success: false, message: 'الرجاء إرسال رسالة صحيحة' });
      }

      const trimmedMessage = message.trim();

      if (trimmedMessage.length === 0) {
        return res.status(400).json({ success: false, message: 'الرجاء إرسال رسالة صحيحة' });
      }

      if (trimmedMessage.length > 1000) {
        return res.status(400).json({ success: false, message: 'الرسالة طويلة جداً. يرجى تقصيرها.' });
      }

      Logger.info(`[Chatbot] Received message: "${trimmedMessage.substring(0, 100)}"`);

      const sanitizedMessage = ChatbotController.sanitizeInput(trimmedMessage);
      const history = ChatbotController.getSessionHistory(req);

      const structuredResponse = await ChatbotOrchestrator.handle(sanitizedMessage, history);

      if (!structuredResponse) {
        return res.status(500).json({
          success: false,
          message: 'عذراً، لم تتمكن خدمة الذكاء الاصطناعي من الرد. يرجى المحاولة مرة أخرى.'
        });
      }

      ChatbotController.appendSessionHistory(req, sanitizedMessage, structuredResponse);

      const displayMessage = ChatbotUtils.toDisplayMessage(structuredResponse);
      const items = ChatbotUtils.getItemsForResponse(structuredResponse);
      const responseType = ChatbotUtils.normalizeResponseType(structuredResponse)?.type || 'UNKNOWN';

      Logger.info(`[Chatbot] Response type=${responseType} items=${items.length}`);

      return res.json({
        success: true,
        message: displayMessage,
        data: {
          productsUsed: items.length,
          responseType,
          structuredResponse
        }
      });

    } catch (error) {
      Logger.error('[Chatbot] Unexpected error in handleMessage:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.'
      });
    }
  }

  static getSessionHistory(req) {
    if (!req.session) return [];

    if (!Array.isArray(req.session.chatbotHistory)) {
      req.session.chatbotHistory = [];
    }

    return req.session.chatbotHistory.slice(-MAX_HISTORY);
  }

  static appendSessionHistory(req, userMessage, structuredResponse) {
    if (!req.session) return;

    if (!Array.isArray(req.session.chatbotHistory)) {
      req.session.chatbotHistory = [];
    }

    const assistantText = ChatbotUtils.toDisplayMessage(structuredResponse);

    req.session.chatbotHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantText }
    );

    if (req.session.chatbotHistory.length > MAX_HISTORY * 2) {
      req.session.chatbotHistory = req.session.chatbotHistory.slice(-MAX_HISTORY * 2);
    }
  }

  /**
   * Parse JSON response from chatbot (legacy — used by tests)
   */
  static parseStructuredChatbotResponse(rawText) {
    return ChatbotUtils.parseStructuredResponse(rawText);
  }

  static sanitizeInput(input) {
    return input
      .replace(/[<>]/g, '')
      .substring(0, 500)
      .trim();
  }
}

module.exports = ChatbotController;
