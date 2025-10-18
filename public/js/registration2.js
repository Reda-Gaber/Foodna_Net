// التحويل بين شاشتي Login و Register
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

// إظهار/إخفاء كلمة المرور
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

// تحقق من فورم Login
const loginForm = document.querySelector(".myform_one");
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector(".login_username.login_email").value;
  const password = document.querySelector(".login_pas").value;
  const emailError = document.querySelector(".login_username.login_email").parentElement.querySelector('.drol');
  const passwordError = document.querySelector(".login_pas").parentElement.querySelector('.drol');

  // إعادة تعيين رسائل الخطأ
  emailError.textContent = '';
  passwordError.textContent = '';

  // Regex للتحقق
  const regEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;

  let isValid = true;

  if (!regEmail.test(email)) {
    emailError.textContent = 'Please enter a valid email address.';
    isValid = false;
  }

  if (!regPassword.test(password)) {
    passwordError.textContent = 'Password must be at least 6 characters, including at least one uppercase letter, one lowercase letter, and one number.';
    isValid = false;
  }

  if (isValid) {

    fetch("http://localhost:5001/user/emailisexist")
  .then(async res => {
    const data = await res.json(); // ⬅️ هنا بقى object
    if (!response.ok) throw data; 
    return data;
  })
  .then(data => {
    console.log("✅ Success object:", data);
  })
  .catch(err => {
    console.log("❌ Error object:", err);
  });


    loginForm.submit(); // إرسال الفورم إذا كانت البيانات صحيحة
  }
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

  // إعادة تعيين رسائل الخطأ
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

  // Regex للتحقق
  const regUsername = /^[a-zA-Z\s]{3,50}$/;
  const regEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regPhone = /^[0-9]{10,15}$/;
  const regPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/;

  let isValid = true;

  if (!regUsername.test(username)) {
    usernameError.textContent = 'Full Name must be 3-50 characters (letters and spaces only).';
    isValid = false;
  }

  if (!regEmail.test(email)) {
    emailError.textContent = 'Please enter a valid email address.';
    isValid = false;
  }

  if (!regPhone.test(phone)) {
    phoneError.textContent = 'Phone number must be 10-15 digits.';
    isValid = false;
  }

  if (!regPassword.test(password)) {
    passwordError.textContent = 'Password must be at least 6 characters, including at least one uppercase letter, one lowercase letter, and one number.';
    isValid = false;
  }

  if (password !== confirmPassword) {
    confirmPasswordError.textContent = 'Passwords do not match.';
    isValid = false;
  }



  if (isValid) {
    registerForm.submit(); // إرسال الفورم إذا كانت البيانات صحيحة
  }
});

// دالة لإنشاء عنصر خطأ إذا لم يكن موجودًا
function createErrorElement(parent) {
  const error = document.createElement('p');
  error.className = 'drol';
  parent.appendChild(error);
  return error;
}