/**
 * مكون واجهة الدردشة الآلية
 */

(function() {
  'use strict';

  const TEXT_RESPONSE_TYPES = ['PRICE', 'COMPARE', 'ADVISORY', 'TEXT'];
  const TABLE_RESPONSE_TYPES = ['LIST', 'FILTER', 'PRODUCTS'];

  class ChatbotWidget {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.isLoading = false;
      this.init();
    }

    init() {
      this.createHTML();
      this.attachEventListeners();
      this.loadChatHistory();
    }

    createHTML() {
      const html = `
        <div id="chatbot-widget" class="chatbot-widget">
          <button id="chatbot-icon" class="chatbot-icon" title="مساعد Foodna الذكي" aria-label="مساعد Foodna الذكي">
            <i class="fas fa-comments"></i>
          </button>

          <div id="chatbot-window" class="chatbot-window hidden">
            <div class="chatbot-header">
              <h3 class="chatbot-title">مساعد Foodna الذكي</h3>
              <button id="chatbot-close" class="chatbot-close" aria-label="إغلاق الدردشة">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div id="chatbot-messages" class="chatbot-messages">
              <div class="chatbot-message bot-message welcome-message">
                <p>مرحباً بك في مساعد فودنا الذكي! 👋</p>
                <p>كيف يمكنني مساعدتك اليوم؟ يمكنك أن تسأل عن:</p>
                <ul>
                  <li>أرخص المنتجات</li>
                  <li>المنتجات الشهيرة</li>
                  <li>منتجات معينة (مثل: بيتزا، دجاج)</li>
                  <li>منتجات بسعر معين</li>
                </ul>
              </div>
            </div>

            <div class="chatbot-input-area">
              <input
                type="text"
                id="chatbot-input"
                class="chatbot-input"
                placeholder="اكتب سؤالك هنا..."
                aria-label="حقل الإدخال للدردشة"
              >
              <button id="chatbot-send" class="chatbot-send" aria-label="إرسال">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      const fragment = document.createElement('div');
      fragment.innerHTML = html;
      document.body.appendChild(fragment);
    }

    attachEventListeners() {
      const icon = document.getElementById('chatbot-icon');
      const closeBtn = document.getElementById('chatbot-close');
      const sendBtn = document.getElementById('chatbot-send');
      const input = document.getElementById('chatbot-input');
      const messagesContainer = document.getElementById('chatbot-messages');

      icon.addEventListener('click', () => this.toggleWindow());
      closeBtn.addEventListener('click', () => this.closeWindow());
      sendBtn.addEventListener('click', () => this.sendMessage());
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      messagesContainer.addEventListener('click', (e) => {
        const orderBtn = e.target.closest('.btn-order');
        const detailsBtn = e.target.closest('.btn-details');

        if (orderBtn) {
          e.preventDefault();
          this.addProductToCart({
            id: orderBtn.dataset.id,
            name: orderBtn.dataset.name,
            price: orderBtn.dataset.price,
            img: orderBtn.dataset.img,
          });
        }

        if (detailsBtn) {
          e.preventDefault();
          this.requestProductDetails(detailsBtn.dataset.name);
        }
      });
    }

    toggleWindow() {
      this.isOpen ? this.closeWindow() : this.openWindow();
    }

    openWindow() {
      document.getElementById('chatbot-window').classList.remove('hidden');
      this.isOpen = true;
      document.getElementById('chatbot-input').focus();
    }

    closeWindow() {
      document.getElementById('chatbot-window').classList.add('hidden');
      this.isOpen = false;
    }

    async sendMessage(customMessage = null) {
      if (this.isLoading) return;

      const input = document.getElementById('chatbot-input');
      const message = (customMessage || input.value).trim();
      if (!message) return;

      if (!customMessage) {
        input.value = '';
      }

      this.addMessage(message, 'user');
      this.showLoadingIndicator();

      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          throw new Error('Invalid JSON response from chatbot API');
        }

        if (!response.ok) {
          throw new Error(data?.message || `خطأ في الخادم (${response.status})`);
        }

        if (data.success) {
          const structured = data.data?.structuredResponse;
          const displayText = data.message || '';
          this.addMessage(displayText, 'bot', structured);
        } else {
          this.addMessage(data.message || 'حدث خطأ. يرجى المحاولة لاحقاً.', 'bot');
        }
      } catch (error) {
        let errMsg = 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.';
        if (error.message && !error.message.includes('Invalid JSON')) {
          errMsg = error.message;
        }
        this.addMessage(errMsg, 'bot');
      }

      this.hideLoadingIndicator();
      this.saveChatHistory();
    }

    addMessage(text, sender = 'bot', structuredResponse = null) {
      const messagesContainer = document.getElementById('chatbot-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot-message ${sender}-message`;

      let html = '';

      if (sender === 'bot') {
        const parsedResponse = structuredResponse || this.tryParseJson(text);
        if (parsedResponse) {
          html = this.renderStructuredBotMessage(parsedResponse);
          if (this.isTableResponse(parsedResponse)) {
            messageDiv.classList.add('has-table');
          }
        } else if (text && String(text).trim()) {
          html = this.renderTextBlock(text);
        }
      } else {
        html = `<p>${this.escapeHtml(text)}</p>`;
      }

      messageDiv.innerHTML = html;
      messagesContainer.appendChild(messageDiv);
      this.messages.push({ text, sender, timestamp: new Date(), structuredResponse });
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    renderStructuredBotMessage(response) {
      const normalized = this.normalizeStructuredResponse(response);
      if (!normalized || typeof normalized !== 'object') {
        return this.renderTextBlock(String(response));
      }

      const type = String(normalized.type || '').toUpperCase();

      if (type === 'FILTER' && (!normalized.items || normalized.items.length === 0)) {
        return this.renderTextBlock(normalized.message || 'مفيش نتائج مطابقة');
      }

      if (TABLE_RESPONSE_TYPES.includes(type) && Array.isArray(normalized.items) && normalized.items.length > 0) {
        let html = '';
        if (normalized.message && String(normalized.message).trim()) {
          html += this.renderTextBlock(normalized.message, type === 'FILTER' ? 'filter' : null);
        }
        html += this.renderProductsTable(normalized.items);
        return html;
      }

      if (TEXT_RESPONSE_TYPES.includes(type) && typeof normalized.message === 'string') {
        return this.renderTextBlock(normalized.message, type);
      }

      if (Array.isArray(normalized.items) && normalized.items.length > 0) {
        return this.renderProductsTable(normalized.items);
      }

      if (typeof normalized.message === 'string' && normalized.message.trim()) {
        return this.renderTextBlock(normalized.message);
      }

      return this.renderTextBlock('عذراً، لم أتمكن من عرض الرد.');
    }

    renderTextBlock(text, type) {
      const content = this.formatMultilineText(text);
      const typeClass = type ? ` chatbot-text-${type.toLowerCase()}` : '';
      return `<div class="chatbot-text-response${typeClass}">${content}</div>`;
    }

    renderProductsTable(items) {
      let html = '<div class="chatbot-table-wrap"><table class="chatbot-products-table">';
      html += '<thead><tr><th>المنتج</th><th>السعر</th><th>الوصف</th><th>الإجراءات</th></tr></thead><tbody>';

      items.forEach((item, index) => {
        const productName = item.name || `منتج ${index + 1}`;
        const productId = item.id != null ? item.id : '';
        const productDesc = item.desc || '';
        const productPrice = item.price != null ? item.price : '';
        const productImg = this.buildProductImageSrc(item.img);

        html += '<tr>';
        html += `<td>${this.escapeHtml(productName)}</td>`;
        html += `<td>${this.escapeHtml(String(productPrice))} جنيه</td>`;
        html += `<td>${this.escapeHtml(productDesc)}</td>`;
        html += '<td class="action-buttons">';
        html += `<button type="button" class="btn-order" data-id="${this.escapeAttr(productId)}" data-name="${this.escapeAttr(productName)}" data-price="${this.escapeAttr(productPrice)}" data-img="${this.escapeAttr(productImg)}">اطلب الآن</button>`;
        html += `<button type="button" class="btn-details" data-name="${this.escapeAttr(productName)}">التفاصيل</button>`;
        html += '</td></tr>';
      });

      html += '</tbody></table></div>';
      return html;
    }

    isTableResponse(response) {
      const normalized = this.normalizeStructuredResponse(response);
      if (!normalized) return false;
      const type = String(normalized.type || '').toUpperCase();
      if (type === 'FILTER' && (!normalized.items || normalized.items.length === 0)) return false;
      return TABLE_RESPONSE_TYPES.includes(type) || (Array.isArray(normalized.items) && normalized.items.length > 0);
    }

    normalizeStructuredResponse(response) {
      if (!response || typeof response !== 'object') return response;

      const normalized = {};
      const keyMap = {
        type: 'type', Type: 'type', TYPE: 'type',
        items: 'items', Items: 'items', ITEMS: 'items',
        message: 'message', Message: 'message', MESSAGE: 'message',
      };

      Object.entries(response).forEach(([key, value]) => {
        const mappedKey = keyMap[key] || key.toLowerCase();
        if (mappedKey === 'items' && Array.isArray(value)) {
          normalized.items = value.map((item) => this.normalizeStructuredItem(item));
        } else {
          normalized[mappedKey] = value;
        }
      });

      if (normalized.type) {
        normalized.type = String(normalized.type).toUpperCase();
        if (normalized.type === 'PRODUCTS') normalized.type = 'LIST';
        if (normalized.type === 'TEXT') normalized.type = 'ADVISORY';
      }

      return normalized;
    }

    normalizeStructuredItem(item) {
      if (!item || typeof item !== 'object') return item;

      const normalized = {};
      const keyMap = {
        id: 'id', Id: 'id', ID: 'id',
        name: 'name', Name: 'name', NAME: 'name',
        price: 'price', Price: 'price', PRICE: 'price',
        desc: 'desc', Desc: 'desc', DESC: 'desc',
        description: 'desc', Description: 'desc', DESCRIPTION: 'desc',
        img: 'img', Img: 'img', image: 'img', Image: 'img',
      };

      Object.entries(item).forEach(([key, value]) => {
        const mappedKey = keyMap[key] || key.toLowerCase();
        normalized[mappedKey] = value;
      });

      return normalized;
    }

    addProductToCart({ id, name, price, img }) {
      const productId = Number(id);
      if (!productId) {
        this.showToast('تعذر إضافة المنتج للسلة', 'error');
        return;
      }

      const cartProduct = {
        id: productId,
        title: name,
        price: Number(price) || 0,
        img: img || '/images/placeholder.png',
        quantity: 1,
      };

      if (window.cartState && typeof window.cartState.addItem === 'function') {
        window.cartState.addItem(cartProduct);
        if (typeof window.cartState.open === 'function') {
          window.cartState.open();
        }
      } else {
        try {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const existing = cart.find((item) => Number(item.id) === productId);
          if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
          } else {
            cart.push(cartProduct);
          }
          localStorage.setItem('cart', JSON.stringify(cart));
          document.querySelector('.cart')?.classList.add('active');
        } catch (e) {
          this.showToast('تعذر إضافة المنتج للسلة', 'error');
          return;
        }
      }

      if (typeof updetecart === 'function') {
        updetecart();
      }

      this.showToast(`تم إضافة «${name}» للسلة`);
    }

    requestProductDetails(productName) {
      if (!productName) return;
      this.sendMessage(`أخبرني المزيد عن ${productName}`);
    }

    showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `chatbot-toast chatbot-toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('visible'));
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 2800);
    }

    buildProductImageSrc(image) {
      if (!image) return '/images/placeholder.png';
      if (/^(https?:)?\/\//.test(image)) return image;
      return `/images/products/${image}`;
    }

    formatMultilineText(text) {
      return this.escapeHtml(String(text || '')).replace(/\n/g, '<br>');
    }

    tryParseJson(text) {
      if (typeof text !== 'string') return null;
      const trimmed = text.trim();
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        // continue
      }
      const objectMatch = trimmed.match(/(\{[\s\S]*\})/m);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[1]);
        } catch (error) {
          // ignore
        }
      }
      return null;
    }

    escapeHtml(text) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return String(text ?? '').replace(/[&<>"']/g, (m) => map[m]);
    }

    escapeAttr(text) {
      return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    showLoadingIndicator() {
      const messagesContainer = document.getElementById('chatbot-messages');
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'chatbot-loading';
      loadingDiv.className = 'chatbot-message bot-message loading';
      loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
      messagesContainer.appendChild(loadingDiv);
      this.isLoading = true;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideLoadingIndicator() {
      document.getElementById('chatbot-loading')?.remove();
      this.isLoading = false;
    }

    saveChatHistory() {
      try {
        localStorage.setItem('chatbot_history', JSON.stringify(this.messages.slice(-20)));
      } catch (error) {
        // ignore
      }
    }

    loadChatHistory() {
      try {
        const history = localStorage.getItem('chatbot_history');
        if (!history) return;

        this.messages = JSON.parse(history);
        const messagesContainer = document.getElementById('chatbot-messages');

        this.messages.forEach((msg) => {
          const messageDiv = document.createElement('div');
          messageDiv.className = `chatbot-message ${msg.sender}-message`;

          if (msg.sender === 'bot') {
            const parsedResponse = msg.structuredResponse || this.tryParseJson(msg.text);
            if (parsedResponse) {
              messageDiv.innerHTML = this.renderStructuredBotMessage(parsedResponse);
              if (this.isTableResponse(parsedResponse)) {
                messageDiv.classList.add('has-table');
              }
            } else if (msg.text && String(msg.text).trim()) {
              messageDiv.innerHTML = this.renderTextBlock(msg.text);
            }
          } else {
            messageDiv.innerHTML = `<p>${this.escapeHtml(msg.text)}</p>`;
          }

          messagesContainer.appendChild(messageDiv);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } catch (error) {
        // ignore
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.chatbotWidget = new ChatbotWidget();
    });
  } else {
    window.chatbotWidget = new ChatbotWidget();
  }
})();
