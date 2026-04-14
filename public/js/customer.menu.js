// ============================
// API - جلب البيانات
// ============================
// جلب المنتجات من الخادم وعرضها في الصفحة
async function apiass() {
    try {
        let myRequest = await fetch("/api/products?limit=1000");
        let dataRequest = await myRequest.json();
        console.log('✅ تم جلب المنتجات:', dataRequest.length, 'منتج');
        
        // عرض المنتجات في جميع الحاويات
        renderProductsToContainer(dataRequest, ".products-grid_1", "كمية");
        renderProductsToContainer(dataRequest, "#allProductsGrid", "متوفر");
    } catch (error) {
        console.error("خطأ في جلب المنتجات:", error);
    }
}

// تحديث المنتجات كل 5 ثواني
setInterval(apiass, 5000);

// جلب المنتجات عند التحميل الأولي
apiass();

// ============================
// RENDER - دالة عرض المنتجات
// ============================
/**
 * دالة موحدة لعرض المنتجات في أي حاوية
 * @param {Array} productData - مصفوفة المنتجات
 * @param {String} containerSelector - محدد الـ CSS للحاوية (class أو id)
 * @param {String} quantityLabel - تسمية الكمية (اختياري)
 */
function renderProductsToContainer(productData, containerSelector, quantityLabel = "متوفر") {
    const container = containerSelector.startsWith('#') 
        ? document.getElementById(containerSelector.slice(1))
        : document.querySelector(containerSelector);
    
    if (!container) {
        console.warn(`⚠️ الحاوية '${containerSelector}' غير موجودة`);
        return;
    }

    // مسح المنتجات القديمة
    container.innerHTML = '';

    // عرض المنتجات الجديدة
    productData.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product");

        const oldPrice = Number(product.Price || product.price || 0);
        const discount = Number(product.Discount || product.discount || 0);
        const finalPrice = discount > 0 ? Math.max(0, oldPrice * (1 - discount / 100)) : oldPrice;

        productCard.setAttribute('data-product-price', finalPrice.toFixed(2));
        productCard.setAttribute('data-original-price', oldPrice.toFixed(2));

        productCard.innerHTML = `
            <img src="/images/products/${product.Image}" alt="${product.Product_Name}">
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
                    <a href="product-page?id=${product.Product_ID}">اختر الخيارات</a>
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
// DARK MODE - تبديل الوضع الليلي
// ============================
const themButton = document.getElementById('theme-button');
const darkTheme = 'dark-theme';
const iconTheme = 'ri-sun-line';

// الحصول على الوضع المحفوظ من localStorage
const selectedTheme = localStorage.getItem('selected-theme');
const selectedIcon = localStorage.getItem('selected-icon');

// دوال الحصول على الحالة الحالية
const getCurrentTheme = () => 
    document.body.classList.contains(darkTheme) ? 'dark' : 'light';

const getCurrentIcon = () => 
    themButton.classList.contains(iconTheme) ? 'ri-moon-line' : 'ri-sun-line';

// تطبيق الوضع المحفوظ عند تحميل الصفحة
if (selectedTheme) {
    document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme);
    themButton?.classList[selectedIcon === 'ri-moon-line' ? 'add' : 'remove'](iconTheme);
}

// الاستماع لنقرات زر تبديل الوضع
themButton?.addEventListener('click', () => {
    document.body.classList.toggle(darkTheme);
    themButton.classList.toggle(iconTheme);

    localStorage.setItem('selected-theme', getCurrentTheme());
    localStorage.setItem('selected-icon', getCurrentIcon());
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
