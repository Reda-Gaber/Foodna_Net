const db = require('../../config/db');
const Logger = require('../../core/utils/logger');
const {
  STOP_WORDS,
  PRODUCT_KEYWORDS,
  normalizeForMatch,
  isStopWord,
} = require('./chatbot.patterns');

const SYNONYMS = {
  عصير: ['عصير', 'عصائر', 'عصاير', 'juice'],
  مشروب: ['مشروب', 'مشروبات', 'غازي', 'كولا'],
  بيتزا: ['بيتزا', 'بيتز', 'pizza'],
  برجر: ['برجر', 'burger', 'همبرجر', 'هامبرجر'],
  فراخ: ['فراخ', 'فرخ', 'دجاج', 'chicken'],
  ساندويتش: ['ساندويتش', 'ساندوتش', 'شاورما'],
  حلويات: ['حلويات', 'حلو', 'حلوى', 'كنافة'],
  منيو: ['منيو', 'قائمة', 'menu'],
  ليمون: ['ليمون'],
  برتقال: ['برتقال'],
  تفاح: ['تفاح'],
  مانجو: ['مانجو', 'منجو'],
};

class MenuSearchService {
  static normalizeArabic(text) {
    return normalizeForMatch(text);
  }

  static expandSearchTerms(userMessage) {
    return this.extractProductSearchTerms(userMessage);
  }

  static extractProductSearchTerms(userMessage) {
    const normalized = this.normalizeArabic(userMessage);
    const terms = new Set();
    const asksJuice = /(?:^|\s)(?:ال)?عصير|عصائر|عصاير|juice/.test(normalized);
    const asksDrinks = /(?:^|\s)(?:ال)?مشروب|مشروبات|غازي|كولا/.test(normalized);

    for (const [key, words] of Object.entries(SYNONYMS)) {
      if (asksJuice && key === 'مشروب') continue;
      if (!asksDrinks && key === 'مشروب' && asksJuice) continue;

      const keyNorm = this.normalizeArabic(key);
      const matched = normalized.includes(keyNorm)
        || words.some((w) => normalized.includes(this.normalizeArabic(w)));

      if (matched) {
        words.forEach((w) => terms.add(this.normalizeArabic(w)));
        terms.add(keyNorm);
      }
    }

    PRODUCT_KEYWORDS.forEach((kw) => {
      const k = this.normalizeArabic(kw);
      if (asksJuice && (k === 'مشروب' || k === 'مشروبات')) return;
      if (k.length >= 2 && normalized.includes(k)) {
        terms.add(k);
      }
    });

    normalized.split(' ').forEach((word) => {
      if (word.length >= 3 && !isStopWord(word)) {
        terms.add(word);
      }
    });

    return [...terms]
      .filter((t) => t && t.length >= 2 && !STOP_WORDS.has(t))
      .slice(0, 8);
  }

  static isJuiceQuery(normalizedText) {
    const n = normalizedText || '';
    return /(?:^|\s)(?:ال)?عصير|عصائر|عصاير|العصير|juice/.test(n)
      && !/(?:^|\s)(?:ال)?مشروبات(?!\s*غاز)/.test(n);
  }

  static isJuiceSpecificQuery(normalizedText) {
    return this.isJuiceQuery(normalizedText);
  }

  static isSodaProduct(product) {
    const blob = this.normalizeArabic(`${product.Product_Name} ${product.Description || ''}`);
    return /غازي|كولا|سبيرو|spiro|soda|soft drink|فوار/.test(blob);
  }

  static isJuiceProduct(product) {
    const blob = this.normalizeArabic(`${product.Product_Name} ${product.Category || ''} ${product.Description || ''}`);
    return /عصير|juice|طازج|fresh juice/.test(blob) && !this.isSodaProduct(product);
  }

  static async searchJuiceProducts() {
    try {
      const [rows] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity, Image
         FROM Products
         WHERE Quantity > 0
           AND (Product_Name LIKE '%عصير%' OR Description LIKE '%عصير%' OR Category LIKE '%عصير%')
         ORDER BY Price ASC`
      );
      return (rows || []).filter((p) => this.isJuiceProduct(p));
    } catch (error) {
      Logger.error('[MenuSearch] searchJuiceProducts error:', error);
      return [];
    }
  }

  static async searchBeveragesInMenu() {
    try {
      const [rows] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity, Image
         FROM Products
         WHERE Quantity > 0
           AND (Category LIKE '%مشرو%' OR Product_Name LIKE '%مشرو%' OR Description LIKE '%مشرو%')
         ORDER BY Price ASC`
      );
      return rows || [];
    } catch (error) {
      Logger.error('[MenuSearch] searchBeveragesInMenu error:', error);
      return [];
    }
  }

  static async getJuiceFilterResults() {
    const juice = await this.searchJuiceProducts();
    if (juice.length > 0) {
      return { rows: juice, notice: null, emptyMessage: null };
    }

    const beverages = await this.searchBeveragesInMenu();
    if (beverages.length > 0) {
      return {
        rows: beverages,
        notice: 'لا يوجد عصير طبيعي في المنيو حالياً. هذه المشروبات المتاحة:',
        emptyMessage: null,
      };
    }

    return {
      rows: [],
      notice: null,
      emptyMessage: 'لا يوجد عصير ولا مشروبات متاحة في المنيو حالياً.',
    };
  }

  static refineSearchResults(userMessage, rows) {
    if (!rows || rows.length === 0) return rows;

    const n = this.normalizeArabic(userMessage);

    if (this.isJuiceSpecificQuery(n)) {
      const juiceOnly = rows.filter((p) => {
        const blob = this.normalizeArabic(`${p.Product_Name} ${p.Category} ${p.Description}`);
        const isJuice = /عصير|juice/.test(blob);
        const isSoda = /غازي|كولا|سبيرو|spiro|soda|soft drink/.test(blob);
        return isJuice && !isSoda;
      });

      if (juiceOnly.length > 0) return juiceOnly;

      return rows.filter((p) => this.normalizeArabic(p.Product_Name).includes('عصير'));
    }

    return rows;
  }

  static isGreetingOnly(message) {
    const n = this.normalizeArabic(message);
    return /^(السلام|سلام|مرحب|اهلا|أهلا|هاي|hi|hello|صباح|مساء|شكر|thanks)[\s!؟?]*$/i.test(n)
      || /^(السلام عليكم|مرحبا|أهلا وسهلا)[\s!؟?]*$/i.test(n);
  }

  static async searchAvailable(userMessage) {
    const normalized = this.normalizeArabic(userMessage);

    if (this.isJuiceQuery(normalized)) {
      const juiceResult = await this.getJuiceFilterResults();
      Logger.info(`[MenuSearch] juice query="${userMessage.substring(0, 80)}" hits=${juiceResult.rows.length} fallback=${!!juiceResult.notice}`);
      return juiceResult;
    }

    const terms = this.extractProductSearchTerms(userMessage);

    if (terms.length === 0) {
      return { rows: [], notice: null, emptyMessage: 'مفيش نتائج مطابقة' };
    }

    try {
      const conditions = terms.map(() =>
        '(Product_Name LIKE ? OR Category LIKE ? OR Description LIKE ?)'
      ).join(' OR ');
      const params = terms.flatMap((t) => {
        const pattern = `%${t}%`;
        return [pattern, pattern, pattern];
      });

      const [rows] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity, Image
         FROM Products
         WHERE Quantity > 0 AND (${conditions})
         ORDER BY Category, Price ASC`,
        params
      );

      const refined = this.refineSearchResults(userMessage, rows || []);
      Logger.info(`[MenuSearch] query="${userMessage.substring(0, 80)}" terms=[${terms.join(',')}] hits=${refined.length}`);
      return { rows: refined, notice: null, emptyMessage: 'مفيش نتائج مطابقة' };
    } catch (error) {
      Logger.error('[MenuSearch] searchAvailable error:', error);
      return { rows: [], notice: null, emptyMessage: 'مفيش نتائج مطابقة' };
    }
  }

  static async getAllAvailableProducts() {
    try {
      const [rows] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity, Image
         FROM Products
         WHERE Quantity > 0
         ORDER BY Category, Price ASC`
      );
      return rows || [];
    } catch (error) {
      Logger.error('[MenuSearch] getAllAvailableProducts error:', error);
      return [];
    }
  }

  static async getMostExpensiveProducts(limit = 3) {
    try {
      const [rows] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity, Image
         FROM Products
         WHERE Quantity > 0
         ORDER BY Price DESC
         LIMIT ?`,
        [limit]
      );
      return rows || [];
    } catch (error) {
      Logger.error('[MenuSearch] getMostExpensiveProducts error:', error);
      return [];
    }
  }

  static extractCompareTargets(message) {
    const n = this.normalizeArabic(message);

    const patterns = [
      /(?:قارن|مقارنه|مقارنة)\s+(?:بين\s+)?(.+?)\s+(?:و|مع)\s+(.+?)$/,
      /(?:الفرق|ايه الفرق|ما الفرق|فرق)\s+(?:بين\s+)?(.+?)\s+(?:و|مع)\s+(.+?)$/,
      /بين\s+(.+?)\s+و\s+(.+?)$/,
    ];

    for (const pattern of patterns) {
      const match = n.match(pattern);
      if (match) {
        return [match[1].trim(), match[2].trim()];
      }
    }

    return [];
  }

  static async findProductByTerm(term) {
    if (!term) return null;

    const result = await this.searchAvailable(term);
    const rows = result.rows || result;
    return rows.length > 0 ? rows[0] : null;
  }

  static async findProductsForCompare(message) {
    const targets = this.extractCompareTargets(message);

    if (targets.length >= 2) {
      const [first, second] = await Promise.all([
        this.findProductByTerm(targets[0]),
        this.findProductByTerm(targets[1]),
      ]);
      return { first, second, targets };
    }

    const result = await this.searchAvailable(message);
    const hits = result.rows || result;
    return {
      first: hits[0] || null,
      second: hits[1] || null,
      targets: [],
    };
  }

  static async getCheapestProducts(limit = 5) {
    try {
      const [rows] = await db.query(
        `SELECT Product_ID, Product_Name, Price, Category, Description, Quantity, Image
         FROM Products
         WHERE Quantity > 0
         ORDER BY Price ASC
         LIMIT ?`,
        [limit]
      );
      return rows || [];
    } catch (error) {
      Logger.error('[MenuSearch] getCheapestProducts error:', error);
      return [];
    }
  }

  static async getRelevantMenuForAdvisory(message) {
    const n = this.normalizeArabic(message);

    if (this.isJuiceQuery(n) || /عصير|العصير/.test(n)) {
      const juice = await this.searchJuiceProducts();
      if (juice.length > 0) return juice;

      const beverages = await this.searchBeveragesInMenu();
      if (beverages.length > 0) return beverages;
    }

    const result = await this.searchAvailable(message);
    const hits = result.rows || [];
    if (hits.length > 0) {
      return hits.slice(0, 12);
    }

    const all = await this.getAllAvailableProducts();
    return all.slice(0, 15);
  }
}

module.exports = MenuSearchService;
