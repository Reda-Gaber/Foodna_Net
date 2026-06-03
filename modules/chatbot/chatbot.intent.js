const MenuSearchService = require('./menuSearch.service');
const {
  LIST_PATTERNS,
  PRICE_PATTERNS,
  ADVISORY_PATTERNS,
  COMPARE_PATTERNS,
  FILTER_PATTERNS,
  normalizeForMatch,
  hasProductKeyword,
  matchesAny,
} = require('./chatbot.patterns');

const RESPONSE_TYPES = {
  LIST: 'LIST',
  FILTER: 'FILTER',
  PRICE: 'PRICE',
  COMPARE: 'COMPARE',
  ADVISORY: 'ADVISORY',
};

class ChatbotIntent {
  static get TYPES() {
    return RESPONSE_TYPES;
  }

  static classify(message) {
    if (MenuSearchService.isGreetingOnly(message)) {
      return 'GREETING';
    }

    const n = normalizeForMatch(message);

    if (matchesAny(n, COMPARE_PATTERNS)) {
      return RESPONSE_TYPES.COMPARE;
    }

    if (matchesAny(n, ADVISORY_PATTERNS)) {
      return RESPONSE_TYPES.ADVISORY;
    }

    if (matchesAny(n, PRICE_PATTERNS)) {
      return RESPONSE_TYPES.PRICE;
    }

    if (ChatbotIntent.isListQuery(n)) {
      return RESPONSE_TYPES.LIST;
    }

    if (ChatbotIntent.isFilterQuery(message, n)) {
      return RESPONSE_TYPES.FILTER;
    }

    if (hasProductKeyword(n)) {
      return RESPONSE_TYPES.FILTER;
    }

    return 'UNCLEAR';
  }

  static isListQuery(normalizedText) {
    if (!matchesAny(normalizedText, LIST_PATTERNS)) {
      return false;
    }
    return !hasProductKeyword(normalizedText);
  }

  static isFilterQuery(message, normalizedText) {
    const n = normalizedText || normalizeForMatch(message);

    if (matchesAny(n, ADVISORY_PATTERNS)) {
      return false;
    }

    if (hasProductKeyword(n)) {
      return true;
    }

    return matchesAny(n, FILTER_PATTERNS) && !ChatbotIntent.isListQuery(n);
  }

  static isExpensiveQuery(message) {
    const n = normalizeForMatch(message);
    return /(?:اغلى|أغلى|اكثر|أكثر|غالي|غاليه|expensive)/i.test(n);
  }
}

module.exports = ChatbotIntent;
