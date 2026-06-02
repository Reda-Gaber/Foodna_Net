const db = require('../../config/db');
const geminiService = require('./gemini.service');
const Logger = require('../../core/utils/logger');

class ChatbotController {

  static async handleMessage(req, res) {
    try {
      const { message } = req.body;

      // Validate message exists and is a string
      if (!message) {
        Logger.warn('Chatbot: Missing message in request');
        return res.status(400).json({
          success: false,
          message: 'الرجاء إرسال رسالة'
        });
      }

      if (typeof message !== 'string') {
        Logger.warn('Chatbot: Message is not a string', { type: typeof message });
        return res.status(400).json({
          success: false,
          message: 'الرجاء إرسال رسالة صحيحة'
        });
      }

      const trimmedMessage = message.trim();

      // Validate message is not empty
      if (trimmedMessage.length === 0) {
        Logger.warn('Chatbot: Empty message received');
        return res.status(400).json({
          success: false,
          message: 'الرجاء إرسال رسالة صحيحة'
        });
      }

      // Validate message length (prevent extremely long messages)
      if (trimmedMessage.length > 1000) {
        Logger.warn('Chatbot: Message too long', { length: trimmedMessage.length });
        return res.status(400).json({
          success: false,
          message: 'الرسالة طويلة جداً. يرجى تقصيرها.'
        });
      }

      Logger.info(`[Chatbot] Received message: "${trimmedMessage.substring(0, 100)}${trimmedMessage.length > 100 ? '...' : ''}"`);

      const sanitizedMessage = ChatbotController.sanitizeInput(trimmedMessage);
      Logger.info(`[Chatbot] Sanitized message: "${sanitizedMessage}"`);

      // Get relevant products for context
      const products = await ChatbotController.getRelevantProducts(sanitizedMessage);
      Logger.info(`[Chatbot] Retrieved ${products.length} relevant products`);

      // Generate response from Groq
      const response = await geminiService.generateResponse(sanitizedMessage, products);
      
      if (!response || typeof response !== 'string' || response.trim().length === 0) {
        Logger.error('Chatbot: Generated response is empty');
        return res.status(500).json({
          success: false,
          message: 'عذراً، لم تتمكن خدمة الذكاء الاصطناعي من الرد. يرجى المحاولة مرة أخرى.'
        });
      }

      Logger.info(`[Chatbot] Generated response (length: ${response.length})`);

      const structuredResponse = ChatbotController.parseStructuredChatbotResponse(response);
      let displayMessage = response;

      if (structuredResponse) {
        if (structuredResponse.type === 'text' && typeof structuredResponse.message === 'string') {
          displayMessage = structuredResponse.message;
        } else if (structuredResponse.type === 'products' && Array.isArray(structuredResponse.items)) {
          displayMessage = 'إليك قائمة المنتجات المتاحة.';
        }
      }

      return res.json({
        success: true,
        message: displayMessage,
        data: {
          productsUsed: products.length,
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

  /**
   * Detect intent from user message and filter products accordingly
   * @param {string} message - User message
   * @returns {Promise<array>} - Filtered products
   */
  static async getRelevantProducts(message) {
    try {
      if (!message || typeof message !== 'string') {
        Logger.warn('getRelevantProducts: Invalid message input');
        return await ChatbotController.getAllProducts();
      }

      const lowerMessage = message.toLowerCase();
      Logger.info(`[Intent Detection] Analyzing message: "${message.substring(0, 50)}"`);

      // Intent: Cheapest products
      if (lowerMessage.includes('أرخص') || lowerMessage.includes('الأرخص') || 
          lowerMessage.includes('بأقل سعر') || lowerMessage.includes('أقل سعر')) {
        Logger.info('[Intent] Detected: cheapest products');
        return await ChatbotController.getCheapestProducts();
      }

      // Intent: Best products / Most selling
      if (lowerMessage.includes('الأفضل') || lowerMessage.includes('الأكثر') ||
          lowerMessage.includes('شهير') || lowerMessage.includes('مشهورة')) {
        Logger.info('[Intent] Detected: best/popular products');
        return await ChatbotController.getBestProducts();
      }

      // Intent: Products under specific price
      const priceMatch = message.match(/(\d+)\s*جنيه/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        Logger.info(`[Intent] Detected: products under ${price} pounds`);
        return await ChatbotController.getProductsUnderPrice(price);
      }

      // Intent: Category-based
      if (lowerMessage.includes('بيتزا')) {
        Logger.info('[Intent] Detected: pizza products');
        return await ChatbotController.getProductsByCategory('pizza');
      }
      if (lowerMessage.includes('دجاج')) {
        Logger.info('[Intent] Detected: chicken products');
        return await ChatbotController.getProductsByCategory('chicken');
      }
      if (lowerMessage.includes('شاي') || lowerMessage.includes('مشروب')) {
        Logger.info('[Intent] Detected: beverages');
        return await ChatbotController.getProductsByCategory('beverages');
      }

      // Default: Return all available products (limited)
      Logger.info('[Intent] No specific intent detected, returning all products');
      return await ChatbotController.getAllProducts();
    } catch (error) {
      Logger.error('[Intent Detection] Error:', error);
      // Fail gracefully and return all products
      try {
        return await ChatbotController.getAllProducts();
      } catch (fallbackError) {
        Logger.error('[Intent Detection] Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get cheapest products
   * @returns {Promise<array>}
   */
  static async getCheapestProducts() {
    try {
      Logger.info('[Database] Fetching cheapest products');
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`
      );
      Logger.info(`[Database] Retrieved ${products ? products.length : 0} cheapest products`);
      return products || [];
    } catch (error) {
      Logger.error('[Database] Error getting cheapest products:', error);
      return [];
    }
  }

  /**
   * Get best/most popular products (highest quantity available)
   * @returns {Promise<array>}
   */
  static async getBestProducts() {
    try {
      Logger.info('[Database] Fetching best/popular products');
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Quantity > 0
         ORDER BY Quantity DESC
         LIMIT 10`
      );
      Logger.info(`[Database] Retrieved ${products ? products.length : 0} best products`);
      return products || [];
    } catch (error) {
      Logger.error('[Database] Error getting best products:', error);
      return [];
    }
  }

  /**
   * Get products under specific price
   * @param {number} price - Maximum price
   * @returns {Promise<array>}
   */
  static async getProductsUnderPrice(price) {
    try {
      Logger.info(`[Database] Fetching products under ${price} pounds`);
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Price <= ? AND Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`,
        [price]
      );
      Logger.info(`[Database] Retrieved ${products ? products.length : 0} products under ${price} pounds`);
      return products || [];
    } catch (error) {
      Logger.error(`[Database] Error getting products under ${price}:`, error);
      return [];
    }
  }

  /**
   * Get products by category
   * @param {string} category - Category name
   * @returns {Promise<array>}
   */
  static async getProductsByCategory(category) {
    try {
      Logger.info(`[Database] Fetching products in category: ${category}`);
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE (Category LIKE ? OR Product_Name LIKE ?) AND Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`,
        [`%${category}%`, `%${category}%`]
      );
      Logger.info(`[Database] Retrieved ${products ? products.length : 0} products in category ${category}`);
      return products || [];
    } catch (error) {
      Logger.error(`[Database] Error getting products in category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get all available products (limited)
   * @returns {Promise<array>}
   */
  static async getAllProducts() {
    try {
      Logger.info('[Database] Fetching all available products');
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`
      );
      Logger.info(`[Database] Retrieved ${products ? products.length : 0} available products`);
      return products || [];
    } catch (error) {
      Logger.error('[Database] Error getting all products:', error);
      return [];
    }
  }

  /**
   * Parse a JSON-like chatbot response and return structured data
   * @param {string} rawText
   * @returns {object|null}
   */
  static parseStructuredChatbotResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return null;
    }

    const tryParse = (value) => {
      try {
        return JSON.parse(value);
      } catch (err) {
        return null;
      }
    };

    const trimmed = rawText.trim();
    const direct = tryParse(trimmed);
    if (direct) {
      return direct;
    }

    const jsonObjectMatch = trimmed.match(/(\{[\s\S]*\})/m);
    if (jsonObjectMatch) {
      const parsed = tryParse(jsonObjectMatch[1]);
      if (parsed) {
        return parsed;
      }
    }

    const jsonArrayMatch = trimmed.match(/(\[[\s\S]*\])/m);
    if (jsonArrayMatch) {
      const parsed = tryParse(jsonArrayMatch[1]);
      if (parsed) {
        return parsed;
      }
    }

    return null;
  }

  /**
   * Sanitize user input to prevent injection attacks
   * @param {string} input - User input
   * @returns {string} - Sanitized input
   */
  static sanitizeInput(input) {
    return input
      .replace(/[<>]/g, '') // Remove HTML-like characters
      .substring(0, 500)   // Limit length
      .trim();
  }
}

module.exports = ChatbotController;
