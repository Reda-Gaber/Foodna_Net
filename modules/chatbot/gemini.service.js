/**
 * Groq API Service
 * Handles communication with Groq API
 */

const Groq = require('groq-sdk');
const Logger = require('../../core/utils/logger');

class GeminiService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    Logger.info(`Groq Service: Initializing with API key: ${apiKey ? 'EXISTS (length: ' + apiKey.length + ')' : 'NOT SET'}`);
    
    if (!apiKey) {
      Logger.warn('GROQ_API_KEY not configured in environment');
      this.client = null;
    } else {
      try {
        this.client = new Groq({ apiKey });
        // Use llama-3.1-8b-instant - fast and efficient model
        // Supports both text generation and Arabic language responses
        this.model = 'llama-3.1-8b-instant';
        Logger.info('Groq client initialized successfully with model llama-3.1-8b-instant');
      } catch (err) {
        Logger.error('Failed to initialize Groq client:', err && err.message ? err.message : err);
        this.client = null;
      }
    }
  }

  /**
   * Generate response using Groq API
   * @param {string} userMessage - User's question
   * @param {array} products - Filtered products from database
   * @returns {Promise<string>} - Groq's response
   */
  async generateResponse(userMessage, products = []) {
    try {
      if (!this.client) {
        Logger.error('Groq client not initialized');
        return 'عذراً، لم يتم تكوين خدمة الذكاء الاصطناعي. يرجى التواصل مع الإدارة.';
      }

      Logger.info(`Groq: Processing message: "${userMessage}" with ${products.length} products`);

      // Call Groq via helper that formats context and returns only text
      return await this.askGemini(userMessage, products);
    } catch (error) {
      Logger.error('Groq API error:', error && error.message ? error.message : error);
      try { Logger.error('Groq API error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2)); } catch(e){}

      if (error && error.message && error.message.includes('API key')) {
        return 'عذراً، حدث خطأ في المصادقة مع خدمة الذكاء الاصطناعي.';
      }

      return 'عذراً، حدث خطأ في معالجة سؤالك. يرجى المحاولة لاحقاً.';
    }
  }

  /**
   * askGemini - build product context, call the SDK model and return only text
   * @param {string} userMessage
   * @param {Array} products
   * @returns {Promise<string>}
   */
  async askGemini(userMessage, products = []) {
    if (!this.client) {
      Logger.error('askGemini: Groq client not configured');
      return 'عذراً، لم يتم تكوين خدمة الذكاء الاصطناعي. يرجى التواصل مع الإدارة.';
    }

    try {
      const productContext = this.buildProductContext(products);

      const systemPrompt = `أنت مساعد طلب الطعام الذكي لمطعم فودنا شوب.
يجب أن تجيب فقط باستخدام قائمة المنتجات المقدمة أدناه.
لا تخترع منتجات أو أسعار جديدة.
كن مفيداً وودوداً وأجب باللغة العربية فقط.
إذا لم يجد المستخدم ما يبحث عنه في المنتجات المتاحة، أخبره بأسف باللغة العربية.

قائمة المنتجات المتاحة:
${productContext}`;

      console.log('[askGemini] About to call Groq API with message length:', systemPrompt.length + userMessage.length);
      Logger.info('askGemini: Sending request to Groq model');

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      });
      
      console.log('[askGemini] Raw result:', JSON.stringify(completion, null, 2).substring(0, 500));
      
      const text = completion && completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content ? completion.choices[0].message.content : null;

      if (!text) {
        console.log('[askGemini] No text returned. Result:', completion);
        Logger.error('askGemini: No text returned from Groq', { completion });
        return 'عذراً، لم أتمكن من الحصول على استجابة من خدمة الذكاء الاصطناعي.';
      }

      Logger.info('askGemini: Received response from Groq');
      return text;
    } catch (err) {
      console.error('[askGemini] ERROR:', err);
      console.error('[askGemini] Error message:', err && err.message);
      console.error('[askGemini] Error stack:', err && err.stack);
      
      Logger.error('askGemini error:', err && err.message ? err.message : err);
      try { Logger.error('askGemini details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch(e){}

      if (err && err.message && err.message.includes('API key')) {
        return 'عذراً، حدث خطأ في المصادقة مع خدمة الذكاء الاصطناعي.';
      }

      return 'عذراً، حدث خطأ في معالجة سؤالك. يرجى المحاولة لاحقاً.';
    }
  }

  /**
   * Build product context string for Groq
   * @param {array} products - Array of product objects
   * @returns {string} - Formatted product list
   */
  buildProductContext(products) {
    if (!products || products.length === 0) {
      return 'لا توجد منتجات متاحة حالياً.';
    }

    return products
      .map((product, index) => {
        return `${index + 1}. ${product.Product_Name}
   السعر: ${product.Price} جنيه
   الفئة: ${product.Category || 'عام'}
   الوصف: ${product.Description || 'بدون وصف'}
   الكمية المتاحة: ${product.Quantity || 'متاح'}`;
      })
      .join('\n\n');
  }

  /**
   * Check if Groq API is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.client !== null;
  }
}

module.exports = new GeminiService();
