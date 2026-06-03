/**
 * Groq API Service
 */

const Groq = require('groq-sdk');
const Logger = require('../../core/utils/logger');
const ChatbotUtils = require('./chatbot.utils');

class GeminiService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    Logger.info(`Groq Service: Initializing with API key: ${apiKey ? 'EXISTS (length: ' + apiKey.length + ')' : 'NOT SET'}`);

    if (!apiKey) {
      Logger.warn('GROQ_API_KEY not configured in environment');
      this.client = null;
    } else {
      try {
        this.client = new Groq({ apiKey, timeout: 30000 });
        this.model = 'llama-3.3-70b-versatile';
        Logger.info('✓ Groq client initialized successfully with model: ' + this.model);
      } catch (err) {
        Logger.error('Failed to initialize Groq client:', err);
        this.client = null;
      }
    }

    this.maxRetries = 2;
    this.retryDelayMs = 1000;
  }

  async generateAdvisoryResponse(userMessage, menu = [], history = []) {
    try {
      if (!this.client) {
        return JSON.stringify({
          type: 'ADVISORY',
          message: 'بحذر: لا يمكن تقديم نصيحة مفصّلة حالياً. راجع فريق المطعم للتفاصيل الصحية أو الغذائية.',
        });
      }

      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return JSON.stringify({
          type: 'ADVISORY',
          message: 'الرجاء إرسال سؤال أوضح.',
        });
      }

      const sanitizedMsg = userMessage.trim().substring(0, 500);
      Logger.info(`[Chatbot] ADVISORY: "${sanitizedMsg}" | Menu: ${menu.length}`);

      return await this.askAdvisoryWithRetry(sanitizedMsg, menu, history);
    } catch (error) {
      Logger.error('generateAdvisoryResponse - Unexpected error:', error);
      return JSON.stringify({
        type: 'ADVISORY',
        message: 'بحذر: حدث خطأ أثناء معالجة سؤالك. يُفضّل التواصل مع فريق المطعم.',
      });
    }
  }

  async askAdvisoryWithRetry(userMessage, menu = [], history = [], attempt = 1) {
    try {
      const raw = await this.askAdvisory(userMessage, menu, history, attempt);
      const parsed = ChatbotUtils.parseStructuredResponse(raw);
      const valid = ChatbotUtils.validateAdvisoryResponse(parsed);

      if (attempt < this.maxRetries && !valid) {
        Logger.warn(`[Chatbot] Invalid ADVISORY JSON on attempt ${attempt}, retrying...`);
        await this.sleep(this.retryDelayMs);
        return await this.askAdvisoryWithRetry(userMessage, menu, history, attempt + 1);
      }

      return raw;
    } catch (error) {
      const isTransient = this.isTransientError(error);
      if (isTransient && attempt < this.maxRetries) {
        await this.sleep(this.retryDelayMs);
        return await this.askAdvisoryWithRetry(userMessage, menu, history, attempt + 1);
      }

      this.logDetailedError(error, userMessage);
      return JSON.stringify({
        type: 'ADVISORY',
        message: this.getErrorMessage(error),
      });
    }
  }

  async askAdvisory(userMessage, menu = [], history = [], attempt = 1) {
    if (!this.client) {
      return JSON.stringify({
        type: 'ADVISORY',
        message: 'بحذر: خدمة النصائح غير متاحة حالياً.',
      });
    }

    const productContext = this.buildProductContext(menu);
    const hasJuice = menu.some((p) => /عصير|juice/i.test(`${p.Product_Name} ${p.Description || ''}`));
    const menuNote = hasJuice
      ? ''
      : '\n\nملاحظة: لا يوجد عصير طبيعي في المنيو. المنتجات المعروضة قد تكون مشروبات غازية وليست عصيراً.';
    const retryNote = attempt > 1 ? '\n\nأعد JSON صالح فقط: {"type":"ADVISORY","message":"..."}' : '';

    const systemPrompt = `أنت "فودي" — مساعد مطعم فودنا. مهمتك: نصائح عامة فقط (ADVISORY).
ردودك بالعربي فقط.

## مصدر الحقيقة الوحيد
المنيو التالي — ممنوع اختراع منتجات أو أسعار:
${productContext}${menuNote}

## قواعد ADVISORY (إلزامي)
- أعد JSON فقط: {"type":"ADVISORY","message":"..."}
- ممنوع جدول — نص فقط
- ابدأ الرسالة بأحد: "مناسب" أو "غير مناسب" أو "بحذر"
- ثم السبب باختصار
- أجب عن السؤال المحدد: إذا ذكر "دايت" أو "رجيم" لا تتحدث عن "مرضى السكر" إلا إذا سُئل عنهم
- إذا سُئل عن العصير ولا يوجد عصير في المنيو: وضّح ذلك ثم علّق على المشروبات المتاحة إن وُجدت
- لا تقدم تشخيصاً أو نصائح طبية قطعية
- لو البيانات غير كافية: اذكر ذلك بوضوح
- اعتمد على المنتجات الموجودة في المنيو فقط${retryNote}`;

    const messages = [{ role: 'system', content: systemPrompt }];

    for (const entry of history) {
      if (entry && (entry.role === 'user' || entry.role === 'assistant') && typeof entry.content === 'string') {
        messages.push({ role: entry.role, content: entry.content.substring(0, 500) });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const responseText = this.extractResponseText(completion);
    if (!responseText) {
      throw new Error('Empty response from Groq');
    }

    return responseText;
  }

  async generateResponse(userMessage, products = [], history = []) {
    try {
      if (!this.client) {
        Logger.error('CRITICAL: Groq client not initialized');
        return JSON.stringify({
          type: 'text',
          message: 'عذراً، لم يتم تكوين خدمة الذكاء الاصطناعي. يرجى التواصل مع الإدارة.'
        });
      }

      if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
        return JSON.stringify({
          type: 'text',
          message: 'عذراً، الرجاء إرسال رسالة صحيحة.'
        });
      }

      const sanitizedMsg = userMessage.trim().substring(0, 500);
      Logger.info(`[Chatbot] Processing message: "${sanitizedMsg}" | Products: ${products.length} | History: ${history.length}`);

      return await this.askGeminiWithRetry(sanitizedMsg, products, history);
    } catch (error) {
      Logger.error('generateResponse - Unexpected error:', error);
      return JSON.stringify({
        type: 'text',
        message: 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.'
      });
    }
  }

  async askGeminiWithRetry(userMessage, products = [], history = [], attempt = 1) {
    try {
      const raw = await this.askGemini(userMessage, products, history, attempt);

      if (attempt < this.maxRetries && !ChatbotUtils.parseStructuredResponse(raw)) {
        Logger.warn(`[Chatbot] Invalid JSON on attempt ${attempt}, retrying...`);
        await this.sleep(this.retryDelayMs);
        return await this.askGeminiWithRetry(userMessage, products, history, attempt + 1);
      }

      return raw;
    } catch (error) {
      const isTransient = this.isTransientError(error);
      const shouldRetry = isTransient && attempt < this.maxRetries;

      if (shouldRetry) {
        Logger.warn(`[Chatbot] Retrying attempt ${attempt} after transient error...`);
        await this.sleep(this.retryDelayMs);
        return await this.askGeminiWithRetry(userMessage, products, history, attempt + 1);
      }

      this.logDetailedError(error, userMessage);
      return JSON.stringify({
        type: 'text',
        message: this.getErrorMessage(error)
      });
    }
  }

  async askGemini(userMessage, products = [], history = [], attempt = 1) {
    if (!this.client) {
      return JSON.stringify({
        type: 'text',
        message: 'عذراً، لم يتم تكوين خدمة الذكاء الاصطناعي.'
      });
    }

    try {
      const productContext = this.buildProductContext(products);
      const retryNote = attempt > 1 ? '\n\nمهم: أعد JSON صالح فقط بدون أي نص إضافي.' : '';

      const systemPrompt = `أنت "فودي" — المساعد الذكي لمطعم فودنا. شخصيتك ودودة وحماسية.
ردودك بالعربي فقط.

## مهمتك
- الرد على التحيات والأسئلة العامة (ليست عن منتجات محددة)
- لا تخترع منتجات أو أسعار — المنتجات تأتي من قاعدة البيانات فقط

## قواعد الرد (إلزامي)
أعد JSON فقط — بدون markdown أو نص خارج JSON.

### للتحيات والشكر والأسئلة العامة:
{"type":"text","message":"ردك الودود هنا"}

### إذا وُجدت منتجات في السياق وسأل الزبون عنها:
{"type":"products","items":[{"id":1,"name":"اسم المنتج","price":20,"category":"الفئة","desc":"وصف مختصر"}]}
- استخدم id وname وprice من القائمة فقط — لا تغيّرها
- ممنوع type:text يقول "مفيش" إذا كانت القائمة غير فارغة

## المنتجات المتاحة (من قاعدة البيانات):
${productContext}${retryNote}`;

      const messages = [{ role: 'system', content: systemPrompt }];

      for (const entry of history) {
        if (entry && (entry.role === 'user' || entry.role === 'assistant') && typeof entry.content === 'string') {
          messages.push({ role: entry.role, content: entry.content.substring(0, 500) });
        }
      }

      messages.push({ role: 'user', content: userMessage });

      const payload = {
        model: this.model,
        messages,
        temperature: 0,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      };

      Logger.info('[Groq API] Sending request', {
        model: this.model,
        productsCount: products.length,
        historyCount: history.length
      });

      const completion = await this.client.chat.completions.create(payload);
      Logger.info('[Groq API] Received response successfully');

      const responseText = this.extractResponseText(completion);

      if (!responseText) {
        Logger.error('askGemini: No text extracted from response');
        throw new Error('Empty response from Groq');
      }

      Logger.info(`[Groq API] Response length: ${responseText.length} characters`);
      return responseText;

    } catch (err) {
      Logger.error('askGemini: API call failed', {
        status: err.status,
        code: err.code,
        message: err.message
      });
      throw err;
    }
  }

  extractResponseText(completion) {
    try {
      if (!completion) return null;
      if (!Array.isArray(completion.choices) || completion.choices.length === 0) return null;

      const firstChoice = completion.choices[0];
      if (!firstChoice || !firstChoice.message) return null;

      const content = firstChoice.message.content;
      if (!content || typeof content !== 'string') return null;

      const trimmed = content.trim();
      return trimmed.length === 0 ? null : trimmed;
    } catch (error) {
      Logger.error('extractResponseText: Error', { error: error.message });
      return null;
    }
  }

  buildProductContext(products) {
    if (!products || products.length === 0) {
      return 'لا توجد منتجات في السياق — استخدم type:text للرد العام فقط.';
    }

    const byCategory = {};
    for (const p of products) {
      const cat = p.Category || 'عام';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    }

    return Object.entries(byCategory)
      .map(([cat, items]) => {
        const lines = items.map(p =>
          `  - [ID:${p.Product_ID}] ${p.Product_Name} | السعر: ${p.Price} جنيه | ${p.Description || 'بدون وصف'}`
        ).join('\n');
        return `### فئة: ${cat}\n${lines}`;
      })
      .join('\n\n');
  }

  isTransientError(error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') return true;
    if (error.status === 429 || error.status === 503 || error.status === 502 || error.status === 504) return true;
    const msg = error.message || '';
    if (msg.includes('timeout') || msg.includes('temporarily')) return true;
    return false;
  }

  getErrorMessage(error) {
    const status = error.status;
    const code = error.code;
    const msg = error.message || '';

    if (status === 401 || msg.includes('API key') || msg.includes('Unauthorized')) {
      return 'عذراً، حدث خطأ في المصادقة مع خدمة الذكاء الاصطناعي. يرجى التواصل مع الإدارة.';
    }
    if (status === 429) return 'عذراً، تم تجاوز حد الطلبات. يرجى المحاولة بعد قليل.';
    if (status && status >= 500) return 'عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى المحاولة لاحقاً.';
    if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || msg.includes('timeout')) {
      return 'عذراً، انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.';
    }
    return 'عذراً، حدث خطأ في معالجة سؤالك. يرجى المحاولة لاحقاً.';
  }

  logDetailedError(error, userMessage) {
    Logger.error('[Chatbot] Groq API Error:', {
      status: error.status || 'N/A',
      code: error.code || 'N/A',
      message: error.message || 'Unknown',
      userMessage: userMessage.substring(0, 100)
    });
  }

  isConfigured() {
    return this.client !== null;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new GeminiService();
