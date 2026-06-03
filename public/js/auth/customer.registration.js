
const buttonLogin = document.querySelector(".button-id-1");
const buttonRegister = document.querySelector(".button-id-2");
const cardLogin = document.querySelector(".main-containers-1");
const cartRegister = document.querySelector(".main-containers-2");
buttonLogin.addEventListener('click', () => {
    cardLogin.classList.add('ach');
    cartRegister.classList.remove('ach');
});
buttonRegister.addEventListener('click', () => {
     cardLogin.classList.remove('ach');
    cartRegister.classList.add('ach');   
});


async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('register-msg');
  const btn = form.querySelector('button[type="submit"]');

  msg.style.display = 'none';
  if (btn) { btn.disabled = true; btn.textContent = 'جاري التسجيل...'; }

  try {
    const res = await fetch(form.action || '/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    const data = await res.json();

    if (data.success || res.ok) {
      msg.style.display = 'block';
      msg.style.background = '#EAF3DE';
      msg.style.color = '#3B6D11';
      msg.style.border = '1px solid #c3e6a0';
      msg.textContent = data.message || 'تم إنشاء الحساب بنجاح!';
      setTimeout(() => {
        window.location.href = data.redirect || '/';
      }, 1500);
    } else {
      msg.style.display = 'block';
      msg.style.background = '#FCEBEB';
      msg.style.color = '#A32D2D';
      msg.style.border = '1px solid #f5b8b8';
      msg.textContent = data.error || data.message || 'حدث خطأ، حاول مرة أخرى';
      if (btn) { btn.disabled = false; btn.textContent = 'تسجيل'; }
    }
  } catch (err) {
    msg.style.display = 'block';
    msg.style.background = '#FCEBEB';
    msg.style.color = '#A32D2D';
    msg.style.border = '1px solid #f5b8b8';
    msg.textContent = 'خطأ في الاتصال، تأكد من الإنترنت وحاول مرة أخرى';
    if (btn) { btn.disabled = false; btn.textContent = 'تسجيل'; }
  }
}

// Handle Customer Login with Fetch (prevent page reload and display messages)
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('button[type="submit"]');
  const email = form.querySelector('input[name="email"]').value;
  const password = form.querySelector('input[name="password"]').value;

  if (!email || !password) {
    alert('البريد الإلكتروني وكلمة المرور مطلوبان');
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = 'جاري التسجيل...'; }

  try {
    const res = await fetch('/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember: form.querySelector('input[name="remember"]')?.checked || false })
    });

    const data = await res.json();

    if (data.success) {
      // Show success message
      alert(data.message || 'تم تسجيل الدخول بنجاح');
      window.location.href = data.redirect || '/';
    } else {
      // Show error message
      alert(data.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      if (btn) { btn.disabled = false; btn.textContent = 'تسجيل الدخول'; }
    }
  } catch (err) {
    console.error('[Login] Error:', err);
    alert('خطأ في الاتصال بالخادم، حاول مرة أخرى');
    if (btn) { btn.disabled = false; btn.textContent = 'تسجيل الدخول'; }
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('register-msg');
  const btn = form.querySelector('button[type="submit"]');

  msg.style.display = 'none';
  if (btn) { btn.disabled = true; btn.textContent = 'جاري التسجيل...'; }

  try {
    const res = await fetch(form.action || '/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });

    const data = await res.json();

    if (data.success || res.ok) {
      msg.style.display = 'block';
      msg.style.background = '#EAF3DE';
      msg.style.color = '#3B6D11';
      msg.style.border = '1px solid #c3e6a0';
      msg.textContent = data.message || 'تم إنشاء الحساب بنجاح!';
      setTimeout(() => {
        window.location.href = data.redirect || '/';
      }, 1500);
    } else {
      msg.style.display = 'block';
      msg.style.background = '#FCEBEB';
      msg.style.color = '#A32D2D';
      msg.style.border = '1px solid #f5b8b8';
      msg.textContent = data.error || data.message || 'حدث خطأ، حاول مرة أخرى';
      if (btn) { btn.disabled = false; btn.textContent = 'تسجيل'; }
    }
  } catch (err) {
    msg.style.display = 'block';
    msg.style.background = '#FCEBEB';
    msg.style.color = '#A32D2D';
    msg.style.border = '1px solid #f5b8b8';
    msg.textContent = 'خطأ في الاتصال، تأكد من الإنترنت وحاول مرة أخرى';
    if (btn) { btn.disabled = false; btn.textContent = 'تسجيل'; }
  }
}