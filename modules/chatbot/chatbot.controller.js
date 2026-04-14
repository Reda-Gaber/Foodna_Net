const db = require('../../config/db');
const geminiService = require('./gemini.service');
const Logger = require('../../core/utils/logger');

class ChatbotController {

  static async handleMessage(req, res) {
    try {
      const { message } = req.body;

      Logger.info(`Chatbot: Received message: "${message}"`);

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'الرجاء إرسال رسالة صحيحة'
        });
      }

      const sanitizedMessage = ChatbotController.sanitizeInput(message.trim());
      Logger.info(`Chatbot: Sanitized message: "${sanitizedMessage}"`);

      const products = await ChatbotController.getRelevantProducts(sanitizedMessage);
      Logger.info(`Chatbot: Found ${products.length} relevant products`);

      const response = await geminiService.generateResponse(sanitizedMessage, products);
      Logger.info(`Chatbot: Generated response (length: ${response.length})`);

      return res.json({
        success: true,
        message: response,
        data: {
          productsUsed: products.length
        }
      });
    } catch (error) {
      Logger.error('Chatbot error:', error);
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ في معالجة الرسالة'
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
      const lowerMessage = message.toLowerCase();

      // Intent: Cheapest products
      if (lowerMessage.includes('أرخص') || lowerMessage.includes('الأرخص') || 
          lowerMessage.includes('بأقل سعر') || lowerMessage.includes('أقل سعر')) {
        return ChatbotController.getCheapestProducts();
      }

      // Intent: Best products / Most selling
      if (lowerMessage.includes('الأفضل') || lowerMessage.includes('الأكثر') ||
          lowerMessage.includes('شهير') || lowerMessage.includes('مشهورة')) {
        return ChatbotController.getBestProducts();
      }

      // Intent: Products under specific price
      const priceMatch = message.match(/(\d+)\s*جنيه/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        return ChatbotController.getProductsUnderPrice(price);
      }

      // Intent: Category-based
      if (lowerMessage.includes('بيتزا')) return ChatbotController.getProductsByCategory('pizza');
      if (lowerMessage.includes('دجاج')) return ChatbotController.getProductsByCategory('chicken');
      if (lowerMessage.includes('شاي') || lowerMessage.includes('مشروب')) {
        return ChatbotController.getProductsByCategory('beverages');
      }

      // Default: Return all available products (limited)
      return ChatbotController.getAllProducts();
    } catch (error) {
      Logger.error('Intent detection error:', error);
      return ChatbotController.getAllProducts();
    }
  }

  /**
   * Get cheapest products
   * @returns {Promise<array>}
   */
  static async getCheapestProducts() {
    try {
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`
      );
      return products;
    } catch (error) {
      Logger.error('Error getting cheapest products:', error);
      return [];
    }
  }

  /**
   * Get best/most popular products (highest quantity available)
   * @returns {Promise<array>}
   */
  static async getBestProducts() {
    try {
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Quantity > 0
         ORDER BY Quantity DESC
         LIMIT 10`
      );
      return products;
    } catch (error) {
      Logger.error('Error getting best products:', error);
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
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Price <= ? AND Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`,
        [price]
      );
      return products;
    } catch (error) {
      Logger.error('Error getting products under price:', error);
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
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE (Category LIKE ? OR Product_Name LIKE ?) AND Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`,
        [`%${category}%`, `%${category}%`]
      );
      return products;
    } catch (error) {
      Logger.error('Error getting products by category:', error);
      return [];
    }
  }

  /**
   * Get all available products (limited)
   * @returns {Promise<array>}
   */
  static async getAllProducts() {
    try {
      const [products] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity
         FROM Products
         WHERE Quantity > 0
         ORDER BY Price ASC
         LIMIT 10`
      );
      return products;
    } catch (error) {
      Logger.error('Error getting all products:', error);
      return [];
    }
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
