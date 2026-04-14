
const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get('id'));
    fetch('../json/min.json')
      .then(res => res.json())
      .then(date => {
        const product = date.products.find(p => p.id === productId);

        if (!product) {
          document.getElementById('product').innerText = 'erorr';
          return;
        }
           console.log(product.img);
        document.getElementById('product').innerHTML = `
            <div class="product-up">
    <div class="text-product">
       <h2 class="titel-product">${product.title}</h2>
      <p class="description-product">${product.text}</p>
      <p class="points-one-product">If you purchase this you will earn ${product.points} Points!</p>
      <div class="points-two-product">
        <i class="ri-award-fill"></i>
        <p> If you purchase this you will earn ${product.points} Points!</p>
      </div>
      <div class="size-product">
         <h3 class="size">Size:</h3>
         <div class="size-options">
          <button><a href="#">Small</a></button>
           <button><a href="#">Medium</a></button>
           <button><a href="#">Large</a></button>
           <button><a href="#">Family</a></button>
         </div>

      </div>
    </div>
    <div class="img-product">
       <img src="../${product.img}" alt="">
    </div>
    <div class="check_box">
      <h2 class="price_product ">${product.price} EGP</h2>
      <div class="combo_product sid">
        <h2 class="chek_combo">Go Combo</h2>
        <div class="combo-chek sd">
          <button class="button_combo">Pizza Only</button>
          <button class="button_combo">Soft Drinks + Coleslaw<span>(+60 EGP)</span></button>
        </div>
      </div>
      <div class="sauce_product sid">
        <h2 class="chek_sauce">Sauce</h2>
        <div class="sauce-chek sd">
          <button class="button_sauce">Original Tomato Sauce 🍕</button>
          <button class="button_sauce">Spicy Tomato Sauce 🔥</button>
          <button class="button_sauce">Pesto Sauce <span>(+30 EGP)</span></button>
           <button class="button_sauce">White Sauce<span>(+30 EGP)</span></button>
        </div>
      </div>
      <h2 class="totil_price_product">Order total:	<span>${product.price} EGP</span></h2>
      <button class="mjx" data-id="${product.id}">add to cart</button>
    </div>
  </div>
        `;
      });

const cart = document.querySelector(".cart");
const cartButton = document.getElementById("cart-button");
const closeButton = document.querySelector(".close_cart");
cartButton.addEventListener('click' , () => {
    cart.classList.add("active");
});
closeButton.addEventListener('click' , () => {
    cart.classList.remove("active");
});
fetch('../json/min.json')
.then(response => response.json())
.then(data => {
    
    const aadtocartButton = document.querySelectorAll(".mjx");
    
    aadtocartButton.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest("button"); 
            const prodactsId = clickedButton.getAttribute("data-id"); 
            const selectedProdact = data.products.find(product => product.id == prodactsId);
            addToCart(selectedProdact);

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
      <img src="../${item.img}" alt="alt">
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














      
