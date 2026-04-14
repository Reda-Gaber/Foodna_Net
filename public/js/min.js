

//============================ search ============================
const searchButton = document.getElementById("search-button");
const searchClose = document.getElementById("search-close");
const  searchContent = document.getElementById("search-content");

searchButton.addEventListener('click', () => {
  searchContent.classList.add('show-search');
});

searchClose.addEventListener('click', () => {
    searchContent.classList.remove('show-search');
});





//============================ Swiper__slider ============================
let swiperSlider = new Swiper('.mySwiper', {
  spaceBetween: 20,
  grabCursor: true,
  slidesPerView: 1,
  loop: true,
  speed: 1000,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

//============================ Swiper__Offers ============================
let swiperOffers= new Swiper('.slider-for-offers', {
loop: true,
spaceBetween: 20,
slidesPerView: 1,
grabCursor: true,
speed: 2000,
 autoplay: {
    delay: 3000,
    disableOnInteraction: false,
   
},
 navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },


});


//============================ Swiper__product ============================
let swiperProduct = new Swiper('.products-card', {
loop: true,
spaceBetween: 18,
slidesPerView: 'auto',
speed: 700,
slidesPerView: 'auto',
 
navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
breakpoints: {
    1150: {
        slidesPerView: 3,
    }
}
});



//============================ the__dark__mode ============================
const themButton = document.getElementById('theme-button');
const darkTheme = 'dark-theme';
const iconTheme = 'ri-sun-line';
const selectedTheme = localStorage.getItem('selected-theme');
const selectedIcon = localStorage.getItem('selected-icon');

const getCurrentTheme = () => {
    document.body.classList.contains('darkTheme') ? 'dark' : 'light';
}

const getCurrentIcon = () => {
    themButton.classList.contains('iconTheme') ? 'ri-moon-line' : 'ri-sun-line';
}



if (selectedTheme) {
    document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme);
    themButton.classList[selectedIcon === 'ri-moon-line' ? 'add' : 'remove'](iconTheme);
}

themButton.addEventListener('click', () => {
    document.body.classList.toggle(darkTheme);
    themButton.classList.toggle(iconTheme);

    localStorage.setItem('selected-theme', getCurrentTheme());
    localStorage.setItem('selected-icon', getCurrentIcon());
});



// ============================ cart ============================
const cart = document.querySelector(".cart");
const cartButton = document.getElementById("cart-button");
const closeButton = document.querySelector(".close_cart");
cartButton.addEventListener('click' , () => {
    cart.classList.add("active");
});
closeButton.addEventListener('click' , () => {
    cart.classList.remove("active");
});
fetch('./json/min.json')
.then(response => response.json())
.then(data => {
    const aadtocartButton = document.querySelectorAll(".mjx");
    
    aadtocartButton.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest("button"); 
            const prodactsId = clickedButton.getAttribute("data-id"); 
            const selectedProdact = data.products.find(product => product.id == prodactsId);
             const selectedProdacs = data.category.find(product => product.id == prodactsId);
            addToCart(selectedProdact, selectedProdacs);

            const allMatcingButton = document.querySelectorAll(`.mjx[data-id="${prodactsId}"]`);
            allMatcingButton.forEach(btn => {
              btn.classList.add("activess");
              
            });
        });
    });
});
function  addToCart (product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
 cart.push({...product, quantity: 1});
 localStorage.setItem('cart', JSON.stringify(cart));
 updetecart();
 console.log(cart);
}
function updetecart () {
  const cartItemContainer = document.getElementById('cart_items');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  var totalPrices = 0;
   var totalCount = 0;

  cartItemContainer.innerHTML = "";
  cart.forEach((item, index) => {
   let totalPrice = item.price * item.quantity;

   totalPrices += totalPrice;
   totalCount += item.quantity;

   cartItemContainer.innerHTML += `
   <div class="item_cart">
      <img src="${item.img}" alt="alt">
      <div class="content">
        <h4>
           ${item.title}
        </h4>
        <p class="price_cart">${totalPrice} EGP</p>
        <div class="quantity_control">
          <button class="decrese_quantity"  data-index=${index}>-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="increse_quantity" data-index=${index}>+</button>
        </div>
      </div>
      <button class="delete_item" data-index="${index}"><i class="ri-delete-bin-5-line"></i></button>

    </div>`;
  });

 const priceCartTotal = document.querySelector(".price_cart_total");
 const contactItemTotal = document.querySelector(".count_item_cart");
//  const priceHeaderTotal = document.querySelector(".");
priceCartTotal.innerHTML = `${totalPrices} EGP`;
contactItemTotal.innerHTML = `${totalCount}`;



 const incresetButton = document.querySelectorAll('.increse_quantity');
 const decresetButton = document.querySelectorAll('.decrese_quantity');
incresetButton.forEach(button => {
    button.addEventListener('click', (event) => {
        const itemIndixs = event.target.closest("button").getAttribute('data-index');
        increse(itemIndixs);


    });
});
decresetButton.forEach(button => {
    button.addEventListener('click', (event) => {
        const itemIndixs = event.target.closest("button").getAttribute('data-index');
        decrese(itemIndixs);


    });
});



 const deiteButtonCart = document.querySelectorAll('.delete_item');
 deiteButtonCart.forEach(button => {
    button.addEventListener('click', (evect) => {
        const itemIndix = evect.target.closest('button').getAttribute('data-index');
        removeCart(itemIndix);
    });
 });

}
function increse (index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity += 1;
    localStorage.setItem('cart', JSON.stringify(cart));
    updetecart();

}
function decrese (index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updetecart();

}

function removeCart (index) {
   const cart = JSON.parse(localStorage.getItem('cart')) || [];
   const removeproduct = cart.splice(index, 1)[0];
   localStorage.setItem('cart', JSON.stringify(cart));
   updetecart();
   updetButtoncart(removeproduct.id);
}
function  updetButtoncart (productId) {
  const allMatchingButtons =document.querySelectorAll(`.mjx[data-id="${productId}"]`);
  allMatchingButtons.forEach(button => {
    button.classList.remove("activess");

  });
}
updetecart();

