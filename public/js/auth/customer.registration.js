(function () {
  'use strict';

  function getNextParam() {
    try {
      return new URLSearchParams(window.location.search).get('next') || '';
    } catch (_) {
      return '';
    }
  }

  function showLoginMessage(text, isError) {
    let el = document.getElementById('login-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'login-msg';
      el.style.cssText =
        'display:none;margin-top:12px;padding:10px 14px;border-radius:8px;font-size:14px;text-align:center;';
      const form = document.getElementById('loginForm');
      if (form) form.appendChild(el);
    }
    el.style.display = 'block';
    if (isError) {
      el.style.background = '#FCEBEB';
      el.style.color = '#A32D2D';
      el.style.border = '1px solid #f5b8b8';
    } else {
      el.style.background = '#EAF3DE';
      el.style.color = '#3B6D11';
      el.style.border = '1px solid #c3e6a0';
    }
    el.textContent = text;
  }

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    const form = document.getElementById('loginForm');
    if (!form) return false;

    const emailInput = form.querySelector('[name="email"]');
    const passwordInput = form.querySelector('[name="password"]');
    const btn = form.querySelector('button[type="submit"]');
    const email = emailInput?.value?.trim() || '';
    const password = passwordInput?.value || '';

    if (!email || !password) {
      showLoginMessage('البريد الإلكتروني وكلمة المرور مطلوبان', true);
      return false;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جاري تسجيل الدخول...';
    }

    const payload = {
      email,
      password,
      remember: !!form.querySelector('[name="remember"]')?.checked
    };
    const next = getNextParam();
    if (next) payload.next = next;

    try {
      const res = await fetch('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        data = { success: false, message: 'رد غير متوقع من الخادم' };
      }

      if (data.success) {
        showLoginMessage(data.message || 'تم تسجيل الدخول بنجاح', false);
        const target = data.redirect || (next ? decodeURIComponent(next) : '/');
        window.location.replace(target);
      } else {
        showLoginMessage(data.message || data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة', true);
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'تسجيل الدخول';
        }
      }
    } catch (err) {
      console.error('[customer login]', err);
      showLoginMessage('خطأ في الاتصال بالخادم، حاول مرة أخرى', true);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'تسجيل الدخول';
      }
    }

    return false;
  }

  async function handleRegister(e) {
    if (e && e.preventDefault) e.preventDefault();

    const form = e?.target || document.querySelector('.myform');
    const msg = document.getElementById('register-msg');
    const btn = form?.querySelector('button[type="submit"]');

    if (!form || !msg) return false;

    msg.style.display = 'none';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'جاري التسجيل...';
    }

    const body = Object.fromEntries(new FormData(form));
    const next = getNextParam();
    if (next) body.next = next;

    try {
      const res = await fetch(form.action || '/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.success || res.ok) {
        msg.style.display = 'block';
        msg.style.background = '#EAF3DE';
        msg.style.color = '#3B6D11';
        msg.style.border = '1px solid #c3e6a0';
        msg.textContent = data.message || 'تم إنشاء الحساب بنجاح!';
        setTimeout(() => {
          window.location.replace(data.redirect || (next ? decodeURIComponent(next) : '/'));
        }, 1500);
      } else {
        msg.style.display = 'block';
        msg.style.background = '#FCEBEB';
        msg.style.color = '#A32D2D';
        msg.style.border = '1px solid #f5b8b8';
        msg.textContent = data.error || data.message || 'حدث خطأ، حاول مرة أخرى';
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'تسجيل حساب جديد';
        }
      }
    } catch (err) {
      msg.style.display = 'block';
      msg.style.background = '#FCEBEB';
      msg.style.color = '#A32D2D';
      msg.style.border = '1px solid #f5b8b8';
      msg.textContent = 'خطأ في الاتصال، تأكد من الإنترنت وحاول مرة أخرى';
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'تسجيل حساب جديد';
      }
    }

    return false;
  }

  window.handleLogin = handleLogin;
  window.handleRegister = handleRegister;

  document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.setAttribute('method', 'post');
      loginForm.setAttribute('action', '/user/login');
      loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.querySelector('.myform');
    if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
    }

    const buttonLogin = document.querySelector('.button-id-1');
    const buttonRegister = document.querySelector('.button-id-2');
    const cardLogin = document.querySelector('.main-containers-1');
    const cartRegister = document.querySelector('.main-containers-2');

    if (buttonLogin && cardLogin && cartRegister) {
      buttonLogin.addEventListener('click', () => {
        cardLogin.classList.add('ach');
        cartRegister.classList.remove('ach');
      });
    }

    if (buttonRegister && cardLogin && cartRegister) {
      buttonRegister.addEventListener('click', () => {
        cardLogin.classList.remove('ach');
        cartRegister.classList.add('ach');
      });
    }

    // إزالة email/password من شريط العنوان إن وُجدت (GET قديم)
    const params = new URLSearchParams(window.location.search);
    if (params.has('email') || params.has('password')) {
      params.delete('email');
      params.delete('password');
      const qs = params.toString();
      const clean = window.location.pathname + (qs ? '?' + qs : '');
      window.history.replaceState({}, '', clean);
    }
  });
})();
