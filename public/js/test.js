const productsGrid1 = document.querySelector(".products-grid_1");
const productsGrid2 = document.querySelector(".products-grid_2");
const mySwiper = document.querySelector(".slides_matc");
const OffersSlide = document.querySelector(".Offers_slide");

// مصفوفة الصور الخاصة بالسلايدر (مستقلة عن الـ API)
const sliderImages = [
  "slider1.png",
  "slider2.png"
];

async function apiass() {
  try {
    // جلب البيانات من الـ API
    let response = await fetch("http://localhost:3000/api/products");
    let data = await response.json();

    // تمرير البيانات للوظائف
    renderProducts(data);
    renderMainDishes(data);
    renderOffers(data);
    renderSlider(); // الآن السلايدر مستقل عن البيانات
  } catch (error) {
  }
}

// المنتجات حسب الفئة Main Dish
function renderMainDishes(products) {
  const mainDishes = products.filter(p => p.Category === "Main Dish");

  mainDishes.slice(0, 6).forEach(p => {
    const div = document.createElement("div");
    div.classList.add("product", "swiper-slide");
    div.innerHTML = `
      <img src="./images/${p.Image}" alt="${p.Product_Name}">
      <div class="product-info">
        <h3>${p.Product_Name}</h3>
        <div class="price">${p.Price} جنيه</div>
      </div>
      <div class="featured__actions">
        <button><a href="/product-page?id=${p.Product_ID}">اختر الخيارات</a></button>
      </div>
    `;
    productsGrid1.appendChild(div);
  });
}

// المنتجات حسب Supplier_ID 2 (مثال للفئة الثانية)
function renderProducts(products) {
  const supplierProducts = products.filter(p => p.Supplier_ID === 2);

  supplierProducts.slice(0, 6).forEach(p => {
    const div = document.createElement("div");
    div.classList.add("product", "swiper-slide", "/__article");
    div.innerHTML = `
      <img src="./images/${p.Image}" alt="${p.Product_Name}">
      <div class="product-info">
        <h3>${p.Product_Name}</h3>
        <div class="price">${p.Price} جنيه</div>
      </div>
      <div class="featured__actions">
        <button><a href="/product-page?id=${p.Product_ID}">اختر الخيارات</a></button>
      </div>
    `;
    productsGrid2.appendChild(div);
  });
}

function renderSlider() {
  sliderImages.forEach(img => {
    const div = document.createElement("div");
    div.classList.add("swiper-slide");
    div.innerHTML = `<img src="/images/${img}" alt="Slider Image">`;
    mySwiper.appendChild(div);
  });
}
// العروض (يمكنك تعديلها لاحقًا لتكون مستقلة أو من الـ API)
function renderOffers(products) {
  const offers = products.slice(0, 3); // أول 3 منتجات كمثال
  offers.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("swiper-slide", "slide");
    div.innerHTML = `
      <img src="./images/${p.Image}" alt="${p.Product_Name}">
      <img src="./images/${p.Image}" alt="${p.Product_Name}">
    `;
    OffersSlide.appendChild(div);
  });
}

apiass();

