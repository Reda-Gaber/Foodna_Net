/* =============================================================
   main.js — الملف الرئيسي الموحّد
   يشمل: Slider · Offers · التصنيفات الديناميكية + Swiper · Cart
   ============================================================= */

/* -----------------------------------------------------------
   Breakpoints موحّدة لجميع كاروسيلات المنتجات
   موبايل (< 640px): 1 بوكس
   تابلت  (640-991px): 2 بوكس
   ديسكتوب (992px+): 3 بوكسات
   ** لا كسور مثل 1.2 أو 1.5 حتى لا يظهر "نصف بوكس" **
----------------------------------------------------------- */
const PRODUCT_SWIPER_CONFIG = {
  direction: 'horizontal',
  loop: false,
  grabCursor: true,
  centeredSlides: false,
  initialSlide: 0,
  watchOverflow: true,
  observer: true,
  observeParents: true,
  slidesPerView: 1,
  spaceBetween: 12,
  breakpoints: {
    640: { slidesPerView: 2, spaceBetween: 16 },
    992: { slidesPerView: 3, spaceBetween: 20 },
  },
};

/* كشف RTL مرة واحدة */
const isRTL =
  document.documentElement.dir === 'rtl' ||
  window.getComputedStyle(document.documentElement).direction === 'rtl';

/* متغيرات Swiper الثابتة */
let swiperSliderInstance = null;
let swiperOffersInstance = null;
let cachedProducts = null;
let cachedOffers   = null;

/* =============================================================
   API CALLS
   ============================================================= */
async function apiass() {
  try {
    const res  = await fetch('./json/min.json');
    const data = await res.json();
    if (JSON.stringify(cachedOffers) !== JSON.stringify(data)) {
      cachedOffers = data;
      slider(data);
      offers(data);
    }
  } catch (e) {}
}

async function apia() {
  try {
    const res  = await fetch('/api/products?limit=100');
    const data = await res.json();
    if (JSON.stringify(cachedProducts) !== JSON.stringify(data)) {
      cachedProducts = data;
      if (typeof productsOne === 'function') productsOne(data);
      displayCategories(data);
      if (typeof displayAllProducts === 'function') displayAllProducts(data);
    }
  } catch (e) {
    console.error('apia failed:', e);
  }
}

/* =============================================================
   SLIDER (الإعلانات)
   ============================================================= */
const mySwiper = document.querySelector('.slides_matc');

function slider(actev) {
  if (!mySwiper) return;

  const sliderContainer = document.querySelector('.mySwiper');
  const prevButton = sliderContainer?.querySelector('.swiper-button-prev');
  const nextButton = sliderContainer?.querySelector('.swiper-button-next');

  if (swiperSliderInstance?.destroy) {
    swiperSliderInstance.destroy(true, true);
    swiperSliderInstance = null;
  }

  mySwiper.innerHTML = '';
  const slideCount = Math.min(actev?.slider?.length || 0, 4);

  for (let i = 0; i < slideCount; i++) {
    const div = document.createElement('div');
    div.className = 'swiper-slide';
    div.innerHTML = `<img src="${actev.slider[i].imgs}" alt="" loading="lazy">`;
    mySwiper.appendChild(div);
  }

  swiperSliderInstance = new Swiper('.mySwiper', {
    spaceBetween: 20,
    grabCursor: true,
    slidesPerView: 1,
    loop: slideCount > 1,
    speed: 1000,
    autoplay: { delay: 3000, disableOnInteraction: false },
    navigation: {
      nextEl: nextButton || '.mySwiper .swiper-button-next',
      prevEl: prevButton || '.mySwiper .swiper-button-prev',
    },
    pagination: { el: '.mySwiper .swiper-pagination', clickable: true },
  });
}

/* =============================================================
   OFFERS (العروض)
   ============================================================= */
const OffersSlide = document.querySelector('.Offers_slide');

function offers(data) {
  if (!OffersSlide) return;

  const offersContainer = document.querySelector('.slider-for-offers');
  const prevButton = offersContainer?.querySelector('.swiper-button-prev');
  const nextButton = offersContainer?.querySelector('.swiper-button-next');

  if (swiperOffersInstance?.destroy) {
    swiperOffersInstance.destroy(true, true);
    swiperOffersInstance = null;
  }

  OffersSlide.innerHTML = '';
  const offerCount = Math.min(data?.Offers?.length || 0, 3);

  for (let i = 0; i < offerCount; i++) {
    const div = document.createElement('div');
    div.className = 'swiper-slide slide';
    div.innerHTML = `
      <img src="${data.Offers[i].imgs_1}" alt="عرض ${i + 1} - صورة 1">
      <img src="${data.Offers[i].imgs_2}" alt="عرض ${i + 1} - صورة 2">
    `;
    OffersSlide.appendChild(div);
  }

  swiperOffersInstance = new Swiper('.slider-for-offers', {
    loop: offerCount > 1,
    spaceBetween: 20,
    slidesPerView: 1,
    grabCursor: true,
    speed: 2000,
    autoplay: { delay: 3000, disableOnInteraction: false },
    navigation: {
      nextEl: nextButton || '.slider-for-offers .swiper-button-next',
      prevEl: prevButton || '.slider-for-offers .swiper-button-prev',
    },
  });
}

/* =============================================================
   SWIPER للمنتجات — دالة مشتركة لجميع الكاروسيلات
   تُستخدم للتصنيفات الثابتة (Shawerma/pizza) والديناميكية معاً
   ============================================================= */
function initProductSwiper(container) {
  if (!container || container.dataset.swiperInitialized === 'true') return;

  const wrapper = container.querySelector('.swiper-wrapper');
  if (!wrapper) return;

  Array.from(wrapper.children).forEach(child => {
    if (!child.classList.contains('swiper-slide')) {
      child.classList.add('swiper-slide');
    }
  });

  const navPrev = container.querySelector('.swiper-button-prev');
  const navNext = container.querySelector('.swiper-button-next');

  try {
    new Swiper(container, {
      ...PRODUCT_SWIPER_CONFIG,
      rtl: isRTL,
      navigation: {
        nextEl: navNext,
        prevEl: navPrev,
        disabledClass: 'swiper-button-disabled',
      },
    });

    container.dataset.swiperInitialized = 'true';
  } catch (err) {
    console.error('Swiper init failed:', err.message);
  }
}

/* تهيئة كاروسيلات الثابتة الموجودة مسبقاً في HTML */
function initStaticSwipers() {
  document.querySelectorAll('.products-card.swiper').forEach(initProductSwiper);
}

/* =============================================================
   بطاقة منتج
   ============================================================= */
function buildProductCard(product) {
  const oldPrice   = Number(product.Price    || 0);
  const discount   = Number(product.Discount || 0);
  const finalPrice = discount > 0 ? Math.max(0, oldPrice * (1 - discount / 100)) : oldPrice;

  const card = document.createElement('div');
  card.className = 'product swiper-slide';
  card.innerHTML = `
    ${discount > 0 ? `<div class="product-discount-badge">خصم ${discount.toFixed(0)}%</div>` : ''}
    <img
      src="/images/products/${product.Image}"
      alt="${product.Product_Name}"
      
      loading="lazy"
    >
    <div class="product-info">
      <h3>${product.Product_Name}</h3>
      <div class="price">
        ${discount > 0
          ? `<span style="text-decoration:line-through;color:#999;font-size:15px;margin-left:5px;">
               ${oldPrice.toFixed(2)}
             </span>`
          : ''}
        <span style="color:var(--main-color);font-weight:bold;font-family:var(--font-2)">
          ${finalPrice.toFixed(2)} جنيه
        </span>
      </div>
    </div>
    <div class="button__actions">
      <button class="Product__actions">
        <a href="product-page?id=${product.Product_ID}">اختر الوجبة</a>
      </button>
    </div>
  `;
  return card;
}

/* =============================================================
   التصنيفات الديناميكية
   ============================================================= */
const SKIP_CATEGORIES = new Set(['Shawerma', 'pizza']);
const MAX_DISPLAY = 6;

function buildCategorySection(categoryName, products, insertBefore, mainContainer) {
  const section = document.createElement('div');
  section.className = 'category-dynamic';
  section.innerHTML = `
    <div class="container">
      <div class="category-heading">
        <div class="special-heading">
          <span>${categoryName}</span>
        </div>
      </div>
      <div class="products-card swiper">
        <div class="swiper-wrapper" data-category="${categoryName}"></div>
        <div class="swiper-button-prev"><i class="ri-arrow-right-s-line"></i></div>
        <div class="swiper-button-next"><i class="ri-arrow-left-s-line"></i></div>
      </div>
    </div>
    <div class="special-foot">
    <a class="view-more-link" href="/menu?category=${encodeURIComponent(categoryName)}">عرض المزيد</a>
    </div>
  `;

  if (insertBefore) {
    mainContainer.insertBefore(section, insertBefore);
  } else {
    mainContainer.appendChild(section);
  }

  const grid = section.querySelector(`[data-category="${categoryName}"]`);
  products.slice(0, MAX_DISPLAY).forEach(p => grid.appendChild(buildProductCard(p)));

  /* تهيئة Swiper فور اكتمال بناء الشرائح */
  initProductSwiper(section.querySelector('.products-card.swiper'));

  return section;
}

function displayCategories(requests) {
  if (typeof Swiper === 'undefined') {
    console.warn('Swiper غير محمّل');
    return;
  }

  const categoriesMap = {};
  requests.forEach(product => {
    const cat = product.Category || 'بدون تصنيف';
    (categoriesMap[cat] = categoriesMap[cat] || []).push(product);
  });

  const mainContainer = document.querySelector('main.main');
  if (!mainContainer) return;

  mainContainer.querySelectorAll('.category-dynamic').forEach(n => n.remove());

  const allProductsSection = document.querySelector('.category-all');

  Object.entries(categoriesMap).forEach(([name, products]) => {
    if (SKIP_CATEGORIES.has(name)) return;
    buildCategorySection(name, products, allProductsSection, mainContainer);
  });
}

window.displayCategories = displayCategories;

/* =============================================================
   تشغيل كل شيء
   ============================================================= */
if (document.querySelector('.slides_matc') && document.querySelector('.Offers_slide')) {
  apiass();
  apia();

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initStaticSwipers();
  } else {
    document.addEventListener('DOMContentLoaded', initStaticSwipers);
  }
}

/* =============================================================
   CART FUNCTIONS
   ============================================================= */
function addToCart(product) {
  const cartItem = {
    id: product.Product_ID,
    title: product.Product_Name,
    price: Number(product.Price) || 0,
    img: `images/products/${product.Image}`,
    quantity: 1,
  };

  if (window.cartState?.addItem) {
    window.cartState.addItem(cartItem);
  } else {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCart();
  }

  document.querySelector('.cart')?.classList.add('active');
}

function updateCart() {
  const cartItemContainer = document.getElementById('cart_items');
  if (!cartItemContainer) return;

  const cart = window.cartState?.getItems?.()
    ?? JSON.parse(localStorage.getItem('cart'))
    ?? [];

  let totalPrices = 0;
  let totalCount  = 0;
  cartItemContainer.innerHTML = '';

  cart.forEach(item => {
    const qty        = Number(item.quantity) || 0;
    const price      = Number(item.price)    || 0;
    const totalPrice = qty * price;
    totalPrices += totalPrice;
    totalCount  += qty;

    cartItemContainer.innerHTML += `
      <div class="item_cart">
        <img src="/${item.img}" alt="">
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
      </div>
    `;
  });

  const totalEl = document.querySelector('.total_price');
  const countEl = document.querySelector('.cart_count');
  if (totalEl) totalEl.textContent = `${totalPrices.toFixed(2)} جنيه`;
  if (countEl) countEl.textContent = totalCount;

  cartItemContainer.querySelectorAll('.increase_quantity').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      if (window.cartState?.increaseQuantity) {
        window.cartState.increaseQuantity(id);
      } else {
        const c   = JSON.parse(localStorage.getItem('cart')) || [];
        const idx = c.findIndex(x => x.id == id);
        if (idx > -1) {
          c[idx].quantity++;
          localStorage.setItem('cart', JSON.stringify(c));
          updateCart();
        }
      }
    });
  });

  cartItemContainer.querySelectorAll('.decrease_quantity').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      if (window.cartState?.decreaseQuantity) {
        window.cartState.decreaseQuantity(id);
      } else {
        const c   = JSON.parse(localStorage.getItem('cart')) || [];
        const idx = c.findIndex(x => x.id == id);
        if (idx > -1 && c[idx].quantity > 1) {
          c[idx].quantity--;
          localStorage.setItem('cart', JSON.stringify(c));
          updateCart();
        }
      }
    });
  });

  cartItemContainer.querySelectorAll('.delete_item').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      if (window.cartState?.removeItem) {
        window.cartState.removeItem(id);
      } else {
        const c   = JSON.parse(localStorage.getItem('cart')) || [];
        const idx = c.findIndex(x => x.id == id);
        if (idx > -1) {
          c.splice(idx, 1);
          localStorage.setItem('cart', JSON.stringify(c));
          updateCart();
        }
      }
    });
  });
}category-heading