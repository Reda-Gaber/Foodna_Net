
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
const buttonEyeOne = document.getElementById("eye-1");
const buttonEyeTwo = document.getElementById("eye-2");

buttonEyeOne.addEventListener('click', () => {
     const i = document.getElementById('login-password');
     i.type = i.type==='password' ? 'text' : 'password';
});
buttonEyeTwo.addEventListener('click', () => {
     const i = document.getElementById('reg-password');
     i.type = i.type==='password' ? 'text' : 'password';
});

// =====================================  I'm not finished  =======================================

const myForm = document.querySelector(".myform_one");
myForm.addEventListener('submit', (events) => {
  events.preventDefault();
  const userName = document.querySelector(".login_username").value;
  const passwords = document.querySelector(".login_pas");
  const regLogin = /^[a-zA-Z0-9_]{3,15}$/;
  const regLoginPas = /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
  let validat = regLogin.test(userName);
  let validats = regLoginPas.test(passwords);
if (validat === false || validats === false) {
  return false;
} else {
 return true
}
});

// =====================================  I'm not finished  =======================================