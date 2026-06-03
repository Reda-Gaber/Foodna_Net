// ============================
// API - جلب البيانات
// ============================
const MENU_PAGE_SIZE = 8; // عدد المنتجات المعروضة في البداية
let allMenuProducts = []; // كل المنتجات
let currentCategory = null; // الفئة الحالية المختارة
let visibleCount = MENU_PAGE_SIZE; // عدد المنتجات المرئية الآن

function buildProductImageSrc(image) {
    if (!image) return '/images/placeholder.png';
    if (/^(https?:)?\/\//.test(image)) return image;
    return `/images/products/${image}`;
}

async function apiass() {
    try {
        // قراءة معرّف الفئة من URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryIdParam = urlParams.get('category_id');
        currentCategory = categoryIdParam ? parseInt(categoryIdParam) : null;

        let myRequest = await fetch("/api/products?limit=1000");
        let dataRequest = await myRequest.json();
        allMenuProducts = dataRequest;

        // فلترة حسب معرّف الفئة لو موجود في URL
        let filtered = currentCategory
            ? allMenuProducts.filter(p => p.Category_ID == currentCategory)
            : allMenuProducts;

        // لو all=1 في URL، اعرض كل المنتجات بدون حد
        const urlParamsCheck = new URLSearchParams(window.location.search);
        if (urlParamsCheck.get('all') === '1' || MENU_PAGE_SIZE_OVERRIDE) {
            visibleCount = MENU_PAGE_SIZE_OVERRIDE || 99999;
        } else {
            visibleCount = MENU_PAGE_SIZE;
        }

        renderMenuProducts(filtered, visibleCount);
        // انتظار حتى تكتمل عملية العرض قبل إضافة الزر
        setTimeout(() => renderLoadMoreButton(filtered), 100);
    } catch (error) {
    }
}

// ============================
// RENDER - دالة عرض المنتجات في القائمة
// ============================
function renderMenuProducts(productData, count) {
    const container = document.querySelector('.products-grid_1');
    if (!container) return;
    container.innerHTML = '';

    const toShow = productData.slice(0, count);

    toShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product');

        const oldPrice = Number(product.Price || product.price || 0);
        const discount = Number(product.Discount || product.discount || 0);
        const finalPrice = discount > 0 ? Math.max(0, oldPrice * (1 - discount / 100)) : oldPrice;

        productCard.innerHTML = `
            ${discount > 0 ? `<div class="product-discount-badge">خصم ${discount.toFixed(0)}%</div>` : ''}
            <img src="${buildProductImageSrc(product.Image)}" alt="${product.Product_Name}">
            <div class="product-info">
                <h3>${product.Product_Name}</h3>
                <div class="price">
                    ${discount > 0 ? ` <span class="price__old">${oldPrice.toFixed(2)} جنيه</span> ` : ''}
                    <span class="price__new" style="color:var(--main-color);font-weight:bold;font-family:var(--font-2)">${finalPrice.toFixed(2)} جنيه</span>
                </div>
            </div>
            <div class="button__actions">
                <button class="Product__actions">
                    <a href="/product-page?id=${product.Product_ID}">اختر الوجبة</a>
                </button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// ============================
// زر عرض المزيد
// ============================
function renderLoadMoreButton(productData) {

    // حذف الزر القديم لو موجود
    const oldBtn = document.getElementById('menu-load-more-btn');
    if (oldBtn) {
        oldBtn.remove();
    }

    if (productData.length <= visibleCount) {
        return; // مفيش مزيد
    }

    const btnWrapper = document.createElement('div');
    btnWrapper.id = 'menu-load-more-btn';
    btnWrapper.style.cssText = 'text-align:center; margin: 30px auto; padding: 10px;';

    const button = document.createElement('button');
    button.textContent = `عرض المزيد (${productData.length - visibleCount} منتج)`;
    button.style.cssText = `
        background: var(--main-color);
        color: #fff;
        border: none;
        padding: 12px 40px;
        border-radius: 25px;
        font-size: 15px;
        font-family: var(--font-1, 'Kufam', sans-serif);
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
        box-shadow: 0 4px 15px rgba(230,42,50,0.3);
    `;
    button.onmouseover = () => button.style.background = '#b71c1c';
    button.onmouseout = () => button.style.background = 'var(--main-color)';
    button.onclick = loadMoreMenuProducts;

    btnWrapper.appendChild(button);

    const categorySection = document.querySelector('.category-one');
    if (categorySection) {
        categorySection.appendChild(btnWrapper);
    } else {
        const productss = document.querySelector('.productss');
        if (productss) {
            productss.insertAdjacentElement('afterend', btnWrapper);
        } else {
        }
    }
}

function loadMoreMenuProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('category_id') || null;

    // توجيه لصفحة المنيو مع معرّف الفئة
    if (catId) {
        const newUrl = `/menu?category_id=${catId}&all=1`;
        window.location.href = newUrl;
    } else {
        const newUrl = `/menu?all=1`;
        window.location.href = newUrl;
    }
}

// تحميل كل المنتجات لو URL فيه all=1
let MENU_PAGE_SIZE_OVERRIDE = null;

(function checkShowAll() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('all') === '1') {
        MENU_PAGE_SIZE_OVERRIDE = 9999;
    }
})();

// تعديل apiass لاستخدام override
const _origApiass = apiass;

// جلب المنتجات عند التحميل الأولي
apiass();

// ============================
// RENDER - دالة عرض المنتجات (للتوافق مع الكود القديم)
// ============================
function renderProductsToContainer(productData, containerSelector, quantityLabel = "متوفر") {
    const container = containerSelector.startsWith('#') 
        ? document.getElementById(containerSelector.slice(1))
        : document.querySelector(containerSelector);
    
    if (!container) {
        return;
    }

    container.innerHTML = '';

    productData.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product");

        const oldPrice = Number(product.Price || product.price || 0);
        const discount = Number(product.Discount || product.discount || 0);
        const finalPrice = discount > 0 ? Math.max(0, oldPrice * (1 - discount / 100)) : oldPrice;

        productCard.setAttribute('data-product-price', finalPrice.toFixed(2));
        productCard.setAttribute('data-original-price', oldPrice.toFixed(2));

        productCard.innerHTML = `
            <img src="${buildProductImageSrc(product.Image)}" alt="${product.Product_Name}">
            <div class="product-info">
                <h3>${product.Product_Name}</h3>
                <div class="points">${product.Quantity} ${quantityLabel}</div>
                <div class="price">
                    ${discount > 0 ? `<span class="old-price" style="text-decoration:line-through;color:#999;margin-right:8px">${oldPrice.toFixed(2)} جنيه</span>` : ''}
                    <span class="final-price" style="color:${discount>0? '#e62a32':'#000'};font-weight:700">${finalPrice.toFixed(2)} جنيه</span>
                </div>
            </div>
            <div class="button__actions">
                <button class="Product__actions">
                    <a href="/product-page?id=${product.Product_ID}">اختر الوجبة</a>
                </button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// ============================
// LEGACY FUNCTIONS (للتوافق مع الكود القديم)
// ============================
/**
 * دالة قديمة - تستدعي الدالة الجديدة
 * @deprecated استخدم renderProductsToContainer بدلاً منها
 */
function menu(productData) {
    renderProductsToContainer(productData, ".products-grid_1", "كمية");
}

/**
 * دالة قديمة - تستدعي الدالة الجديدة
 * @deprecated استخدم renderProductsToContainer بدلاً منها
 */
function displayAllProducts(productData) {
    renderProductsToContainer(productData, "#allProductsGrid", "متوفر");
}

// ============================
// NAVIGATION - إدارة القوائم
// ============================
// التعامل مع قائمة الفئات - إظهار/إخفاء القائمة الجانبية
const navMenus = document.querySelector(".nav_menus");
const contentOfSubPages = document.querySelector(".content-of-sub-pages");

navMenus?.addEventListener('click', () => {
    if (contentOfSubPages) {
        contentOfSubPages.classList.toggle("nav_menus_list");
    }
});

// ============================
// SCROLL - زر العودة للأعلى
// ============================
const scrollUps = () => {
    const scrollUp = document.getElementById('scroll-up');
    if (scrollUp) {
        if (window.scrollY >= 350) {
            scrollUp.classList.add('Show-scroll');
        } else {
            scrollUp.classList.remove('Show-scroll');
        }
    }
};

window.addEventListener('scroll', scrollUps);

// ============================
// ملء الفئات في الـ navbar وعرض عنوان الفئة
// ============================
async function buildCategoryNav() {
    try {
        const res = await fetch('/admin/api/categories');

        const response = await res.json();
        // جلب التصنيفات من جدول التصنيفات مباشرة
        const categoriesRaw = response.data || response.categories || (Array.isArray(response) ? response : []);

        const nav = document.getElementById('menu-categories-nav');
        if (nav && categoriesRaw.length) {
            // امسح الروابط القديمة غير الأساسية
            const existingLinks = nav.querySelectorAll('a.cat-dyn');
            existingLinks.forEach(l => l.remove());

            categoriesRaw.forEach(cat => {
                const categoryId = cat.Category_ID || cat.category_id || cat.id;
                const categoryName = cat.Category_Name || cat.category_name || cat.name;
                
                if (categoryId && categoryName) {
                    const a = document.createElement('a');
                    a.href = `/menu?category_id=${categoryId}`;
                    a.className = 'cat-dyn';
                    a.innerHTML = `<span>${categoryName}</span>`;
                    nav.appendChild(a);
                }
            });
        }

        // عرض عنوان الفئة المختارة
        const urlParams = new URLSearchParams(window.location.search);
        const activeCatId = urlParams.get('category_id');
        const showAll   = urlParams.get('all') === '1';
        const titleBar  = document.getElementById('category-title-bar');
        const titleText = document.getElementById('category-title-text');

        if (activeCatId && titleBar && titleText) {
            // البحث عن اسم الفئة من بيانات الفئات
            const activeCatRaw = categoriesRaw.find(c => 
                (c.Category_ID || c.category_id || c.id) == activeCatId
            );
            const activeCatName = activeCatRaw 
                ? (activeCatRaw.Category_Name || activeCatRaw.category_name || activeCatRaw.name)
                : activeCatId;

            titleText.textContent = `${activeCatName}${showAll ? ' — جميع المنتجات' : ''}`;
            titleBar.style.display = 'block';

            // تمييز الرابط النشط
            nav?.querySelectorAll('a').forEach(a => {
                if (a.href.includes(`category_id=${activeCatId}`)) {
                    a.style.fontWeight = 'bold';
                    a.style.color = 'var(--main-color,#e62a32)';
                }
            });
        }
    } catch (e) {
    }
}

// لو URL فيه all=1، اعرض كل المنتجات بدون حد
(function handleShowAll() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('all') === '1') {
        // إلغاء حد المنتجات المعروضة
        window._menuShowAll = true;
    }
})();

buildCategoryNav();