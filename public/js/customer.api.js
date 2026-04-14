
async function apiass () {
 try {
    let myRequest = await fetch("./json/min.json");
    let dataRequest = await myRequest.json();  
    // بناء واجهة الإعلانات
    slider(dataRequest);
    // بناء واجهة العروض 
     offers(dataRequest);
     // بناء واجهة المنتجات 
 } catch (error){
       console.error("error");
    }
}

async function apia () {
 try {
    let myRequest = await fetch("/api/products?limit=100");
    let dataRequest = await myRequest.json();  
     // عرض التصنيفات الثابتة (Shawerma و pizza)
     
     productsOne(dataRequest);
     // عرض جميع التصنيفات الأخرى بشكل ديناميكي
     displayCategories(dataRequest);
     // عرض جميع المنتجات
     displayAllProducts(dataRequest);
    
 } catch (error){
       console.error("error");
    }
}




//============================ Slider ============================
const mySwiper = document.querySelector(".slides_matc");
 function slider (actev) {
 // التحقق من وجود العنصر قبل الاستخدام
 if (!mySwiper) {
  console.log('⚠️ .slides_matc غير موجود في الصفحة الحالية');
  return;
 }
 // clear previous slides to avoid duplicates on re-render
 mySwiper.innerHTML = '';
 for (let i = 0; i < 4; i++) {
     const createDiv = document.createElement("div");
     createDiv.classList.add("swiper-slide");
     createDiv.innerHTML = `<img src="${actev.slider[i].imgs}" alt="">`;
     mySwiper.appendChild(createDiv);
 }
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
  }
});
}
//============================ Offers ============================
const OffersSlide = document.querySelector(".Offers_slide");
function  offers (data) {
 // التحقق من وجود العنصر قبل الاستخدام
 if (!OffersSlide) {
  console.log('⚠️ .Offers_slide غير موجود في الصفحة الحالية');
  return;
 }
 // clear previous offers to avoid duplicates on re-render
 OffersSlide.innerHTML = '';
 for (let i = 0;  i < 3; i++) {
  const createEle = document.createElement("div");
  createEle.classList.add("swiper-slide");
  createEle.classList.add("slide");
  createEle.innerHTML = `<img src="${data.Offers[i].imgs_1}" alt="Image 1">
            <img src="${data.Offers[i].imgs_2}" alt="Image 2">`;
     OffersSlide.appendChild(createEle); 
 }
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

}
//============================ عرض التصنيفات بشكل ديناميكي ============================
function displayCategories(requests) {
    // استخراج التصنيفات الفريدة من البيانات
    const categoriesMap = {};
    
    requests.forEach(product => {
        const category = product.Category || 'بدون تصنيف';
        if (!categoriesMap[category]) {
            categoriesMap[category] = [];
        }
        categoriesMap[category].push(product);
    });

    // الحصول على container للتصنيفات
    const mainContainer = document.querySelector('main.main');
    if (!mainContainer) return;

    // البحث عن آخر تصنيف قبل قسم "جميع المنتجات"
    const allProductsSection = document.querySelector('.category-all');
    
    // Remove any previously injected dynamic categories to avoid duplication
    const existingDynamic = mainContainer.querySelectorAll('.category-dynamic');
    existingDynamic.forEach(n => n.remove());

    // إنشاء قسم لكل تصنيف
    Object.entries(categoriesMap).forEach(([categoryName, products]) => {
        // تخطي التصنيفات المعروضة بالفعل (Shawerma و pizza)
        if (categoryName === 'Shawerma' || categoryName === 'pizza') {
            return;
        }

        // إنشاء عنصر التصنيف
        const categorySection = document.createElement('div');
        categorySection.className = 'category-dynamic';
        categorySection.innerHTML = `
            <div class="container">
                <div class="special-heading">
                    <span>${categoryName}</span>
                </div>
                <div class="products-card swiper">
                    <div class="products-grid swiper-wrapper" data-category="${categoryName}"></div>
                    <div class="swiper-button-prev"><i class="ri-arrow-right-s-line"></i></div>
                    <div class="swiper-button-next"><i class="ri-arrow-left-s-line"></i></div>
                </div>
            </div>
        `;

        // إضافة القسم قبل قسم "جميع المنتجات"
        if (allProductsSection) {
            mainContainer.insertBefore(categorySection, allProductsSection);
        } else {
            mainContainer.appendChild(categorySection);
        }

        // ملء المنتجات في القسم
        const productsGrid = categorySection.querySelector(`[data-category="${categoryName}"]`);
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product', 'swiper-slide');
            productCard.innerHTML = `
                <img src="/images/products/${product.Image}" alt="${product.Product_Name}">
                <div class="product-info">
                    <h3>${product.Product_Name}</h3>
                    <div class="points">${product.Quantity} كمية</div>
                    <div class="price">${product.Price} جنيه</div>
                </div>
                <div class="button__actions">
                    <button class="Product__actions">
                        <a href="product-page?id=${product.Product_ID}">اختر الخيارات</a>
                    </button>
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
    });
}

//============================ عرض التصنيفات الثابتة (Shawerma و pizza) ============================
function productsOne(requests) {
    const request = requests.filter(function (a) {
        if (a.Category === "Shawerma") {
            return a;
        }
    });
    const requestr = requests.filter(function (a) {
        if (a.Category === "pizza") {
            return a;
        }
    });

    const productsOneElement = document.querySelector(".products-grid_1");
    const productsGrids = document.querySelector(".products-grid_2");

    // عرض منتجات Shawerma
    if (productsOneElement) {
        productsOneElement.innerHTML = '';
        request.forEach(product => {
            const createElz = document.createElement("div");
            createElz.classList.add("product");
            createElz.classList.add("swiper-slide");
            createElz.innerHTML = `
                <img src="/images/products/${product.Image}" alt="${product.Product_Name}">
                <div class="product-info">
                    <h3>${product.Product_Name}</h3>
                    <div class="points">${product.Quantity} كمية</div>
                    <div class="price">${product.Price} جنيه</div>
                </div>
                <div class="button__actions">
                    <button class="Product__actions">
                        <a href="product-page?id=${product.Product_ID}">اختر الخيارات</a>
                    </button>
                </div>
            `;
            productsOneElement.appendChild(createElz);
        });
    }

    // عرض منتجات pizza
    if (productsGrids) {
        productsGrids.innerHTML = '';
        requestr.forEach(product => {
            const createElp = document.createElement("div");
            createElp.classList.add("product");
            createElp.classList.add("swiper-slide");
            createElp.innerHTML = `
                <img src="/images/products/${product.Image}" alt="${product.Product_Name}">
                <div class="product-info">
                    <h3>${product.Product_Name}</h3>
                    <div class="points">${product.Quantity} كمية</div>
                    <div class="price">${product.Price} جنيه</div>
                </div>
                <div class="button__actions">
                    <button class="Product__actions">
                        <a href="product-page?id=${product.Product_ID}">اختر الخيارات</a>
                    </button>
                </div>
            `;
            productsGrids.appendChild(createElp);
        });
    }
}



// Cache for product data to avoid unnecessary DOM updates
let cachedProducts = null;
let cachedOffers = null;

//============================ Optimized API calls with caching ============================
async function apiassOptimized() {
    try {
        let myRequest = await fetch("./json/min.json");
        let dataRequest = await myRequest.json();  
        
        // Check if data changed before updating
        if (JSON.stringify(cachedOffers) !== JSON.stringify(dataRequest)) {
            cachedOffers = dataRequest;
            slider(dataRequest);
            offers(dataRequest);
        }
    } catch (error) {
        console.error("error loading offers");
    }
}

async function apiaOptimized() {
    try {
        let myRequest = await fetch("/api/products?limit=100");
        let dataRequest = await myRequest.json();  
        // Check if data changed before updating
        if (JSON.stringify(cachedProducts) !== JSON.stringify(dataRequest)) {
            cachedProducts = dataRequest;
            productsOne(dataRequest);
            displayCategories(dataRequest);
            displayAllProducts(dataRequest);
        }
    } catch (error) {
        console.error("error loading products");
    }
}

// Run the function - ONLY on homepage where these elements exist
if (document.querySelector(".slides_matc") && document.querySelector(".Offers_slide")) {
    console.log('✅ تحميل بيانات الصفحة الرئيسية...');
    apiassOptimized();
    apiaOptimized();

    // REMOVED: Auto-refresh was causing unnecessary DOM updates and flickering
    // Products will still update if manually triggered or through event listeners
} else {
    console.log('ℹ️ صفحة جانبية - تم تخطي استدعاء customer.api.js');
}





























































//============================ cart functions ============================
function addToCart(product) {
    const cartItem = {
        id: product.Product_ID,
        title: product.Product_Name,
        price: Number(product.Price) || 0,
        img: `images/products/${product.Image}`,
        quantity: 1
    };

    if (window.cartState && typeof window.cartState.addItem === 'function') {
      window.cartState.addItem(cartItem);
    } else {
      let cartData = JSON.parse(localStorage.getItem('cart')) || [];
      cartData.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cartData));
      updateCart();
    }
    const cartElement = document.querySelector('.cart');
    if (cartElement) cartElement.classList.add('active');
}

function updateCart() {
    const cartItemContainer = document.getElementById('cart_items');
    if (!cartItemContainer) return;
    const cart = (window.cartState && typeof window.cartState.getItems === 'function') ? window.cartState.getItems() : (JSON.parse(localStorage.getItem('cart')) || []);

    let totalPrices = 0;
    let totalCount = 0;
    cartItemContainer.innerHTML = '';

    cart.forEach((item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const totalPrice = qty * price;
        totalPrices += totalPrice;
        totalCount += qty;

        cartItemContainer.innerHTML += `
        <div class="item_cart">
            <img src="/${item.img}" alt="alt">
            <div class="content">
                <h4>${item.title}</h4>
                <p class="price_cart">${totalPrice.toFixed(2)} جنيه</p>
                <div class="quantity_control">
                    <button class="decrease_quantity" data-id="${item.id}">-</button>
                    <span class="quantity">${qty}</span>
                    <button class="increase_quantity" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="delete_item" data-id="${item.id}">حذف</button>
        </div>`;
    });

    const totalPriceElement = document.querySelector('.total_price');
    if (totalPriceElement) totalPriceElement.textContent = `${totalPrices.toFixed(2)} جنيه`;
    const cartCountElement = document.querySelector('.cart_count');
    if (cartCountElement) cartCountElement.textContent = totalCount;

    // Attach events
    document.querySelectorAll('.increase_quantity').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.dataset.id);
            if (window.cartState && typeof window.cartState.increaseQuantity === 'function') {
                window.cartState.increaseQuantity(id);
            } else {
                const c = JSON.parse(localStorage.getItem('cart')) || [];
                const idx = c.findIndex(x => x.id == id);
                if (idx > -1) { c[idx].quantity = (c[idx].quantity || 0) + 1; localStorage.setItem('cart', JSON.stringify(c)); updateCart(); }
            }
        });
    });

    document.querySelectorAll('.decrease_quantity').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.dataset.id);
            if (window.cartState && typeof window.cartState.decreaseQuantity === 'function') {
                window.cartState.decreaseQuantity(id);
            } else {
                const c = JSON.parse(localStorage.getItem('cart')) || [];
                const idx = c.findIndex(x => x.id == id);
                if (idx > -1 && c[idx].quantity > 1) { c[idx].quantity -= 1; localStorage.setItem('cart', JSON.stringify(c)); updateCart(); }
            }
        });
    });

    document.querySelectorAll('.delete_item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.dataset.id || e.currentTarget.getAttribute('data-id'));
            if (window.cartState && typeof window.cartState.removeItem === 'function') {
                window.cartState.removeItem(id);
            } else {
                const c = JSON.parse(localStorage.getItem('cart')) || [];
                const idx = c.findIndex(x => x.id == id);
                if (idx > -1) { c.splice(idx, 1); localStorage.setItem('cart', JSON.stringify(c)); updateCart(); }
            }
        });
    });
}



