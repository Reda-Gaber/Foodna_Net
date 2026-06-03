const ChatbotIntent = require('./chatbot.intent');

const { LIST, FILTER, PRICE, COMPARE, ADVISORY } = ChatbotIntent.TYPES;

class ChatbotUtils {
  static parseStructuredResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;

    const tryParse = (value) => {
      try { return JSON.parse(value); } catch { return null; }
    };

    const trimmed = rawText.trim();
    const direct = tryParse(trimmed);
    if (direct) return direct;

    const jsonObjectMatch = trimmed.match(/(\{[\s\S]*\})/m);
    if (jsonObjectMatch) {
      const parsed = tryParse(jsonObjectMatch[1]);
      if (parsed) return parsed;
    }

    return null;
  }

  static mapRowToItem(row) {
    return {
      id: row.Product_ID,
      name: row.Product_Name,
      price: Number(row.Price),
      desc: String(row.Description || 'بدون وصف').slice(0, 120),
      img: row.Image || null,
    };
  }

  static buildListResponse(rows) {
    return {
      type: LIST,
      items: (rows || []).map((row) => this.mapRowToItem(row)),
    };
  }

  static buildFilterResponse(rows, options = {}) {
    const emptyMessage = options.emptyMessage || 'مفيش نتائج مطابقة';
    const notice = options.notice || null;

    if (!rows || rows.length === 0) {
      return {
        type: FILTER,
        message: emptyMessage,
        items: [],
      };
    }

    const response = {
      type: FILTER,
      items: rows.map((row) => this.mapRowToItem(row)),
    };

    if (notice) {
      response.message = notice;
    }

    return response;
  }

  static buildPriceResponse(rows, message, isExpensive) {
    if (!rows || rows.length === 0) {
      return {
        type: PRICE,
        message: 'لا توجد منتجات متاحة حالياً.',
      };
    }

    const label = isExpensive ? 'أغلى' : 'أرخص';
    const top = rows[0];
    const topName = top.Product_Name;
    const topPrice = Number(top.Price).toFixed(2);

    if (rows.length === 1) {
      return {
        type: PRICE,
        message: `${label} منتج متاح: ${topName} — ${topPrice} جنيه.`,
      };
    }

    const lines = rows.slice(0, 3).map((p, i) =>
      `${i + 1}) ${p.Product_Name} — ${Number(p.Price).toFixed(2)} جنيه`
    );

    return {
      type: PRICE,
      message: `${label} المنتجات المتاحة:\n${lines.join('\n')}`,
    };
  }

  static buildCompareResponse(productA, productB, missingLabel) {
    if (missingLabel) {
      return {
        type: COMPARE,
        message: missingLabel,
      };
    }

    const priceA = Number(productA.Price);
    const priceB = Number(productB.Price);
    const descA = String(productA.Description || 'بدون وصف').slice(0, 80);
    const descB = String(productB.Description || 'بدون وصف').slice(0, 80);
    const priceDiff = Math.abs(priceA - priceB);

    let diffText;
    if (priceA === priceB) {
      diffText = 'السعران متساويان.';
    } else {
      const cheaper = priceA <= priceB ? productA.Product_Name : productB.Product_Name;
      diffText = `${cheaper} أرخص بـ ${priceDiff.toFixed(2)} جنيه.`;
    }

    return {
      type: COMPARE,
      message: [
        `المنتج الأول: ${productA.Product_Name} — ${priceA.toFixed(2)} جنيه. ${descA}`,
        `المنتج الثاني: ${productB.Product_Name} — ${priceB.toFixed(2)} جنيه. ${descB}`,
        `الفرق: ${diffText}`,
      ].join('\n\n'),
    };
  }

  static buildAdvisoryResponse(message) {
    return {
      type: ADVISORY,
      message: String(message || '').trim(),
    };
  }

  static validateAdvisoryResponse(parsed) {
    if (!parsed || typeof parsed.message !== 'string') {
      return null;
    }

    const type = String(parsed.type || '').toUpperCase();
    if (type !== ADVISORY && type !== 'TEXT') {
      return null;
    }

    const message = parsed.message.trim();
    if (!message) return null;

    return { type: ADVISORY, message };
  }

  static isTableResponse(response) {
    if (!response) return false;
    const type = String(response.type || '').toUpperCase();
    if (type === LIST || type === FILTER) {
      return Array.isArray(response.items) && response.items.length > 0;
    }
    // legacy
    return response.type === 'products' && Array.isArray(response.items) && response.items.length > 0;
  }

  static normalizeResponseType(response) {
    if (!response || !response.type) return response;

    const legacyMap = {
      products: LIST,
      text: ADVISORY,
    };

    const upper = String(response.type).toUpperCase();
    if (Object.values(ChatbotIntent.TYPES).includes(upper)) {
      return { ...response, type: upper };
    }

    if (legacyMap[response.type]) {
      const mapped = { ...response, type: legacyMap[response.type] };
      if (legacyMap[response.type] === LIST && response.items) {
        return mapped;
      }
      if (legacyMap[response.type] === ADVISORY && response.message) {
        return mapped;
      }
    }

    return response;
  }

  static toDisplayMessage(structuredResponse) {
    const response = this.normalizeResponseType(structuredResponse);

    if (!response) {
      return '';
    }

    if (response.type === LIST && Array.isArray(response.items)) {
      return response.items.length > 0 ? '' : 'لا توجد منتجات متاحة حالياً.';
    }

    if (response.type === FILTER) {
      if (!response.items || response.items.length === 0) {
        return response.message || 'مفيش نتائج مطابقة';
      }
      return response.message || '';
    }

    if ([PRICE, COMPARE, ADVISORY].includes(response.type) && typeof response.message === 'string') {
      return response.message;
    }

    if (response.type === 'products' && Array.isArray(response.items)) {
      return response.items.length > 0 ? '' : 'مفيش نتائج مطابقة';
    }

    if (response.type === 'text' && typeof response.message === 'string') {
      return response.message;
    }

    return '';
  }

  static getItemsForResponse(response) {
    const normalized = this.normalizeResponseType(response);
    if (!normalized || !Array.isArray(normalized.items)) return [];
    return normalized.items;
  }
}

module.exports = ChatbotUtils;
