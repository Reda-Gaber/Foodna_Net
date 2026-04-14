 // Search for id
const params = new URLSearchParams(window.location.search);
    const productId = Number(params.get('id'));
    fetch('/api/products')
      .then(res => res.json())
      .then(date => {
        const product = date.find(p => p.Product_ID === productId);
      //  لا توجد بيانات
        if (!product) {
          document.getElementById('product').innerText = 'خطأ';
          return;
        }
        // data presence
        //============================ Product__page ============================
        document.getElementById('product').innerHTML = `
            <div class="product-up">
            <div class="scale">
    <div class="text-product">
       <h2 class="titel-product">${product.Product_Name}</h2>
      <p class="description-product">${product.Description}</p>
      <p class="points-one-product">إذا اشتريت هذا، ستحصل على ${product.Quantity} نقاط!</p>
      <div class="points-two-product">
        <i class="ri-award-fill"></i>
        <p>إذا اشتريت هذا، ستحصل على ${product.Quantity} نقاط!</p>
      </div>
      <div class="size-product">
         <h3 class="size">الحجم:</h3>
         <div class="size-options">
          <button><a href="#">صغير</a></button>
           <button><a href="#">متوسط</a></button>
           <button><a href="#">كبير</a></button>
           <button><a href="#">عائلي</a></button>
         </div>

      </div>
    </div>
    <div class="img-product">
       <img src="/images/products/${product.Image}" alt="">
    </div>
    </div>
    <div class="check_box">
      <h2 class="price_product ">${product.Price} جنيه</h2>
      <div class="combo_product box_product">
        <h2 class="chek_combo">كومبو</h2>
        <div class="combo-chek check_product">
          <button class="button_combo">بيتزا فقط</button>
          <button class="button_combo">مشروب بارد + سلطة ملفوف<span>(+60 جنيه)</span></button>
        </div>
      </div>
      <div class="sauce_product box_product">
        <h2 class="chek_sauce">الصلصة</h2>
        <div class="sauce-chek check_product">
          <button class="button_sauce">صلصة الطماطم الأصلية 🍕</button>
          <button class="button_sauce">صلصة الطماطم الحارة 🔥</button>
          <button class="button_sauce">صلصة البيستو <span>(+30 جنيه)</span></button>
           <button class="button_sauce">الصلصة البيضاء<span>(+30 جنيه)</span></button>
        </div>
      </div>

      <h2 class="totil_price_product">إجمالي الطلب:	<span>${product.Price} جنيه</span></h2>
      <button class="button-data-id" data-id="${product.Product_ID}">إضافة للسلة</button>
>>>>>>> 54af2d8 (Add end edit on api frontend)
    </div>
  </div>
        `;
      });
//============================ cart ============================
const cart = document.querySelector(".cart");
const cartButton = document.getElementById("cart-button");
const closeButton = document.querySelector(".close_cart");
cartButton.addEventListener('click' , () => {
    cart.classList.add("active");
});
closeButton.addEventListener('click' , () => {
    cart.classList.remove("active");
});
fetch('/api/products')
.then(response => response.json())
.then(data => {
    
    const aadtocartButton = document.querySelectorAll(".button-data-id");
    
    aadtocartButton.forEach(button => {
        button.addEventListener('click', (event) => {
            const clickedButton = event.target.closest("button"); 
            const prodactsId = clickedButton.getAttribute("data-id"); 
            const selectedProdact = data.find(product => product.Product_ID == prodactsId);
            addToCart(selectedProdact);

            const allMatcingButton = document.querySelectorAll(`.button-data-id[data-id="${prodactsId}"]`);
            allMatcingButton.forEach(btn => {
              btn.classList.add("activess");
              
            });
        });
    });
});
function  addToCart (product) {
    let cartData = JSON.parse(localStorage.getItem('cart')) || [];
    // تحويل البيانات من format API إلى format القديم
    const cartItem = {
        id: product.Product_ID,
        title: product.Product_Name,
        price: product.Price,
        img: `images/products/${product.Image}`,
        quantity: 1
    };
    cartData.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cartData));
    updetecart();
    const cartElement = document.querySelector(".cart");
    if (cartElement) {
        cartElement.classList.add("active");
    }
    console.log(cartData);
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
      <img src="/${item.img}" alt="alt">
      <div class="content">
        <h4>
           ${item.title}
        </h4>
        <p class="price_cart">${totalPrice} جنيه</p>
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
priceCartTotal.innerHTML = `${totalPrices} جنيه`;
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



// darkMode
const themButton = document.getElementById('theme-button');
const darkTheme = 'dark-theme';
const iconTheme = 'ri-sun-line';
const selectedTheme = localStorage.getItem('selected-theme');
const selectedIcon = localStorage.getItem('selected-icon');
const getCurrentTheme = () =>
    document.body.classList.contains(darkTheme) ? 'dark' : 'light';

const getCurrentIcon = () =>
    themButton.classList.contains(iconTheme) ? 'ri-moon-line' : 'ri-sun-line';

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


// ============================ Checkout ============================
/**
 * دالة إتمام الطلب - تتحقق من تسجيل العميل
 */
function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // التحقق من أن السلة غير فارغة
    if (cart.length === 0) {
        showCartMessage('السلة فارغة! الرجاء إضافة منتجات.', 'warning');
        return;
    }
    
        // Check if user is authenticated (guard against missing auth-state.js)
        if (typeof window.isAuthenticated !== 'function' || !window.isAuthenticated()) {
            showCartMessage('يجب تسجيل الدخول أولاً لإتمام الطلب!', 'error');
            if (typeof window.redirectToLogin === 'function') {
                setTimeout(() => window.redirectToLogin(), 800);
            } else {
                // Persist pending cart and intended redirect so checkout can resume
                try {
                    localStorage.setItem('pendingCart', JSON.stringify(cart));
                    localStorage.setItem('postAuthRedirect', encodeURIComponent(window.location.pathname + window.location.search));
                    localStorage.setItem('checkoutIntent', 'true');
                } catch (e) {
                    console.warn('Could not persist pending cart before redirect', e);
                }
                setTimeout(() => { window.location.href = '/register?next=' + encodeURIComponent(window.location.pathname + window.location.search); }, 800);
            }
            return;
        }
    
    // حساب المجموع
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // عرض رسالة تأكيد
    const cartElement = document.querySelector(".cart");
    if (cartElement) {
        cartElement.classList.add("active");
    }
    showCartMessage(`سيتم إتمام الطلب بقيمة ${totalAmount.toFixed(2)} جنيه - جاري المعالجة...`, 'info');
    
    // محاولة إنشاء الطلب
    submitOrder(cart, totalAmount);
}

/**
 * إرسال الطلب إلى الخادم
 */
async function submitOrder(cartItems, totalAmount) {
    try {
        console.log('Submitting order...');
        // محاولة إرسال الطلب
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                items: cartItems.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: totalAmount,
                deliveryAddress: 'عنوان التوصيل'
            })
        });

        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (response.status === 401) {
            // العميل غير مسجل - إعادة التوجيه لصفحة التسجيل
            showCartMessage('يجب عليك تسجيل الدخول أولاً!', 'error');
                setTimeout(() => {
                try {
                    localStorage.setItem('pendingCart', JSON.stringify(cartItems));
                    localStorage.setItem('postAuthRedirect', encodeURIComponent(window.location.pathname + window.location.search));
                    localStorage.setItem('checkoutIntent', 'true');
                } catch (e) {
                    console.warn('Could not persist pending cart before redirect', e);
                }
                if (typeof window.redirectToLogin === 'function') {
                    window.redirectToLogin();
                } else {
                    window.location.href = '/register?next=' + encodeURIComponent(window.location.pathname + window.location.search);
                }
            }, 800);
            return;
        }

        if (!data.success) {
            // عرض رسالة الخطأ الفعلية من الخادم
            const errorMessage = data.message || data.error?.message || 'فشل في إنشاء الطلب';
            showCartMessage(`✗ خطأ: ${errorMessage}`, 'error');
            console.error('Server error:', data);
            return;
        }

        // تم إنشاء الطلب بنجاح
        showCartMessage(`✓ تم إنشاء الطلب بنجاح! رقم الطلب: ${data.data.orderNumber}`, 'success');
        
        // مسح السلة من localStorage
        localStorage.removeItem('cart');
        // مسح أي حالة انتظار بعد المصادقة التي قد تكون بقيت
        try {
            localStorage.removeItem('pendingCart');
            localStorage.removeItem('postAuthRedirect');
            localStorage.removeItem('checkoutIntent');
        } catch(e) { /* ignore */ }
        
        // تحديث عرض السلة
        if (typeof updetecart === 'function') {
            updetecart();
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showCartMessage(`✗ خطأ في الاتصال: ${error.message}`, 'error');
    }
}

/**
 * عرض رسالة في السلة
 */
function showCartMessage(message, type = 'info') {
    const messageElement = document.getElementById('cart_message');
    if (!messageElement) return;

    // إزالة الـ classes السابقة
    messageElement.className = 'cart_message';
    
    // إضافة لون بناءً على النوع
    if (type === 'success') {
        messageElement.style.backgroundColor = '#4CAF50';
        messageElement.style.color = '#fff';
    } else if (type === 'error') {
        messageElement.style.backgroundColor = 'var(--text-color)';
        messageElement.style.color = '#fff';
    } else if (type === 'warning') {
        messageElement.style.backgroundColor = '#ff9800';
        messageElement.style.color = '#fff';
    } else {
        messageElement.style.backgroundColor = '#2196F3';
        messageElement.style.color = '#fff';
    }
    
    messageElement.textContent = message;
    messageElement.style.display = 'block';
    
    // إخفاء الرسالة بعد 4 ثواني (للرسائل الناجحة والتحذيرات)
    if (type !== 'error') {
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 4000);
    }
}

// إضافة event listener لأزرار "إتمام الطلب"
document.addEventListener('DOMContentLoaded', function() {
    const checkoutButtons = document.querySelectorAll('.btn_cart');
    checkoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            handleCheckout();
        });
    });
});
      






      