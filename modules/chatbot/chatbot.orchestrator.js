const MenuSearchService = require('./menuSearch.service');
const ChatbotIntent = require('./chatbot.intent');
const ChatbotUtils = require('./chatbot.utils');
const geminiService = require('./gemini.service');
const Logger = require('../../core/utils/logger');

class ChatbotOrchestrator {
  static async handle(userMessage, history = []) {
    const message = String(userMessage || '').trim();
    const intent = ChatbotIntent.classify(message);

    Logger.info(`[ChatbotOrchestrator] Intent=${intent} message="${message.substring(0, 80)}"`);

    if (intent === 'GREETING') {
      return ChatbotUtils.buildAdvisoryResponse(
        'مرحباً! أنا فودي، مساعدك في مطعم فودنا. اسأل عن المنيو، فلتر منتجات، الأسعار، أو المقارنة بين منتجين.'
      );
    }

    if (intent === 'UNCLEAR') {
      return ChatbotUtils.buildAdvisoryResponse(
        'ممكن توضّح سؤالك أكثر؟ مثلاً: «هات قائمة الطعام»، «هل في عصير متاح؟»، «إيه أرخص أكل؟»، «هل البيتزا مناسبة لمرضى السكر؟»'
      );
    }

    switch (intent) {
      case ChatbotIntent.TYPES.LIST:
        return this.handleList();
      case ChatbotIntent.TYPES.FILTER:
        return this.handleFilter(message);
      case ChatbotIntent.TYPES.PRICE:
        return this.handlePrice(message);
      case ChatbotIntent.TYPES.COMPARE:
        return this.handleCompare(message);
      case ChatbotIntent.TYPES.ADVISORY:
        return this.handleAdvisory(message, history);
      default:
        return ChatbotUtils.buildAdvisoryResponse('ممكن توضّح سؤالك أكثر؟');
    }
  }

  static async handleList() {
    const menu = await MenuSearchService.getAllAvailableProducts();

    if (menu.length === 0) {
      return ChatbotUtils.buildAdvisoryResponse('المنيو فارغ حالياً — لا توجد منتجات متاحة.');
    }

    return ChatbotUtils.buildListResponse(menu);
  }

  static async handleFilter(message) {
    const result = await MenuSearchService.searchAvailable(message);
    return ChatbotUtils.buildFilterResponse(result.rows, {
      notice: result.notice,
      emptyMessage: result.emptyMessage,
    });
  }

  static async handlePrice(message) {
    const isExpensive = ChatbotIntent.isExpensiveQuery(message);
    const rows = isExpensive
      ? await MenuSearchService.getMostExpensiveProducts(3)
      : await MenuSearchService.getCheapestProducts(3);

    return ChatbotUtils.buildPriceResponse(rows, message, isExpensive);
  }

  static async handleCompare(message) {
    const { first, second, targets } = await MenuSearchService.findProductsForCompare(message);

    if (targets.length >= 2) {
      if (!first && !second) {
        return ChatbotUtils.buildCompareResponse(null, null,
          `المنتجان «${targets[0]}» و«${targets[1]}» غير موجودين في المنيو حالياً.`);
      }
      if (!first) {
        return ChatbotUtils.buildCompareResponse(null, null,
          `المنتج «${targets[0]}» غير موجود في المنيو.\n\nالمنتج الثاني: ${second.Product_Name} — ${Number(second.Price).toFixed(2)} جنيه. ${String(second.Description || 'بدون وصف').slice(0, 80)}`);
      }
      if (!second) {
        return ChatbotUtils.buildCompareResponse(null, null,
          `المنتج الأول: ${first.Product_Name} — ${Number(first.Price).toFixed(2)} جنيه. ${String(first.Description || 'بدون وصف').slice(0, 80)}\n\nالمنتج «${targets[1]}» غير موجود في المنيو.`);
      }
    }

    if (!first || !second) {
      return ChatbotUtils.buildCompareResponse(null, null,
        'محتاج منتجين للمقارنة. مثال: «قارن بين برجر دجاج وبيتزا فراخ».');
    }

    return ChatbotUtils.buildCompareResponse(first, second);
  }

  static async handleAdvisory(message, history) {
    const menu = await MenuSearchService.getRelevantMenuForAdvisory(message);
    const raw = await geminiService.generateAdvisoryResponse(message, menu, history);

    const parsed = ChatbotUtils.parseStructuredResponse(raw);
    const validated = ChatbotUtils.validateAdvisoryResponse(parsed);

    if (validated) {
      return validated;
    }

    if (parsed && typeof parsed.message === 'string') {
      return ChatbotUtils.buildAdvisoryResponse(parsed.message);
    }

    return ChatbotUtils.buildAdvisoryResponse(
      'بحذر: البيانات المتاحة عن المنتجات محدودة. يُفضّل مراجعة المكونات مع فريق المطعم قبل الطلب.'
    );
  }
}

module.exports = ChatbotOrchestrator;
