const buttonLogin = document.querySelector(".button-id-1");
const buttonRegister = document.querySelector(".button-id-2");
const cardLogin = document.querySelector(".main-containers-1");
const cartRegister = document.querySelector(".main-containers-2");

/**
 * دالة لعرض رسائل الخطأ بشكل منسق
 */
function showErrorMessage(message) {
  const modal = document.getElementById('errorModal');
  const modalMessage = document.getElementById('modalMessage');
  if (modal && modalMessage) {
    modalMessage.textContent = message;
    modal.style.display = 'block';
    
    // إغلاق الرسالة بعد 4 ثواني
    setTimeout(() => {
      modal.style.display = 'none';
    }, 4000);
  }
}

/**
 * دالة للتحقق من قوة كلمة المرور - بسيطة الآن (4 أحرف على الأقل)
 */
function validatePassword(password) {
  return password && password.length >= 4;
}

buttonLogin.addEventListener('click', () => {
  cardLogin.classList.add('ach');
  cartRegister.classList.remove('ach');
});

buttonRegister.addEventListener('click', () => {
  cardLogin.classList.remove('ach');
  cartRegister.classList.add('ach');
});

const buttonEyeOne = document.getElementById("eye-1");
const buttonEyeTwo = document.getElementById("eye-2");
const buttonEyeThree = document.getElementById("eye-3"); // لتأكيد كلمة المرور

buttonEyeOne.addEventListener('click', () => {
  const input = document.getElementById('login-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  buttonEyeOne.querySelector('i').classList.toggle('ri-eye-line');
  buttonEyeOne.querySelector('i').classList.toggle('ri-eye-off-line');
});

buttonEyeTwo.addEventListener('click', () => {
  const input = document.getElementById('reg-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  buttonEyeTwo.querySelector('i').classList.toggle('ri-eye-line');
  buttonEyeTwo.querySelector('i').classList.toggle('ri-eye-off-line');
});

if (buttonEyeThree) {
  buttonEyeThree.addEventListener('click', () => {
    const input = document.getElementById('reg-confirm-password');
    input.type = input.type === 'password' ? 'text' : 'password';
    buttonEyeThree.querySelector('i').classList.toggle('ri-eye-line');
    buttonEyeThree.querySelector('i').classList.toggle('ri-eye-off-line');
  });
}

const loginForm = document.querySelector(".myform_one");
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector(".login_username.login_email").value;
  const password = document.querySelector(".login_pas").value;
  const emailError = document.querySelector(".login_username.login_email").parentElement.querySelector('.drol');
  const passwordError = document.querySelector(".login_pas").parentElement.querySelector('.drol');

  emailError.textContent = '';
  passwordError.textContent = '';

  const regEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let isValid = true;
  let errorMessages = [];

  if (!regEmail.test(email)) {
    emailError.textContent = 'Please enter a valid email address.';
    errorMessages.push('❌ البريد الإلكتروني غير صحيح');
    isValid = false;
  }

  if (!validatePassword(password)) {
    passwordError.textContent = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
    errorMessages.push('❌ كلمة المرور يجب أن تكون 4 أحرف على الأقل');
    isValid = false;
  }

  if (!isValid) {
    showErrorMessage(errorMessages.join('\n'));
    return;
  }

  loginForm.submit();
});

// تحقق من فورم Register
const registerForm = document.querySelector(".myform");
registerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.querySelector("#reg-username").value;
  const email = document.querySelector("#reg-email").value;
  const phone = document.querySelector("#reg-phone").value;
  const password = document.querySelector("#reg-password").value;
  const confirmPassword = document.querySelector("#reg-confirm-password").value;

  const usernameError = document.querySelector("#reg-username").parentElement.querySelector('.drol') || createErrorElement(document.querySelector("#reg-username").parentElement);
  const emailError = document.querySelector("#reg-email").parentElement.querySelector('.drol') || createErrorElement(document.querySelector("#reg-email").parentElement);
  const phoneError = document.querySelector("#reg-phone").parentElement.querySelector('.drol') || createErrorElement(document.querySelector("#reg-phone").parentElement);
  const passwordError = document.querySelector("#reg-password").parentElement.querySelector('.drol') || createErrorElement(document.querySelector("#reg-password").parentElement);
  const confirmPasswordError = document.querySelector("#reg-confirm-password").parentElement.querySelector('.drol') || createErrorElement(document.querySelector("#reg-confirm-password").parentElement);

  usernameError.textContent = '';
  emailError.textContent = '';
  phoneError.textContent = '';
  passwordError.textContent = '';
  confirmPasswordError.textContent = '';

  const regUsername = /^[a-zA-Z\s]{3,50}$/;
  const regEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regPhone = /^[0-9]{10,15}$/;

  let isValid = true;
  let errorMessages = [];

  if (!regUsername.test(username)) {
    usernameError.textContent = 'الاسم يجب أن يكون من 3-50 حرف (حروف وفراغات فقط)';
    errorMessages.push('❌ الاسم يجب أن يكون من 3-50 حرف');
    isValid = false;
  }

  if (!regEmail.test(email)) {
    emailError.textContent = 'البريد الإلكتروني غير صحيح';
    errorMessages.push('❌ البريد الإلكتروني غير صحيح');
    isValid = false;
  }

  if (!regPhone.test(phone)) {
    phoneError.textContent = 'رقم الهاتف يجب أن يكون 10-15 رقم';
    errorMessages.push('❌ رقم الهاتف يجب أن يكون 10-15 رقم');
    isValid = false;
  }

  if (!validatePassword(password)) {
    passwordError.textContent = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
    errorMessages.push('❌ كلمة المرور يجب أن تكون 4 أحرف على الأقل');
    isValid = false;
  }

  if (password !== confirmPassword) {
    confirmPasswordError.textContent = 'كلمات المرور غير متطابقة';
    errorMessages.push('❌ كلمات المرور غير متطابقة');
    isValid = false;
  }

  if (!isValid) {
    showErrorMessage('❌ تحقق من البيانات:\n\n' + errorMessages.join('\n'));
    return;
  }

  registerForm.submit(); 
});

function createErrorElement(parent) {
  const error = document.createElement('p');
  error.className = 'drol';
  parent.appendChild(error);
  return error;
}