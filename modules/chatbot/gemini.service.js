/**
 * Groq API Service
 * Handles communication with Groq API with comprehensive error handling and retry logic
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
        this.client = new Groq({ 
          apiKey,
          // Add timeout to prevent hanging requests
          timeout: 30000 // 30 seconds timeout
        });
        // llama-3.1-8b-instant - verified working model with good Arabic support
        this.model = 'llama-3.1-8b-instant';
        Logger.info('✓ Groq client initialized successfully with model: ' + this.model);
      } catch (err) {
        Logger.error('Failed to initialize Groq client:', err);
        this.client = null;
      }
    }

    // Configuration for resilience
    this.maxRetries = 2;
    this.retryDelayMs = 1000;
  }

  /**
   * Generate response using Groq API with retry logic
   * @param {string} userMessage - User's question
   * @param {array} products - Filtered products from database
   * @returns {Promise<string>} - Groq's response
   */
  async generateResponse(userMessage, products = []) {
    try {
      if (!this.client) {
        Logger.error('CRITICAL: Groq client not initialized - check GROQ_API_KEY environment variable');
        return 'عذراً، لم يتم تكوين خدمة الذكاء الاصطناعي. يرجى التواصل مع الإدارة.';
      }

      // Validate input
      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        Logger.warn('Empty or invalid message received');
        return 'عذراً، الرجاء إرسال رسالة صحيحة.';
      }

      const sanitizedMsg = userMessage.trim().substring(0, 1000); // Limit length
      Logger.info(`[Chatbot] Processing message: "${sanitizedMsg}" | Products: ${products.length}`);

      // Call with retry logic
      return await this.askGeminiWithRetry(sanitizedMsg, products);
    } catch (error) {
      Logger.error('generateResponse - Unexpected error:', error);
      return 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.';
    }
  }

  /**
   * Call Groq API with automatic retry on transient failures
   * @param {string} userMessage
   * @param {array} products
   * @param {number} attempt
   * @returns {Promise<string>}
   */
  async askGeminiWithRetry(userMessage, products = [], attempt = 1) {
    try {
      return await this.askGemini(userMessage, products);
    } catch (error) {
      const isTransient = this.isTransientError(error);
      const shouldRetry = isTransient && attempt < this.maxRetries;

      console.error(`\n[RETRY_CHECK] Attempt: ${attempt}, IsTransient: ${isTransient}, ShouldRetry: ${shouldRetry}`);
      console.error(`[RETRY_CHECK] Status: ${error.status}, Code: ${error.code}`);

      if (shouldRetry) {
        Logger.warn(`[Chatbot] Transient error on attempt ${attempt}, retrying in ${this.retryDelayMs}ms...`, {
          errorCode: error.code || error.status,
          message: error.message
        });
        
        // Wait before retrying
        await this.sleep(this.retryDelayMs);
        return await this.askGeminiWithRetry(userMessage, products, attempt + 1);
      }

      // Log full error details for debugging
      this.logDetailedError(error, userMessage);

      // Return user-friendly error message based on error type
      return this.getErrorMessage(error);
    }
  }

  /**
   * Check if error is transient (can be retried)
   * @param {Error} error
   * @returns {boolean}
   */
  isTransientError(error) {
    // Network timeouts
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      return true;
    }

    // HTTP 429 (rate limit) and 503 (service unavailable) are transient
    if (error.status === 429 || error.status === 503 || error.status === 502 || error.status === 504) {
      return true;
    }

    // Check error message for transient indicators
    const msg = error.message || '';
    if (msg.includes('timeout') || msg.includes('temporarily')) {
      return true;
    }

    return false;
  }

  /**
   * Get user-friendly error message based on error type
   * @param {Error} error
   * @returns {string}
   */
  getErrorMessage(error) {
    const status = error.status;
    const code = error.code;
    const msg = error.message || '';

    Logger.error(`[Chatbot] ERROR Details:`, {
      status,
      code,
      message: msg,
      type: error.constructor.name,
      hasApiError: !!error.error,
      hasResponse: !!error.response
    });

    // API key issues - more specific logging
    if (status === 401 || msg.includes('API key') || msg.includes('Unauthorized') || msg.includes('api_key')) {
      Logger.error('❌ [AUTHENTICATION FAILED] - Check your GROQ_API_KEY in .env file', {
        apiKeyConfigured: !!process.env.GROQ_API_KEY,
        apiKeyLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
        apiKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'NOT SET'
      });
      return 'عذراً، حدث خطأ في المصادقة مع خدمة الذكاء الاصطناعي. يرجى التواصل مع الإدارة.';
    }

    // Rate limit
    if (status === 429) {
      Logger.warn('Rate limit exceeded');
      return 'عذراً، تم تجاوز حد الطلبات. يرجى المحاولة مرة أخرى بعد قليل.';
    }

    // Server errors (500+)
    if (status && status >= 500) {
      Logger.error('Groq server error: ' + status);
      return 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً.';
    }

    // Invalid request (400)
    if (status === 400 || msg.includes('Invalid')) {
      Logger.error('Invalid request to Groq API');
      return 'عذراً، حدث خطأ في معالجة طلبك. يرجى إعادة الصيغة.';
    }

    // Network/timeout errors
    if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || msg.includes('timeout')) {
      Logger.error('Network timeout');
      return 'عذراً، انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.';
    }

    // Generic fallback
    Logger.error(`Unknown error - Status: ${status}, Code: ${code}, Message: ${msg}`);
    return 'عذراً، حدث خطأ في معالجة سؤالك. يرجى المحاولة لاحقاً.';
  }

  /**
   * Log detailed error information for debugging
   * @param {Error} error
   * @param {string} userMessage
   */
  logDetailedError(error, userMessage) {
    const errorData = {
      status: error.status || 'N/A',
      code: error.code || 'N/A',
      message: error.message || 'Unknown error',
      type: error.constructor.name,
      headers: error.headers || {},
      userMessage: userMessage.substring(0, 100) // Log first 100 chars of message
    };

    try {
      // Try to extract API response body if available
      if (error.response) {
        errorData.responseBody = error.response;
      }
      if (error.error) {
        errorData.apiError = error.error;
      }
    } catch (e) {
      // Ignore error in error logging
    }

    Logger.error('[Chatbot] Groq API Error Details:', errorData);
  }

  /**
   * askGemini - Build product context, call the Groq API and return text
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

**تعليمات مهمة لعرض المنتجات:**
- إذا طلب المستخدم بدائل أو خيارات (مثل: "اعطني خيارات"، "أرخص منتجات"، "أنواع العصائر")
- فيجب أرجاع قائمة المنتجات بصيغة جدول Markdown بهذا الشكل تماماً:

| 🏷️ الصنف | 💰 السعر | 📝 الوصف | 📌 الكود |
|---------|--------|---------|--------|
| عصير برتقال طازج | 20 جنيه | عصير طبيعي من البرتقال الطازج | juice_1 |
| عصير الشمام والزنجبيل | 25 جنيه | خليط صحي ومنعش | juice_2 |

- كل صف في الجدول يمثل منتج واحد
- استخدم الرموز التعبيرية (Emojis) في رأس الجدول
- ضمّن في الجدول: الاسم، السعر، الوصف المختصر، وكود فريد للمنتج
- لا تضيف نصاً إضافياً قبل أو بعد الجدول، فقط الجدول الواحد

- إذا كان السؤال عاماً أو تحية، أرد بشكل طبيعي دون جداول

قائمة المنتجات المتاحة:
${productContext}`;

      const payload = {
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
      };

      Logger.info('[Groq API] Sending request', {
        model: this.model,
        systemPromptLength: systemPrompt.length,
        userMessageLength: userMessage.length,
        productsCount: products.length
      });

      const completion = await this.client.chat.completions.create(payload);

      Logger.info('[Groq API] Received response successfully');

      // Safe response extraction with validation
      const responseText = this.extractResponseText(completion);
      
      if (!responseText) {
        Logger.error('askGemini: No text extracted from response', {
          hasCompletion: !!completion,
          hasChoices: !!(completion && completion.choices),
          choicesLength: completion && completion.choices ? completion.choices.length : 0,
          firstChoice: completion && completion.choices && completion.choices[0] ? 'present' : 'missing',
          message: completion && completion.choices && completion.choices[0] ? JSON.stringify(completion.choices[0].message) : 'N/A'
        });
        return 'عذراً، لم أتمكن من الحصول على استجابة من خدمة الذكاء الاصطناعي.';
      }

      Logger.info(`[Groq API] Response length: ${responseText.length} characters`);
      return responseText;

    } catch (err) {
      // Log raw error for debugging
      console.error('\n[GROQ_ERROR_RAW]', err);
      console.error('[GROQ_ERROR_MESSAGE]', err.message);
      console.error('[GROQ_ERROR_STATUS]', err.status);
      console.error('[GROQ_ERROR_CODE]', err.code);
      console.error('[GROQ_ERROR_RESPONSE]', err.response);
      
      // Re-throw to be caught by retry logic
      Logger.error('askGemini: API call failed', {
        status: err.status,
        code: err.code,
        message: err.message
      });
      throw err;
    }
  }

  /**
   * Safely extract response text from Groq API response
   * @param {Object} completion
   * @returns {string|null}
   */
  extractResponseText(completion) {
    try {
      // Validate completion object
      if (!completion) {
        Logger.warn('extractResponseText: completion is null');
        return null;
      }

      // Navigate safely through the response structure
      if (!Array.isArray(completion.choices) || completion.choices.length === 0) {
        Logger.warn('extractResponseText: no choices in response', { choicesType: typeof completion.choices });
        return null;
      }

      const firstChoice = completion.choices[0];
      if (!firstChoice || !firstChoice.message) {
        Logger.warn('extractResponseText: no message in first choice');
        return null;
      }

      const content = firstChoice.message.content;
      if (!content || typeof content !== 'string') {
        Logger.warn('extractResponseText: content is not a string', { contentType: typeof content });
        return null;
      }

      // Validate content is not empty after trimming
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        Logger.warn('extractResponseText: content is empty after trimming');
        return null;
      }

      return trimmedContent;
    } catch (error) {
      Logger.error('extractResponseText: Error extracting text', { error: error.message });
      return null;
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

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new GeminiService();
