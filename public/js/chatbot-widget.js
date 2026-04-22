/**
 * مكون واجهة الدردشة الآلية - عنصر الواجهة الأمامية
 * واجهة دردشة عائمة متكاملة مع واجهة برمجية Gemini
 */

(function() {
  'use strict';

  class ChatbotWidget {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.isLoading = false;
      this.init();
    }

    /**
     * تهيئة مكون الدردشة الآلية
     */
    init() {
      this.createHTML();
      this.attachEventListeners();
      this.loadChatHistory();
    }

    /**
     * بناء هيكل HTML لمكون الدردشة الآلية
     */
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

            <!-- Input Area -->
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

      // Insert into DOM
      const container = document.body;
      const fragment = document.createElement('div');
      fragment.innerHTML = html;
      container.appendChild(fragment);
    }

    /**
     * إضافة مستمعي الأحداث - الفتح والإغلاق والإرسال
     */
    attachEventListeners() {
      const icon = document.getElementById('chatbot-icon');
      const closeBtn = document.getElementById('chatbot-close');
      const sendBtn = document.getElementById('chatbot-send');
      const input = document.getElementById('chatbot-input');

      // Toggle chat window
      icon.addEventListener('click', () => this.toggleWindow());
      closeBtn.addEventListener('click', () => this.closeWindow());

      // Send message on button click
      sendBtn.addEventListener('click', () => this.sendMessage());

      // Send message on Enter key
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    /**
     * تبديل ظهور/إخفاء نافذة الدردشة
     */
    toggleWindow() {
      this.isOpen ? this.closeWindow() : this.openWindow();
    }

    /**
     * فتح نافذة الدردشة والتركيز على حقل الإدخال
     */
    openWindow() {
      const window = document.getElementById('chatbot-window');
      window.classList.remove('hidden');
      this.isOpen = true;
      document.getElementById('chatbot-input').focus();
    }

    /**
     * إغلاق نافذة الدردشة وإخفاؤها
     */
    closeWindow() {
      const window = document.getElementById('chatbot-window');
      window.classList.add('hidden');
      this.isOpen = false;
    }

    /**
     * إرسال رسالة المستخدم والحصول على رد من الخادم
     */
    async sendMessage() {
      const input = document.getElementById('chatbot-input');
      const message = input.value.trim();

      if (!message) return;

      // Clear input
      input.value = '';

      // Add user message to display
      this.addMessage(message, 'user');

      // Show loading state
      this.showLoadingIndicator();

      try {
        // Send to backend API
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (data.success) {
          this.addMessage(data.message, 'bot');
        } else {
          this.addMessage(data.message || 'حدث خطأ. يرجى المحاولة لاحقاً.', 'bot');
        }
      } catch (error) {
        this.addMessage('عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.', 'bot');
      }

      // Hide loading
      this.hideLoadingIndicator();

      // Save chat history
      this.saveChatHistory();
    }

    /**
     * إضافة رسالة إلى شاشة الدردشة
     * @param {string} text - نص الرسالة
     * @param {string} sender - 'user' أو 'bot'
     */
    addMessage(text, sender = 'bot') {
      const messagesContainer = document.getElementById('chatbot-messages');

      const messageDiv = document.createElement('div');
      messageDiv.className = `chatbot-message ${sender}-message`;
      messageDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;

      messagesContainer.appendChild(messageDiv);

      // Store in memory
      this.messages.push({ text, sender, timestamp: new Date() });

      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * عرض مؤشر التحميل (نقطة تحميل)
     */
    showLoadingIndicator() {
      const messagesContainer = document.getElementById('chatbot-messages');
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'chatbot-loading';
      loadingDiv.className = 'chatbot-message bot-message loading';
      loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
      messagesContainer.appendChild(loadingDiv);
      this.isLoading = true;
    }

    /**
     * إخفاء مؤشر التحميل
     */
    hideLoadingIndicator() {
      const loading = document.getElementById('chatbot-loading');
      if (loading) {
        loading.remove();
      }
      this.isLoading = false;
    }

    /**
     * تنظيف HTML لمنع الهجمات (XSS Protection)
     * @param {string} text - النص المراد تنظيفه
     * @returns {string}
     */
    escapeHtml(text) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * حفظ سجل الدردشة في التخزين المحلي
     */
    saveChatHistory() {
      try {
        localStorage.setItem(
          'chatbot_history',
          JSON.stringify(this.messages.slice(-20)) // Keep last 20 messages
        );
      } catch (error) {
      }
    }

    /**
     * تحميل سجل الدردشة من التخزين المحلي
     */
    loadChatHistory() {
      try {
        const history = localStorage.getItem('chatbot_history');
        if (history) {
          this.messages = JSON.parse(history);
          // Restore messages to display
          const messagesContainer = document.getElementById('chatbot-messages');
          this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${msg.sender}-message`;
            messageDiv.innerHTML = `<p>${this.escapeHtml(msg.text)}</p>`;
            messagesContainer.appendChild(messageDiv);
          });
        }
      } catch (error) {
      }
    }
  }

  // التهيئة عند تحميل DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.chatbotWidget = new ChatbotWidget();
    });
  } else {
    window.chatbotWidget = new ChatbotWidget();
  }
})();

