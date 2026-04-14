/**
 * نظام إدارة حالة السلة العام
 * مصدر موحد للبيانات - جميع عمليات السلة تمر من هنا
 * يستخدم localStorage مع نمط المراقب (Observer Pattern) للتفاعل الفوري
 */

(function() {
  'use strict';

  // متغيرات تخزين السلة
  const CART_STORAGE_KEY = 'cart';
  const CART_UI_STATE_KEY = 'cartUIState';

  // قائمة المراقبين للتحديثات
  const observers = {
    items: [],
    ui: []
  };

  /**
   * واجهة برمجية للسلة - جميع العمليات تمر من هنا
   */
  window.cartState = {
    /**
     * تهيئة السلة من التخزين المحلي
     */
    init() {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      }
      const savedUIState = localStorage.getItem(CART_UI_STATE_KEY);
      if (!savedUIState) {
        localStorage.setItem(CART_UI_STATE_KEY, JSON.stringify({ isOpen: false }));
      }
    },

    /**
     * الحصول على جميع عناصر السلة
     */
    getItems() {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    },

    /**
     * الحصول على عنصر واحد من السلة بواسطة المعرّف
     */
    getItemById(productId) {
      return this.getItems().find(item => item.id === productId);
    },

    /**
     * إضافة عنصر إلى السلة أو زيادة الكمية إذا كان موجوداً
     */
    addItem(product) {
      if (!product || !product.id) {
        console.error('Invalid product:', product);
        return null;
      }

      const items = this.getItems();
      const existingItem = items.find(item => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += product.quantity || 1;
      } else {
        items.push({
          id: product.id,
          title: product.title || product.Product_Name,
          price: product.price || product.Price,
          img: product.img || (product.Image ? `images/products/${product.Image}` : ''),
          quantity: product.quantity || 1
        });
      }

      this.saveItems(items);
      return items;
    },

    /**
     * تحديث كمية العنصر في السلة
     */
    updateQuantity(productId, quantity) {
      if (quantity < 1) return false;

      const items = this.getItems();
      const item = items.find(item => item.id === productId);

      if (!item) return false;

      item.quantity = quantity;
      this.saveItems(items);
      return true;
    },

    /**
     * زيادة كمية العنصر بمقدار واحد
     */
    increaseQuantity(productId) {
      const item = this.getItemById(productId);
      if (!item) return false;
      return this.updateQuantity(productId, item.quantity + 1);
    },

    /**
     * تقليل كمية العنصر بمقدار واحد
     */
    decreaseQuantity(productId) {
      const item = this.getItemById(productId);
      if (!item) return false;
      if (item.quantity <= 1) {
        return this.removeItem(productId);
      }
      return this.updateQuantity(productId, item.quantity - 1);
    },

    /**
     * إزالة عنصر من السلة
     */
    removeItem(productId) {
      const items = this.getItems();
      const index = items.findIndex(item => item.id === productId);

      if (index === -1) return false;

      items.splice(index, 1);
      this.saveItems(items);
      return true;
    },

    /**
     * تفريغ السلة بالكامل
     */
    clear() {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      this.notifyObservers('items', []);
    },

    /**
     * حساب إجمالي السلة وعدد العناصر والكمية الإجمالية
     */
    getTotals() {
      const items = this.getItems();
      return {
        subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        itemCount: items.length
      };
    },

    /**
     * حفظ العناصر في التخزين المحلي وإخطار المراقبين
     */
    saveItems(items) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      this.notifyObservers('items', items);
    },

    /**
     * إدارة حالة واجهة السلة - التحقق من حالة الفتح
     */
    isOpen() {
      const state = localStorage.getItem(CART_UI_STATE_KEY);
      return state ? JSON.parse(state).isOpen : false;
    },

    /**
     * فتح درج السلة
     */
    open() {
      const state = { isOpen: true };
      localStorage.setItem(CART_UI_STATE_KEY, JSON.stringify(state));
      this.notifyObservers('ui', state);
    },

    /**
     * إغلاق درج السلة
     */
    close() {
      const state = { isOpen: false };
      localStorage.setItem(CART_UI_STATE_KEY, JSON.stringify(state));
      this.notifyObservers('ui', state);
    },

    /**
     * تبديل حالة درج السلة (فتح/إغلاق)
     */
    toggle() {
      this.isOpen() ? this.close() : this.open();
    },

    /**
     * الاشتراك في تحديثات عناصر السلة
     */
    onItemsChange(callback) {
      if (typeof callback === 'function') {
        observers.items.push(callback);
      }
    },

    /**
     * الاشتراك في تحديثات حالة واجهة السلة
     */
    onUIChange(callback) {
      if (typeof callback === 'function') {
        observers.ui.push(callback);
      }
    },

    /**
     * إخطار جميع المراقبين بالتحديثات
     */
    notifyObservers(type, data) {
      const observerList = observers[type];
      if (Array.isArray(observerList)) {
        observerList.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in ${type} observer:`, error);
          }
        });
      }
    },

    /**
     * تصدير بيانات السلة للخادم
     */
    export() {
      return {
        items: this.getItems(),
        totals: this.getTotals(),
        uiState: { isOpen: this.isOpen() }
      };
    },

    /**
     * استيراد بيانات السلة من الخادم (مفيد لاستعادة البيانات)
     */
    import(data) {
      if (Array.isArray(data)) {
        this.saveItems(data);
      }
    }
  };

  // تهيئة السلة عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.cartState.init();
    });
  } else {
    window.cartState.init();
  }
})();
