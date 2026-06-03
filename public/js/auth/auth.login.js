(function () {
  'use strict';

  const validationRules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'البريد الإلكتروني غير صحيح'
    },
    password: {
      required: true,
      minLength: 6,
      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    }
  };

  function clearError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    if (!field || !errorElement) return;
    field.classList.remove('error');
    errorElement.classList.remove('show');
    errorElement.textContent = '';
  }

  function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    if (!field || !errorElement) return;
    field.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }

  function validateField(fieldName, value) {
    const rules = validationRules[fieldName];
    if (!rules) return true;

    if (rules.required && !value.trim()) {
      showFieldError(
        fieldName,
        fieldName === 'email' ? 'البريد الإلكتروني مطلوب' : 'كلمة المرور مطلوبة'
      );
      return false;
    }

    if (fieldName === 'email' && value && !rules.pattern.test(value)) {
      showFieldError(fieldName, rules.message);
      return false;
    }

    if (fieldName === 'password' && value && value.length < rules.minLength) {
      showFieldError(fieldName, rules.message);
      return false;
    }

    clearError(fieldName);
    return true;
  }

  function validateForm() {
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    let isValid = true;
    if (!validateField('email', email)) isValid = false;
    if (!validateField('password', password)) isValid = false;
    return isValid;
  }

  function resolveRedirectUrl(data) {
    const urlParams = new URLSearchParams(window.location.search);
    const nextParam = urlParams.get('next');
    if (nextParam) {
      try {
        const decoded = decodeURIComponent(nextParam);
        if (
          decoded &&
          decoded.startsWith('/') &&
          !decoded.startsWith('/auth/login') &&
          decoded !== '/login'
        ) {
          return decoded;
        }
      } catch (_) {
        /* ignore */
      }
    }
    return data.redirect || '/';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');
    const form = document.getElementById('loginForm');

    if (!form) return;

    if (emailInput) emailInput.addEventListener('input', () => clearError('email'));
    if (passInput) passInput.addEventListener('input', () => clearError('password'));

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      clearError('email');
      clearError('password');

      if (!validateForm()) {
        if (typeof showError === 'function') {
          showError('يرجى تصحيح الأخطاء في النموذج', 'خطأ في التحقق');
        }
        return false;
      }

      const formData = new URLSearchParams();
      formData.append('email', document.getElementById('email').value);
      formData.append('password', document.getElementById('password').value);

      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next) formData.append('next', next);

      if (typeof showLoading === 'function') {
        showLoading('جاري تسجيل الدخول...');
      }

      try {
        const response = await fetch('/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        let data = null;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (_) {
            data = { success: false, message: text || 'فشل تسجيل الدخول' };
          }
        }

        if (typeof closeSwal === 'function') {
          closeSwal();
        }

        if (data && data.success) {
          const redirectTo = resolveRedirectUrl(data);

          if (typeof showSuccess === 'function') {
            showSuccess(data.message || 'تم تسجيل الدخول بنجاح', 'نجح', 1);
          }

          setTimeout(() => {
            window.location.replace(redirectTo);
          }, 400);
        } else {
          const msg = (data && data.message) ? data.message : 'فشل تسجيل الدخول';
          if (typeof showError === 'function') {
            showError(msg, 'خطأ في تسجيل الدخول');
          } else {
            alert(msg);
          }
        }
      } catch (error) {
        if (typeof closeSwal === 'function') {
          closeSwal();
        }
        if (typeof showError === 'function') {
          showError('حدث خطأ في الاتصال بالخادم', 'خطأ في الاتصال');
        } else {
          alert('حدث خطأ في الاتصال بالخادم');
        }
        console.error('Login error:', error);
      }

      return false;
    });
  });
})();
