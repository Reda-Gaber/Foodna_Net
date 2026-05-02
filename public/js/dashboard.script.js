// =====================================================
// STATE MANAGEMENT
// =====================================================
const state = {
    products: [],
    customers: [],
    orders: [],
    suppliers: [],
    currentSection: 'dashboard',
    currentPeriod: 'daily'
};

// =====================================================
// SAMPLE DATA - Replace with actual API calls
// =====================================================
const sampleProducts = [
    { id: 1, name: 'سماعة بلوتوث', category: 'الإلكترونيات', price: 79.99, stock: 45, status: 'نشط' },
    { id: 2, name: 'ساعة يد ذكية', category: 'الإلكترونيات', price: 199.99, stock: 23, status: 'نشط' },
    { id: 3, name: 'ستاند للاب توب', category: 'الملحقات', price: 34.99, stock: 8, status: 'نشط' },
    { id: 4, name: 'كيبورد ميكانيكي', category: 'الإلكترونيات', price: 129.99, stock: 67, status: 'نشط' },
    { id: 5, name: 'سلك USB', category: 'الملحقات', price: 12.99, stock: 3, status: 'نشط' }
];

const sampleCustomers = [
    { id: 1, name: 'أحمد علي', email: 'ahmad@example.com', phone: '555-0101', orders: 8, totalSpent: 1245.50 },
    { id: 2, name: 'فاطمة محمد', email: 'fatima@example.com', phone: '555-0102', orders: 12, totalSpent: 2890.75 },
    { id: 3, name: 'محمود سالم', email: 'mahmoud@example.com', phone: '555-0103', orders: 5, totalSpent: 678.90 },
    { id: 4, name: 'أميرة حسن', email: 'amira@example.com', phone: '555-0104', orders: 15, totalSpent: 3456.20 }
];

const sampleOrders = [
    { id: 1001, customer: 'John Doe', date: '2025-11-01', total: 159.99, status: 'delivered' },
    { id: 1002, customer: 'Jane Smith', date: '2025-11-02', total: 299.50, status: 'shipped' },
    { id: 1003, customer: 'Bob Johnson', date: '2025-11-03', total: 89.99, status: 'pending' },
    { id: 1004, customer: 'Alice Brown', date: '2025-11-03', total: 445.75, status: 'shipped' },
    { id: 1005, customer: 'John Doe', date: '2025-11-04', total: 129.99, status: 'pending' }
];

const sampleSuppliers = [
    { id: 1, name: 'شركة تيك سابلاي', contact: 'ميشائيل تشن', email: 'michael@techsupply.com', phone: '555-2001', products: 45 },
    { id: 2, name: 'الإلكترونيات العالمية', contact: 'ساره ويليامز', email: 'sarah@globalelec.com', phone: '555-2002', products: 78 },
    { id: 3, name: 'مركز الملحقات', contact: 'دافيد مارتينيز', email: 'david@accessoryhub.com', phone: '555-2003', products: 32 }
];

// =====================================================
// INITIALIZATION
// =====================================================
// Helper: load SweetAlert2 (Swal) once when needed
let _swalLoader = null;
function ensureSwal() {
    if (window.Swal) return Promise.resolve(window.Swal);
    if (_swalLoader) return _swalLoader;
    _swalLoader = new Promise((resolve, reject) => {
        // Try local copy first (CSP-friendly), then fall back to cdnjs
        const localSrc = '/js/libs/sweetalert2.min.js';
        const cdnSrc = 'https://cdnjs.cloudflare.com/ajax/libs/limonte-sweetalert2/11.7.27/sweetalert2.min.js';

        const loadScript = (src, onload, onerror) => {
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = onload;
            s.onerror = onerror;
            document.head.appendChild(s);
            return s;
        };

        loadScript(localSrc, () => {
            // If local file loaded but did not define Swal (e.g. server returned HTML 404), try CDN
            if (window.Swal) return resolve(window.Swal);
            // try CDN
            loadScript(cdnSrc, () => {
                if (window.Swal) return resolve(window.Swal);
                return reject(new Error('SweetAlert2 loaded but `Swal` not found'));
            }, () => reject(new Error('Failed to load SweetAlert2 from CDN after local load')));
        }, () => {
            // local failed to load (network error), try CDN
            loadScript(cdnSrc, () => {
                if (window.Swal) return resolve(window.Swal);
                return reject(new Error('SweetAlert2 loaded from CDN but `Swal` not found'));
            }, () => reject(new Error('Failed to load SweetAlert2 from local and CDN')));
        });
    });
    return _swalLoader;
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setupEventListeners();
});

// تحميل البيانات من API
async function loadDashboardData() {
    try {
        // جلب الإحصائيات
        const statsRes = await fetch('/admin/api/stats', { credentials: 'include' });
        if (!statsRes.ok) {
        }
        let stats = {};
        try {
            stats = await statsRes.json();
        } catch (e) {
        }

        // تحديث إحصائيات الداشبورد (باختبارات دفاعية)
        const revenueVal = (stats && typeof stats.revenue === 'number') ? stats.revenue : 0;
        const ordersVal = (stats && Number.isFinite(Number(stats.orders))) ? Number(stats.orders) : 0;
        const productsVal = (stats && Number.isFinite(Number(stats.products))) ? Number(stats.products) : 0;
        const customersVal = (stats && Number.isFinite(Number(stats.customers))) ? Number(stats.customers) : 0;

        document.getElementById('totalRevenue').textContent = (revenueVal).toFixed(2);
        document.getElementById('totalOrders').textContent = ordersVal;
        document.getElementById('totalProducts').textContent = productsVal;
        document.getElementById('totalCustomers').textContent = customersVal;
        
        // جلب وتحديث البيانات
        await loadProducts();
        await loadCustomers();
        await loadOrders();
        
        renderDashboard();
        renderProducts();
        renderCustomers();
        renderOrders();
        renderInventory();
    } catch (error) {
    }
}

// جلب المنتجات
async function loadProducts() {
    try {
        const res = await fetch('/api/products?limit=100');
        const products = await res.json();
        state.products = products.map((p, idx) => ({
            id: p.Product_ID || idx + 1,
            name: p.Product_Name,
            category: p.Category,
            category_id: p.Category_ID,
            price: (() => { const v = p.Price ?? p.price; const n = parseFloat(v); return Number.isFinite(n) ? n : 0; })(),
            stock: (p.Quantity_Available ?? p.Quantity ?? p.stock) ? parseInt(p.Quantity_Available ?? p.Quantity ?? p.stock) : 0,
            status: 'نشط'
        }));
    } catch (error) {
        state.products = [];
    }
}

// جلب العملاء
async function loadCustomers() {
    try {
        const res = await fetch('/admin/api/customers');

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const customers = await res.json();

        if (!Array.isArray(customers)) {
            console.error('API returned non-array:', customers);
            state.customers = [];
            return;
        }

        state.customers = customers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            orders: c.orders || 0,
            totalSpent: parseFloat(c.totalSpent) || 0
        }));
    } catch (error) {
        console.error('Error loading customers:', error);
        state.customers = [];
    }
}

// جلب الطلبات
async function loadOrders() {
    try {
        const res = await fetch('/admin/api/orders');
        const orders = await res.json();
        state.orders = orders.map(o => ({
            id: o.id,
            customer: o.customer || 'عميل غير معروف',
            date: o.date,
            total: parseFloat(o.total),
            status: getOrderStatusClass(o.status)
        }));
    } catch (error) {
        state.orders = [];
    }
}

// تحويل حالة الطلب للكلاس المناسب
function getOrderStatusClass(status) {
    const statusMap = {
        'قيد الانتظار': 'pending',
        'مرسل': 'shipped',
        'تم التسليم': 'delivered',
        'ملغى': 'cancelled'
    };
    return statusMap[status] || status.toLowerCase();
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('data-section');
            navigateToSection(section);
        });
    });

    document.getElementById('mobileToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });

    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
    document.getElementById('addSupplierBtn').addEventListener('click', () => openSupplierModal());

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentPeriod = e.target.getAttribute('data-period');
            renderRevenueChart();
        });
    });
}

// =====================================================
// NAVIGATION
// =====================================================
function navigateToSection(section) {
    state.currentSection = section;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === section) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) sectionEl.classList.add('active');

    // رندر تلقائي للقسم عند التنقل
    const sectionLoaders = {
        customers:  () => renderCustomers(),
        orders:     () => renderOrders(),
        products:   () => renderProducts(),
        categories: () => loadCategories(),
        offers:     () => loadOffers(),
        coupons:    () => loadCoupons(),
        inventory:  () => renderInventory()
    };

    if (sectionLoaders[section]) {
        try { sectionLoaders[section](); } catch (e) { }
    }

    const titles = {
        dashboard:  'لوحة التحكم',
        products:   'إدارة المنتجات',
        customers:  'إدارة العملاء',
        orders:     'إدارة الطلبات',
        categories: 'إدارة التصنيفات',
        offers:     'إدارة العروض',
        coupons:    'إدارة الكوبونات',
        suppliers:  'إدارة الموردين',
        inventory:  'إدارة المخزون'
    };

    document.getElementById('pageTitle').textContent = titles[section] || 'لوحة التحكم';

    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

// =====================================================
// DASHBOARD RENDERING
// =====================================================
function renderDashboard() {
    const totalRevenue = state.orders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('totalRevenue').textContent = `جنيه. ${totalRevenue.toFixed(2)}`;
    document.getElementById('totalOrders').textContent = state.orders.length;
    document.getElementById('totalProducts').textContent = state.products.length;
    document.getElementById('totalCustomers').textContent = state.customers.length;

    renderRecentOrders();
    renderRevenueChart();
}

function renderRecentOrders() {
    const recentOrders = state.orders.slice(0, 5);
    const container = document.getElementById('recentOrdersList');

    container.innerHTML = recentOrders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>الطلب #${order.id}</h4>
                <p>${order.customer} - ${order.date}</p>
            </div>
            <div class="order-amount">جنيه ${order.total.toFixed(2)}</div>
        </div>
    `).join('');
}

function renderRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    const ctx = canvas.getContext('2d');

    canvas.width = canvas.offsetWidth;
    canvas.height = 300;

    const data = generateRevenueData(state.currentPeriod);

    const max = Math.max(...data.values);
    const padding = 40;
    const chartHeight = canvas.height - padding * 2;
    const chartWidth = canvas.width - padding * 2;
    const barWidth = chartWidth / data.values.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }

    ctx.fillStyle = '#2563eb';
    data.values.forEach((value, index) => {
        const barHeight = (value / max) * chartHeight;
        const x = padding + (barWidth * index) + (barWidth * 0.2);
        const y = canvas.height - padding - barHeight;
        const width = barWidth * 0.6;

        const gradient = ctx.createLinearGradient(x, y, x, canvas.height - padding);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#2563eb');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, barHeight);
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    data.labels.forEach((label, index) => {
        const x = padding + (barWidth * index) + (barWidth / 2);
        const y = canvas.height - padding + 20;
        ctx.fillText(label, x, y);
    });

    for (let i = 0; i <= 5; i++) {
        const value = Math.round((max / 5) * (5 - i));
        const y = padding + (chartHeight / 5) * i;
        ctx.textAlign = 'right';
        ctx.fillText(`$${value}`, padding - 10, y + 4);
    }
}

function generateRevenueData(period) {
    if (period === 'daily') {
        return {
            labels: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
            values: [1250, 1890, 1450, 2100, 1780, 2340, 1920]
        };
    } else if (period === 'weekly') {
        return {
            labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'],
            values: [8500, 9200, 7800, 10500]
        };
    } else {
        return {
            labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
            values: [35000, 38000, 42000, 39000, 45000, 48000]
        };
    }
}

// =====================================================
// PRODUCTS MANAGEMENT
// =====================================================
// Helper: normalize product object from API to internal shape
function normalizeProduct(item) {
    return {
        id: item.Product_ID || item.id || item.ID || null,
        name: item.Product_Name || item.name || item.title || '',
        description: item.Description || item.description || '',
        category: item.Category || item.category || '',
            price: (function() { const v = item.Price ?? item.price; const n = parseFloat(v); return Number.isFinite(n) ? n : 0; })(),
            discount: (function() { const v = item.Discount ?? item.discount; const n = parseFloat(v); return Number.isFinite(n) ? n : 0; })(),
            stock: (function() { const v = item.Quantity_Available ?? item.Quantity ?? item.stock; const n = parseInt(v); return Number.isFinite(n) ? n : 0; })(),
        status: item.status || item.Status || 'نشط',
        image: item.Images || item.image || item.imageFilename || null
    };
}
// =====================================================
// PRODUCTS MANAGEMENT
// =====================================================

function renderProducts() {
    const tbody = document.getElementById('productsTableBody');

    tbody.innerHTML = state.products.map(product => {
        const priceNum = Number(product.price);
        const priceDisplay = Number.isFinite(priceNum) ? priceNum.toFixed(2) : '0.00';
        const discountNum = Number(product.discount || 0);
        const discountDisplay = Number.isFinite(discountNum) ? discountNum.toFixed(2) : '0.00';
        const safeStock = Number.isFinite(Number(product.stock)) ? product.stock : 0;
        return `
        <tr>
            <td class="important">${product.id}</td>
            <td class="important">${product.name}</td>
            <td class="secondary">${product.category}</td>
            <td class="important">جنيه ${priceDisplay}</td>
            <td class="secondary">${discountDisplay}%</td>
            <td class="secondary">${safeStock}</td>
            <td class="secondary"><span class="status-badge ${product.status}">${product.status}</span></td>
            <td class="actions">
                <div class="action-buttons">
                    <button class="action-btn edit" data-product-id="${product.id}" data-action="edit">تعديل</button>
                    <button class="action-btn delete" data-product-id="${product.id}" data-action="delete">حذف</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    
    // ربط أحداث الأزرار
    attachProductActionListeners();
}

/**
 * ربط أحداث أزرار تعديل وحذف المنتجات
 */
function attachProductActionListeners() {
    const tbody = document.getElementById('productsTableBody');
    // Ensure we only attach the listener once to prevent duplicated handlers
    if (tbody._hasProductListener) return;

    tbody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.action-btn[data-action="edit"]');
        const deleteBtn = e.target.closest('.action-btn[data-action="delete"]');

        if (editBtn) {
            const productId = parseInt(editBtn.getAttribute('data-product-id'));
            editProduct(productId);
            return;
        }

        if (deleteBtn) {
            const productId = parseInt(deleteBtn.getAttribute('data-product-id'));
            deleteProduct(productId);
        }
    });

    tbody._hasProductListener = true;
}

fetch('/api/products')
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {

        // تأكد من أن البيانات تطابق الهيكل المتوقع
        state.products = data.map(item => ({
            id: item.Product_ID || item.id,
            name: item.Product_Name || item.name,
            description: item.Description || item.description,
            category: item.Category || item.category,
            price: (() => { const v = item.Price ?? item.price; const n = parseFloat(v); return Number.isFinite(n) ? n : 0; })(),
            stock: parseInt(item.Quantity) || 0,
            status: item.status || 'active',
            image: item.Images || "Null"
        }));

        renderProducts(); // الآن يمكن استدعاؤها
        renderDashboard();
        renderInventory();
    })
    .catch(error => {
        // في حالة الفشل، استخدم البيانات النموذجية
        state.products = [...sampleProducts];
        renderProducts();
        renderDashboard();
        renderInventory();
    });

async function openProductModal(productId = null) {
    const product = productId ? state.products.find(p => p.id === productId) : null;
    const isEdit = !!product;

    // جلب الفئات من API
    let categories = [];
    try {
        const res = await fetch('/admin/api/categories');
        if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
        
        const response = await res.json();
        
        // API يرجع البيانات داخل response.data
        if (response.data && Array.isArray(response.data)) {
            categories = response.data;
        } else if (Array.isArray(response)) {
            categories = response;
        } else if (response.categories && Array.isArray(response.categories)) {
            categories = response.categories;
        }
    } catch (err) {
        categories = [];
    }

    // بناء خيارات القائمة - استخدام category_id كقيمة و category_name كعنوان
    const categoryOptions = categories.map(cat => {
        const categoryId = cat.Category_ID || cat.id;
        const categoryName = cat.Category_Name || cat.category_name || cat.name;
        const isSelected = product?.category_id === categoryId ? 'selected' : '';
        return `<option value="${categoryId}" data-name="${categoryName}">${categoryName}</option>`;
    }).join('');

    const modalTitle = isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد';
    const modalBody = `
        <form id="productForm" enctype="multipart/form-data">
            <input type="hidden" name="id" value="${product?.id || ''}">

            <div class="form-group">
                <label for="productName">اسم المنتج</label>
                <input type="text" id="productName" name="name" value="${product?.name || ''}" required>
            </div>

            <div class="form-group">
                <label for="description">الوصف</label>
                <input type="text" id="description" name="description" value="${product?.description || ''}">
            </div>

            <div class="form-group">
                <label for="productCategory">الفئة</label>
                <select id="productCategory" name="category" required>
                    <option value="">اختر فئة...</option>
                    ${categoryOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="productPrice">السعر</label>
                <input type="number" step="0.01" id="productPrice" name="price" value="${product?.price || ''}" required>
            </div>

            <div class="form-group">
                <label for="productDiscount">خصم (٪)</label>
                <input type="number" step="0.01" id="productDiscount" name="discount" value="${product?.discount ?? ''}" min="0" max="100">
            </div>

            <div class="form-group">
                <label for="productStock">الكمية</label>
                <input type="number" id="productStock" name="quantity" value="${product?.stock || ''}" required>
            </div>

            <div class="form-group">
                <label>صورة المنتج</label>
                <button type="button" id="selectImageBtn" class="btn btn-outline-primary btn-sm">اختر الصورة</button>
                <input type="file" id="productImage" name="image" accept="image/*" style="display:none;" ${!isEdit ? '' : ''}>
                <p id="imageName" class="text-muted mt-1" style="font-size:0.9em;"></p>
               ${product?.image ? `
    <div class="mt-2">
        <img src="/images/${product.image}" width="80" alt="الحالي">
        <br><small>الصورة الحالية</small>
    </div>
` : ''}
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary btn-close-modal">إلغاء</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'تحديث' : 'إضافة'} منتج</button>
            </div>
        </form>
    `;

    openModal(modalTitle, modalBody);

    // إضافة event listener لزر إلغاء
    document.querySelector('.btn-close-modal').addEventListener('click', closeModal);

    // === Events بعد تحميل الـ Modal ===
    setTimeout(() => {
        const form = document.getElementById('productForm');
        const fileInput = document.getElementById('productImage');
        const selectBtn = document.getElementById('selectImageBtn');
        const imageName = document.getElementById('imageName');

        // فتح ملفات الجهاز
        if (selectBtn) selectBtn.onclick = () => fileInput.click();

        // إظهار اسم الصورة
        if (fileInput) {
            fileInput.onchange = () => {
                const file = fileInput.files[0];
                imageName.textContent = file ? `تم الاختيار: ${file.name}` : '';
            };
        }

        // إرسال البيانات للـ Backend
        form.onsubmit = async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري الحفظ...';

            // helper: safe JSON parse
            const safeJson = async (res) => {
                try {
                    return await res.json();
                } catch (err) {
                    return { success: false, message: res.statusText || 'Unexpected server response' };
                }
            };

            // helper: get Swal or fallback to window.alert
            const getSwalOrFallback = async () => {
                try {
                    return await ensureSwal();
                } catch (loadErr) {
                    return null;
                }
            };

            // Helper to finalize UI after operation
            const finalize = (success) => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                if (success) {
                    const modal = document.getElementById('modal');
                    if (modal) modal.classList.remove('active');
                }
            };

            try {
                const swal = await getSwalOrFallback();

                if (!isEdit) {
                    // CREATE flow
                    const formData = new FormData(form);
                    const response = await fetch('/admin/products/create', { method: 'POST', body: formData });
                    const result = await safeJson(response);

                    if (response.ok && (result.success || response.status === 201)) {
                        if (result.product) state.products.unshift(normalizeProduct(result.product));
                        else await loadDashboardData();
                        renderProducts(); renderDashboard(); renderInventory();
                        // Close modal immediately, then show confirmation
                        finalize(true);
                        if (swal) swal.fire({ icon: 'success', title: 'تم بنجاح ✅', text: result.message || 'تم إضافة المنتج', timer: 1500, showConfirmButton: false });
                        else alert(result.message || 'تم إضافة المنتج');
                    } else {
                        const msg = result.message || 'حدث خطأ في إضافة المنتج';
                        if (swal) swal.fire({ icon: 'error', title: 'خطأ', text: msg });
                        else alert(msg);
                        finalize(false);
                    }
                    return;
                }

                // EDIT flow - send only changed fields
                const original = product;
                const fd = new FormData();
                fd.append('id', original.id);

                let changed = false;

                const name = document.getElementById('productName').value.trim();
                if (name !== (original.name || '')) { fd.append('name', name); changed = true; }

                const description = document.getElementById('description').value.trim();
                if (description !== (original.description || '')) { fd.append('description', description); changed = true; }

                const categoryVal = document.getElementById('productCategory');
                const categoryId = categoryVal.value;
                const categoryName = categoryVal.options[categoryVal.selectedIndex]?.dataset?.name || '';
                if (categoryId !== (original.category_id || '')) { 
                    fd.append('category_id', categoryId); 
                    fd.append('category', categoryName);
                    changed = true; 
                }

                const priceVal = document.getElementById('productPrice').value;
                if (priceVal !== '') {
                    const priceNum = parseFloat(priceVal);
                    if (!Number.isNaN(priceNum) && priceNum !== Number(original.price)) { fd.append('price', priceNum); changed = true; }
                }

                const discountVal = document.getElementById('productDiscount').value;
                if (discountVal !== '' || original.discount) {
                    const discountNum = parseFloat(discountVal || '0');
                    const originalDiscount = Number(original.discount ?? 0);
                    if (!Number.isNaN(discountNum) && discountNum !== originalDiscount) { fd.append('discount', discountNum); changed = true; }
                }

                const qtyVal = document.getElementById('productStock').value;
                if (qtyVal !== '') {
                    const qtyNum = parseInt(qtyVal);
                    if (!Number.isNaN(qtyNum) && qtyNum !== Number(original.stock)) { fd.append('quantity', qtyNum); changed = true; }
                }

                if (fileInput && fileInput.files && fileInput.files[0]) {
                    fd.append('image', fileInput.files[0]);
                    changed = true;
                }

                if (!changed) {
                    if (swal) swal.fire({ icon: 'info', title: 'لم يتم تغيير أي شيء', text: 'لم تقم بتعديل أي حقل.' });
                    else alert('لم تقم بتعديل أي حقل.');
                    finalize(false);
                    return;
                }

                const response = await fetch('/admin/products/update', { method: 'POST', body: fd });
                const result = await safeJson(response);

                if (response.ok && (result.success || response.status === 200)) {
                    const idx = state.products.findIndex(p => p.id === original.id);
                    if (idx !== -1) {
                        if (result.product) state.products[idx] = normalizeProduct(result.product);
                        else {
                            const updated = { ...state.products[idx] };
                            if (fd.has('name')) updated.name = name;
                            if (fd.has('description')) updated.description = description;
                            if (fd.has('category')) updated.category = categoryVal;
                            if (fd.has('price')) updated.price = parseFloat(document.getElementById('productPrice').value) || updated.price;
                            if (fd.has('discount')) updated.discount = parseFloat(document.getElementById('productDiscount').value) || updated.discount;
                            if (fd.has('quantity')) updated.stock = parseInt(document.getElementById('productStock').value) || updated.stock;
                            if (fd.has('image') && result.image) updated.image = result.image;
                            state.products[idx] = updated;
                        }
                        renderProducts(); renderDashboard(); renderInventory();
                        // Close modal immediately, then show confirmation
                        finalize(true);
                        if (swal) swal.fire({ icon: 'success', title: 'تم التحديث', text: result.message || 'تم تحديث المنتج بنجاح', timer: 1400, showConfirmButton: false });
                        else alert(result.message || 'تم تحديث المنتج');
                    } else {
                        await loadDashboardData(); renderProducts();
                        // Close modal immediately, then show confirmation
                        finalize(true);
                        if (swal) swal.fire({ icon: 'success', title: 'تم التحديث', text: result.message || 'تم تحديث المنتج', timer: 1400, showConfirmButton: false });
                        else alert(result.message || 'تم تحديث المنتج');
                    }
                } else {
                    const msg = result.message || 'فشل في تحديث المنتج';
                    if (swal) swal.fire({ icon: 'error', title: 'خطأ', text: msg });
                    else alert(msg);
                    finalize(false);
                }
            } catch (err) {
                const swal = await getSwalOrFallback();
                if (swal) swal.fire({ icon: 'error', title: 'خطأ', text: 'حدث خطأ في الاتصال بالخادم: ' + (err.message || err) });
                else alert('حدث خطأ في الاتصال بالخادم: ' + (err.message || err));
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        };
    }, 100);
}
function editProduct(id) {
    openProductModal(id);
}

// حذف منتج
async function deleteProduct(id) {
    // Confirmation before deleting
    const swal = await ensureSwal();
    const { isConfirmed } = await swal.fire({
        title: 'هل أنت متأكد؟',
        text: "سيتم حذف هذا المنتج نهائياً!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذفه',
        cancelButtonText: 'إلغاء'
    });

    if (!isConfirmed) return;

    try {
        
        const response = await fetch(`/admin/products/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        let result;
        try {
            result = await response.json();
        } catch (parseErr) {
            throw new Error('خطأ في معالجة الرد من الخادم');
        }

        if (response.ok && result.success) {
            state.products = state.products.filter(p => p.id !== id);
            renderProducts();
            renderDashboard();
            renderInventory();

            {
                const swal2 = await ensureSwal();
                swal2.fire({
                    icon: 'success',
                    title: 'تم الحذف',
                    text: result.message || 'تم حذف المنتج بنجاح',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } else {
            {
                const swal2 = await ensureSwal();
                swal2.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: result.message || 'حدث خطأ في حذف المنتج'
                });
            }
        }
    } catch (err) {
        {
            const swal2 = await ensureSwal();
            swal2.fire({
                icon: 'error',
                title: 'خطأ',
                text: err.message || 'خطأ في الاتصال بالخادم'
            });
        }
    }
}


// =====================================================
// CUSTOMERS MANAGEMENT
// =====================================================
function renderCustomers() {
    const tbody = document.getElementById('customersTableBody');

    if (!tbody) {
        return;
    }
    
    if (state.customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">لا توجد عملاء حالياً</td></tr>';
        return;
    }

    tbody.innerHTML = state.customers.map(customer => `
        <tr>
            <td class="important">${customer.id}</td>
            <td class="important">${customer.name}</td>
            <td class="secondary">${customer.email}</td>
            <td class="secondary">${customer.phone}</td>
            <td class="secondary"><strong>${customer.orders}</strong></td>
            <td class="secondary">جنيه ${customer.totalSpent.toFixed(2)}</td>
            <td class="actions">
                <div class="action-buttons">
                    <button class="action-btn delete btn-delete-customer" data-customer-id="${customer.id}" style="font-size: 12px; padding: 5px 10px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة event listeners للأزرار بعد تحديث DOM
    attachCustomerDeleteListeners();
}

function attachCustomerDeleteListeners() {
    const deleteButtons = document.querySelectorAll('.btn-delete-customer');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const customerId = parseInt(btn.getAttribute('data-customer-id'));
            deleteCustomer(customerId);
        });
    });
}

function attachOrderFilterActionListeners() {
    const updateButtons = document.querySelectorAll('.btn-update-order-filter');
    updateButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const orderId = parseInt(btn.getAttribute('data-order-id'));
            updateOrderStatus(orderId);
        });
    });
}

function editCustomer(id) {
    const customer = state.customers.find(c => c.id === id);

    const modalBody = `
        <form id="customerForm">
            <div class="form-group">
                <label for="customerName">Name</label>
                <input type="text" id="customerName" value="${customer.name}" required>
            </div>
            <div class="form-group">
                <label for="customerEmail">Email</label>
                <input type="email" id="customerEmail" value="${customer.email}" required>
            </div>
            <div class="form-group">
                <label for="customerPhone">Phone</label>
                <input type="tel" id="customerPhone" value="${customer.phone}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary btn-close-modal-customer">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Customer</button>
            </div>
        </form>
    `;

    openModal('Edit Customer', modalBody);

    // إضافة event listener لزر إلغاء
    document.querySelector('.btn-close-modal-customer').addEventListener('click', closeModal);

    document.getElementById('customerForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const index = state.customers.findIndex(c => c.id === id);
        state.customers[index] = {
            ...state.customers[index],
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value
        };

        renderCustomers();
        closeModal();
    });
}

function deleteCustomer(id) {
    
    const customer = state.customers.find(c => c.id === id);
    
    if (!customer) {
        alert('العميل غير موجود');
        return;
    }
    
    // استخدام SweetAlert إذا كان متاحاً، وإلا استخدام confirm
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: `هل أنت متأكد من حذف العميل "${customer.name}"؟ سيتم حذف جميع طلباته أيضاً.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`/admin/api/customers/${id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        
                        state.customers = state.customers.filter(c => c.id !== id);
                        renderCustomers();
                        renderDashboard();
                        
                        Swal.fire({
                            title: 'تم بنجاح ✓',
                            text: 'تم حذف العميل بنجاح',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    } else {
                        const errorData = await res.json().catch(() => ({ error: 'خطأ غير معروف' }));
                        
                        Swal.fire({
                            title: 'خطأ',
                            text: errorData.error || errorData.message || 'فشل حذف العميل',
                            icon: 'error'
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        title: 'خطأ',
                        text: 'حدث خطأ في الاتصال: ' + error.message,
                        icon: 'error'
                    });
                }
            }
        });
    } else {
        // fallback إلى confirm
        if (confirm(`هل أنت متأكد من حذف العميل "${customer.name}"؟`)) {
            try {
                fetch(`/admin/api/customers/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }).then(async res => {
                    if (res.ok) {
                        state.customers = state.customers.filter(c => c.id !== id);
                        renderCustomers();
                        renderDashboard();
                        alert('تم حذف العميل بنجاح');
                    } else {
                        const errorData = await res.json().catch(() => ({ error: 'خطأ غير معروف' }));
                        alert('فشل حذف العميل: ' + (errorData.error || 'خطأ غير معروف'));
                    }
                }).catch(error => {
                    alert('حدث خطأ: ' + error.message);
                });
            } catch (error) {
                alert('حدث خطأ: ' + error.message);
            }
        }
    }
}

// =====================================================
// ORDERS MANAGEMENT
// =====================================================
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');

    if (!tbody) return;
    
    if (state.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">لا توجد طلبات حالياً</td></tr>';
        return;
    }

    tbody.innerHTML = state.orders.map(order => `
        <tr>
            <td class="important"><strong>#${order.id}</strong></td>
            <td class="important">${order.customer}</td>
            <td class="secondary">${order.date}</td>
            <td class="important"><strong>جنيه ${order.total.toFixed(2)}</strong></td>
            <td class="secondary"><span class="status-badge ${order.status}">${getArabicOrderStatus(order.status)}</span></td>
            <td class="actions">
                <div class="action-buttons">
                    <button class="action-btn edit btn-update-order" data-order-id="${order.id}" style="font-size: 12px; padding: 5px 10px;">تحديث</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة event listeners للأزرار بعد تحديث DOM
    attachOrderActionListeners();
}

function attachOrderActionListeners() {
    const updateButtons = document.querySelectorAll('.btn-update-order');
    updateButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const orderId = parseInt(btn.getAttribute('data-order-id'));
            updateOrderStatus(orderId);
        });
    });
}

function getArabicOrderStatus(status) {
    const statusMap = {
        'pending': 'قيد الانتظار',
        'shipped': 'مرسل',
        'delivered': 'تم التسليم',
        'cancelled': 'ملغى'
    };
    return statusMap[status] || status;
}

function updateOrderStatus(id) {
    const order = state.orders.find(o => o.id === id);

    const modalBody = `
        <form id="orderForm">
            <div class="form-group">
                <label for="orderStatus">Order Status</label>
                <select id="orderStatus">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="canceled" ${order.status === 'canceled' ? 'selected' : ''}>Canceled</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary btn-close-modal-order">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Status</button>
            </div>
        </form>
    `;

    openModal('Update Order Status', modalBody);

    // إضافة event listener لزر إلغاء
    document.querySelector('.btn-close-modal-order').addEventListener('click', closeModal);

    document.getElementById('orderForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const index = state.orders.findIndex(o => o.id === id);
        state.orders[index].status = document.getElementById('orderStatus').value;

        renderOrders();
        renderDashboard();
        closeModal();
    });
}

function deleteOrder(id) {
    if (confirm('Are you sure you want to delete this order?')) {
        state.orders = state.orders.filter(o => o.id !== id);
        renderOrders();
        renderDashboard();
    }
}

// =====================================================
// SUPPLIERS MANAGEMENT
// =====================================================
function renderSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');

    tbody.innerHTML = state.suppliers.map(supplier => `
        <tr>
            <td>${supplier.id}</td>
            <td>${supplier.name}</td>
            <td>${supplier.contact}</td>
            <td>${supplier.email}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.products}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit btn-edit-supplier" data-supplier-id="${supplier.id}">Edit</button>
                    <button class="action-btn delete btn-delete-supplier" data-supplier-id="${supplier.id}">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة event listeners للأزرار بعد تحديث DOM
    attachSupplierActionListeners();
}

function attachSupplierActionListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.btn-edit-supplier');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const supplierId = parseInt(btn.getAttribute('data-supplier-id'));
            editSupplier(supplierId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete-supplier');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const supplierId = parseInt(btn.getAttribute('data-supplier-id'));
            deleteSupplier(supplierId);
        });
    });
}

function openSupplierModal(supplierId = null) {
    const supplier = supplierId ? state.suppliers.find(s => s.id === supplierId) : null;
    const isEdit = !!supplier;

    const modalTitle = isEdit ? 'Edit Supplier' : 'Add New Supplier';
    const modalBody = `
        <form id="supplierForm">
            <div class="form-group">
                <label for="supplierName">Supplier Name</label>
                <input type="text" id="supplierName" value="${supplier?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="supplierContact">Contact Person</label>
                <input type="text" id="supplierContact" value="${supplier?.contact || ''}" required>
            </div>
            <div class="form-group">
                <label for="supplierEmail">Email</label>
                <input type="email" id="supplierEmail" value="${supplier?.email || ''}" required>
            </div>
            <div class="form-group">
                <label for="supplierPhone">Phone</label>
                <input type="tel" id="supplierPhone" value="${supplier?.phone || ''}" required>
            </div>
            <div class="form-group">
                <label for="supplierProducts">Products Supplied</label>
                <input type="number" id="supplierProducts" value="${supplier?.products || ''}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary btn-close-modal-supplier">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Supplier</button>
            </div>
        </form>
    `;

    openModal(modalTitle, modalBody);

    // إضافة event listener لزر إلغاء
    document.querySelector('.btn-close-modal-supplier').addEventListener('click', closeModal);

    document.getElementById('supplierForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const supplierData = {
            id: supplier?.id || Date.now(),
            name: document.getElementById('supplierName').value,
            contact: document.getElementById('supplierContact').value,
            email: document.getElementById('supplierEmail').value,
            phone: document.getElementById('supplierPhone').value,
            products: parseInt(document.getElementById('supplierProducts').value)
        };

        if (isEdit) {
            const index = state.suppliers.findIndex(s => s.id === supplierId);
            state.suppliers[index] = supplierData;
        } else {
            state.suppliers.push(supplierData);
        }

        renderSuppliers();
        closeModal();
    });
}

function editSupplier(id) {
    openSupplierModal(id);
}

function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        state.suppliers = state.suppliers.filter(s => s.id !== id);
        renderSuppliers();
    }
}

// =====================================================
// INVENTORY MANAGEMENT
// =====================================================
function renderInventory() {
    const lowStockProducts = state.products.filter(p => p.stock < 10);
    const lowStockContainer = document.getElementById('lowStockList');

    if (lowStockProducts.length === 0) {
        lowStockContainer.innerHTML = '<p style="color: #64748b;">No low stock items</p>';
    } else {
        lowStockContainer.innerHTML = lowStockProducts.map(product => `
            <div class="inventory-item">
                <div>
                    <div class="inventory-item-name">${product.name}</div>
                    <div class="inventory-item-stock">يوجد: ${product.stock} قطعة</div>
                </div>
                <span class="stock-level low">المخزون منخفض</span>
            </div>
        `).join('');
    }

    const stockLevelsContainer = document.getElementById('stockLevelsList');
    stockLevelsContainer.innerHTML = state.products.map(product => {
        let stockClass = 'high';
        let stockLabel = 'جيد';

        if (product.stock < 10) {
            stockClass = 'low';
            stockLabel = 'منخفض';
        } else if (product.stock < 30) {
            stockClass = 'medium';
            stockLabel = 'متوسط';
        }

        return `
            <div class="inventory-item">
                <div>
                    <div class="inventory-item-name">${product.name}</div>
                    <div class="inventory-item-stock">يوجد: ${product.stock} قطعة</div>
                </div>
                <span class="stock-level ${stockClass}">${stockLabel}</span>
            </div>
        `;
    }).join('');
}

// =====================================================
// CATEGORIES MANAGEMENT
// =====================================================
async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">جارٍ التحميل...</td></tr>';

    try {
        const res  = await fetch('/admin/api/categories', { credentials: 'include' });
        const data = await res.json();
        const cats = data.data || data.categories || (Array.isArray(data) ? data : []);

        if (!cats.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">لا توجد تصنيفات</td></tr>';
            return;
        }

        tbody.innerHTML = cats.map(c => `
            <tr>
                <td>${c.Category_ID || c.id || ''}</td>
                <td>${escDash(c.Category_Name || c.name || '')}</td>
                <td>${escDash(c.Description  || c.description || '—')}</td>
                <td>${c.product_count ?? '—'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary btn-edit-category" data-category-id="${c.Category_ID || c.id}">تعديل</button>
                    <button class="btn btn-sm btn-danger btn-delete-category" data-category-id="${c.Category_ID || c.id}">حذف</button>
                </td>
            </tr>
        `).join('');
        
        // إضافة event listeners للأزرار بعد تحديث DOM
        attachCategoryActionListeners();
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#e53935;">فشل تحميل التصنيفات</td></tr>';
    }
}

function attachCategoryActionListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.btn-edit-category');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryId = parseInt(btn.getAttribute('data-category-id'));
            editCategory(categoryId);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete-category');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const categoryId = parseInt(btn.getAttribute('data-category-id'));
            deleteCategory(categoryId);
        });
    });
}

function editCategory(id) {
    const body = `
        <div id="cat-edit-wrap">
          <div style="margin-bottom:12px">
            <label style="display:block;margin-bottom:4px;font-weight:600;">اسم التصنيف</label>
            <input id="cat-name-input" type="text" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;" placeholder="اسم التصنيف">
          </div>
          <div style="margin-bottom:12px">
            <label style="display:block;margin-bottom:4px;font-weight:600;">الوصف</label>
            <textarea id="cat-desc-input" rows="3" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;resize:vertical;"></textarea>
          </div>
          <button id="cat-save-btn" class="btn btn-primary btn-save-category-edit" data-category-id="${id}">حفظ التعديل</button>
          <span id="cat-save-msg" style="margin-right:10px;font-size:13px;"></span>
        </div>`;
    openModal('تعديل التصنيف', body);
    
    // إضافة event listener لزر الحفظ
    document.querySelector('.btn-save-category-edit').addEventListener('click', (e) => {
        e.preventDefault();
        const categoryId = parseInt(e.target.getAttribute('data-category-id'));
        saveCategoryEdit(categoryId);
    });
    
    // تحميل البيانات الحالية
    fetch(`/admin/api/categories/${id}`, { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
            const cat = data.data || data;
            const nameEl = document.getElementById('cat-name-input');
            const descEl = document.getElementById('cat-desc-input');
            if (nameEl) nameEl.value = cat.Category_Name || cat.name || '';
            if (descEl) descEl.value = cat.Description  || cat.description || '';
        }).catch(() => {});
}

async function saveCategoryEdit(id) {
    const name = (document.getElementById('cat-name-input')?.value || '').trim();
    const desc = (document.getElementById('cat-desc-input')?.value || '').trim();
    const msg  = document.getElementById('cat-save-msg');
    if (!name) { if (msg) { msg.textContent = 'اسم التصنيف مطلوب'; msg.style.color = '#e53935'; } return; }
    try {
        const res  = await fetch(`/admin/api/categories/${id}`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: desc })
        });
        const data = await res.json();
        if (res.ok) {
            if (msg) { msg.textContent = '✓ تم الحفظ'; msg.style.color = '#2e7d32'; }
            setTimeout(() => { closeModal(); loadCategories(); }, 800);
        } else {
            if (msg) { msg.textContent = data.message || 'فشل الحفظ'; msg.style.color = '#e53935'; }
        }
    } catch (e) {
        if (msg) { msg.textContent = 'خطأ في الاتصال'; msg.style.color = '#e53935'; }
    }
}

async function deleteCategory(id) {
    if (!confirm('هل تريد حذف هذا التصنيف؟')) return;
    try {
        const res = await fetch(`/admin/api/categories/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) loadCategories();
        else alert('فشل الحذف');
    } catch (e) { alert('خطأ في الاتصال'); }
}

// إضافة تصنيف جديد
document.addEventListener('DOMContentLoaded', () => {
    const addCatBtn = document.getElementById('addCategoryBtn');
    if (addCatBtn && !addCatBtn.dataset.bound) {
        addCatBtn.dataset.bound = '1';
        addCatBtn.addEventListener('click', () => {
            const body = `
              <div>
                <div style="margin-bottom:12px">
                  <label style="display:block;margin-bottom:4px;font-weight:600;">اسم التصنيف *</label>
                  <input id="new-cat-name" type="text" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <div style="margin-bottom:12px">
                  <label style="display:block;margin-bottom:4px;font-weight:600;">الوصف</label>
                  <textarea id="new-cat-desc" rows="3" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;resize:vertical;"></textarea>
                </div>
                <button class="btn btn-primary btn-create-category">إضافة</button>
                <span id="new-cat-msg" style="margin-right:10px;font-size:13px;"></span>
              </div>`;
            openModal('إضافة تصنيف جديد', body);
            
            // إضافة event listener لزر إضافة الفئة
            document.querySelector('.btn-create-category').addEventListener('click', createCategory);
        });
    }
});

async function createCategory() {
    const name = (document.getElementById('new-cat-name')?.value || '').trim();
    const desc = (document.getElementById('new-cat-desc')?.value || '').trim();
    const msg  = document.getElementById('new-cat-msg');
    if (!name) { if (msg) { msg.textContent = 'اسم التصنيف مطلوب'; msg.style.color = '#e53935'; } return; }
    try {
        const res  = await fetch('/admin/api/categories', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description: desc })
        });
        const data = await res.json();
        if (res.ok) {
            if (msg) { msg.textContent = '✓ تمت الإضافة'; msg.style.color = '#2e7d32'; }
            setTimeout(() => {
                closeModal();
                loadCategories(); // تحديث جدول التصنيفات
                // تحديث قائمة الفئات في فورم المنتج تلقائياً
                const catSelect = document.getElementById('productCategory');
                if (catSelect) {
                    fetch('/admin/api/categories', { credentials: 'include' })
                        .then(r => r.json())
                        .then(response => {
                            const cats = response.data || response.categories || (Array.isArray(response) ? response : []);
                            const currentVal = catSelect.value;
                            catSelect.innerHTML = '<option value="">اختر فئة...</option>' +
                                cats.map(cat => {
                                    const id   = cat.Category_ID || cat.id;
                                    const name = cat.Category_Name || cat.category_name || cat.name;
                                    return `<option value="${id}" data-name="${name}" ${currentVal == id ? 'selected' : ''}>${name}</option>`;
                                }).join('');
                        })
                        .catch(() => {});
                }
            }, 700);
        } else {
            if (msg) { msg.textContent = data.message || 'فشلت الإضافة'; msg.style.color = '#e53935'; }
        }
    } catch (e) {
        if (msg) { msg.textContent = 'خطأ في الاتصال'; msg.style.color = '#e53935'; }
    }
}

// =====================================================
// OFFERS MANAGEMENT (Products with Discount)
// =====================================================
async function loadOffers() {
    const tbody = document.getElementById('offersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">جارٍ التحميل...</td></tr>';

    try {
        const res      = await fetch('/api/products?limit=200', { credentials: 'include' });
        const products = await res.json();
        const offers   = (Array.isArray(products) ? products : (products.data || [])).filter(p => {
            const d = parseFloat(p.Discount || p.discount || 0);
            return d > 0;
        });

        if (!offers.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">لا توجد عروض حالياً — أضف خصماً لأي منتج من قسم المنتجات</td></tr>';
            return;
        }

        tbody.innerHTML = offers.map(p => {
            const pid      = p.Product_ID || p.id;
            const name     = escDash(p.Product_Name || p.name || '');
            const price    = parseFloat(p.Price  || p.price  || 0).toFixed(2);
            const discount = parseFloat(p.Discount|| p.discount|| 0).toFixed(0);
            const newPrice = (parseFloat(p.Price || 0) * (1 - discount / 100)).toFixed(2);
            const status   = parseFloat(discount) > 0 ? '<span style="color:#2e7d32;font-weight:600;">✓ نشط</span>' : '—';
            return `
                <tr>
                    <td>${pid}</td>
                    <td>${name}</td>
                    <td>—</td>
                    <td>نسبة مئوية</td>
                    <td>${discount}%</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary btn-edit-offer" data-product-id="${pid}" data-product-name="${escDash(p.Product_Name||'')}" data-discount="${discount}">تعديل الخصم</button>
                        <button class="btn btn-sm btn-danger btn-remove-offer" data-product-id="${pid}">إزالة العرض</button>
                    </td>
                </tr>`;
        }).join('');
        
        // إضافة event listeners للأزرار بعد تحديث DOM
        attachOfferActionListeners();
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#e53935;">فشل تحميل العروض</td></tr>';
    }
}

function attachOfferActionListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.btn-edit-offer');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = parseInt(btn.getAttribute('data-product-id'));
            const productName = btn.getAttribute('data-product-name');
            const discount = parseInt(btn.getAttribute('data-discount'));
            editOfferDiscount(productId, productName, discount);
        });
    });
    
    // Remove buttons
    const removeButtons = document.querySelectorAll('.btn-remove-offer');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = parseInt(btn.getAttribute('data-product-id'));
            removeDiscount(productId);
        });
    });
}

function editOfferDiscount(productId, productName, currentDiscount) {
    const body = `
      <div>
        <p style="margin-top:0;color:#555;">المنتج: <strong>${productName}</strong></p>
        <div style="margin-bottom:12px">
          <label style="display:block;margin-bottom:4px;font-weight:600;">نسبة الخصم (0–100%)</label>
          <input id="offer-discount-val" type="number" min="0" max="100" value="${currentDiscount}"
            style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
        </div>
        <button class="btn btn-primary btn-save-offer-discount" data-product-id="${productId}">حفظ</button>
        <span id="offer-msg" style="margin-right:10px;font-size:13px;"></span>
      </div>`;
    openModal('تعديل الخصم', body);
    
    // إضافة event listener لزر حفظ العرض
    document.querySelector('.btn-save-offer-discount').addEventListener('click', (e) => {
        e.preventDefault();
        const productId = parseInt(e.target.getAttribute('data-product-id'));
        saveOfferDiscount(productId);
    });
    openModal('تعديل الخصم', body);
}

async function saveOfferDiscount(productId) {
    const val = parseFloat(document.getElementById('offer-discount-val')?.value || 0);
    const msg = document.getElementById('offer-msg');
    if (isNaN(val) || val < 0 || val > 100) {
        if (msg) { msg.textContent = 'نسبة الخصم يجب أن تكون بين 0 و 100'; msg.style.color = '#e53935'; }
        return;
    }
    try {
        const fd = new FormData();
        fd.append('discount', val);
        const res = await fetch(`/admin/products/update`, {
            method: 'POST', credentials: 'include',
            body: (() => { fd.append('id', productId); return fd; })()
        });
        if (res.ok) {
            if (msg) { msg.textContent = '✓ تم الحفظ'; msg.style.color = '#2e7d32'; }
            setTimeout(() => { closeModal(); loadOffers(); }, 700);
        } else {
            if (msg) { msg.textContent = 'فشل الحفظ'; msg.style.color = '#e53935'; }
        }
    } catch (e) {
        if (msg) { msg.textContent = 'خطأ في الاتصال'; msg.style.color = '#e53935'; }
    }
}

async function removeDiscount(productId) {
    if (!confirm('هل تريد إزالة الخصم من هذا المنتج؟')) return;
    try {
        const fd = new FormData();
        fd.append('id', productId);
        fd.append('discount', 0);
        const res = await fetch('/admin/products/update', { method: 'POST', credentials: 'include', body: fd });
        if (res.ok) loadOffers();
        else alert('فشل إزالة الخصم');
    } catch (e) { alert('خطأ في الاتصال'); }
}

// ربط زر "إضافة عرض"
document.addEventListener('DOMContentLoaded', () => {
    const addOfferBtn = document.getElementById('addOfferBtn');
    if (addOfferBtn && !addOfferBtn.dataset.bound) {
        addOfferBtn.dataset.bound = '1';
        addOfferBtn.addEventListener('click', () => {
            const body = `
              <div>
                <p style="margin-top:0;color:#555;">لإضافة عرض، اختر المنتج وحدد نسبة الخصم</p>
                <div style="margin-bottom:12px">
                  <label style="display:block;margin-bottom:4px;font-weight:600;">المنتج</label>
                  <select id="offer-product-select" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                    <option value="">جارٍ التحميل...</option>
                  </select>
                </div>
                <div style="margin-bottom:12px">
                  <label style="display:block;margin-bottom:4px;font-weight:600;">نسبة الخصم %</label>
                  <input id="offer-new-discount" type="number" min="1" max="100" value="10"
                    style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <button class="btn btn-primary btn-apply-new-offer">تطبيق العرض</button>
                <span id="new-offer-msg" style="margin-right:10px;font-size:13px;"></span>
              </div>`;
            openModal('إضافة عرض جديد', body);
            
            // إضافة event listener لزر تطبيق العرض
            document.querySelector('.btn-apply-new-offer').addEventListener('click', applyNewOffer);
            
            // تحميل قائمة المنتجات
            fetch('/api/products?limit=200').then(r => r.json()).then(products => {
                const arr = Array.isArray(products) ? products : (products.data || []);
                const sel = document.getElementById('offer-product-select');
                if (!sel) return;
                sel.innerHTML = arr.map(p =>
                    `<option value="${p.Product_ID||p.id}">${escDash(p.Product_Name||p.name||'')} — ${parseFloat(p.Price||0).toFixed(2)} جنيه</option>`
                ).join('');
            }).catch(() => {});
        });
    }
});

async function applyNewOffer() {
    const sel  = document.getElementById('offer-product-select');
    const val  = parseFloat(document.getElementById('offer-new-discount')?.value || 0);
    const msg  = document.getElementById('new-offer-msg');
    const pid  = sel?.value;
    
    if (!pid) { 
        if (msg) { msg.textContent = 'اختر منتجاً'; msg.style.color = '#e53935'; }
        return; 
    }
    if (isNaN(val) || val < 1 || val > 100) {
        if (msg) { msg.textContent = 'نسبة الخصم يجب أن تكون بين 1 و 100'; msg.style.color = '#e53935'; }
        return;
    }
    try {
        const fd = new FormData();
        fd.append('id', pid);
        fd.append('discount', val);
        const res = await fetch('/admin/products/update', { method: 'POST', credentials: 'include', body: fd });
        
        if (res.ok) {
            if (msg) { msg.textContent = '✓ تم تطبيق العرض'; msg.style.color = '#2e7d32'; }
            setTimeout(() => { closeModal(); loadOffers(); }, 700);
        } else {
            const errorData = await res.json();
            if (msg) { msg.textContent = errorData.message || 'فشل تطبيق العرض'; msg.style.color = '#e53935'; }
        }
    } catch (e) {
        if (msg) { msg.textContent = 'خطأ في الاتصال'; msg.style.color = '#e53935'; }
    }
}

// =====================================================
// COUPONS MANAGEMENT
// =====================================================
async function loadCoupons() {
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">جارٍ التحميل...</td></tr>';

    try {
        const res  = await fetch('/admin/api/coupons', { credentials: 'include' });
        
        const data = await res.json();
        
        const coupons = data.data || data.coupons || (Array.isArray(data) ? data : []);

        if (!coupons.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#888;">لا توجد كوبونات</td></tr>';
            return;
        }

        tbody.innerHTML = coupons.map(c => {
            const isActive = c.Is_Active || c.isActive || c.is_active;
            const expiry   = c.Expiry_Date || c.expiryDate || c.expiry_date || '';
            const expStr   = expiry ? new Date(expiry).toLocaleDateString('ar-EG') : '—';
            const typeAr   = (c.Discount_Type || c.discountType) === 'percentage' ? 'نسبة مئوية' : 'قيمة ثابتة';
            const val      = parseFloat(c.Discount_Value || c.discountValue || 0).toFixed(2);
            const usageStr = `${c.Current_Uses || c.currentUses || 0} / ${c.Usage_Limit || c.usageLimit || '∞'}`;
            const statusEl = isActive
                ? '<span style="color:#2e7d32;font-weight:600;">✓ نشط</span>'
                : '<span style="color:#999;">معطل</span>';
            return `
                <tr>
                    <td><code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;">${escDash(c.Code || c.code || '')}</code></td>
                    <td>${typeAr}</td>
                    <td>${val}${(c.Discount_Type||c.discountType)==='percentage'?'%':' جنيه'}</td>
                    <td>${expStr}</td>
                    <td>${usageStr}</td>
                    <td>${statusEl}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary btn-toggle-coupon" data-coupon-id="${c.Coupon_ID||c.id}" data-is-active="${isActive?1:0}">
                            ${isActive ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-coupon" data-coupon-id="${c.Coupon_ID||c.id}">حذف</button>
                    </td>
                </tr>`;
        }).join('');
        
        // إضافة event listeners للأزرار بعد تحديث DOM
        attachCouponActionListeners();
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#e53935;">فشل تحميل الكوبونات</td></tr>';
    }
}

function attachCouponActionListeners() {
    // Toggle buttons
    const toggleButtons = document.querySelectorAll('.btn-toggle-coupon');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const couponId = parseInt(btn.getAttribute('data-coupon-id'));
            const isActive = parseInt(btn.getAttribute('data-is-active'));
            toggleCoupon(couponId, isActive);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.btn-delete-coupon');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const couponId = parseInt(btn.getAttribute('data-coupon-id'));
            deleteCoupon(couponId);
        });
    });
}

async function toggleCoupon(id, isCurrentlyActive) {
    try {
        const res = await fetch(`/admin/api/coupons/${id}`, {
            method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !isCurrentlyActive })
        });
        if (res.ok) loadCoupons();
        else alert('فشل تغيير حالة الكوبون');
    } catch (e) { alert('خطأ في الاتصال'); }
}

async function deleteCoupon(id) {
    if (!confirm('هل تريد حذف هذا الكوبون؟')) return;
    try {
        const res = await fetch(`/admin/api/coupons/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) loadCoupons();
        else alert('فشل الحذف');
    } catch (e) { alert('خطأ في الاتصال'); }
}

// ربط زر "إضافة كوبون"
document.addEventListener('DOMContentLoaded', () => {
    const addCouponBtn = document.getElementById('addCouponBtn');
    if (addCouponBtn && !addCouponBtn.dataset.bound) {
        addCouponBtn.dataset.bound = '1';
        addCouponBtn.addEventListener('click', () => {
            const today = new Date();
            today.setMonth(today.getMonth() + 1);
            const defaultExpiry = today.toISOString().split('T')[0];
            const body = `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div>
                  <label style="display:block;margin-bottom:4px;font-weight:600;">كود الكوبون *</label>
                  <input id="nc-code" type="text" placeholder="مثال: SAVE20" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <div>
                  <label style="display:block;margin-bottom:4px;font-weight:600;">نوع الخصم *</label>
                  <select id="nc-type" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">قيمة ثابتة جنيه</option>
                  </select>
                </div>
                <div>
                  <label style="display:block;margin-bottom:4px;font-weight:600;">قيمة الخصم *</label>
                  <input id="nc-value" type="number" min="1" placeholder="مثال: 20" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <div>
                  <label style="display:block;margin-bottom:4px;font-weight:600;">تاريخ الانتهاء *</label>
                  <input id="nc-expiry" type="date" value="${defaultExpiry}" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <div>
                  <label style="display:block;margin-bottom:4px;font-weight:600;">حد الاستخدام (اتركه فارغاً للامحدود)</label>
                  <input id="nc-limit" type="number" min="1" placeholder="مثال: 100" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <div>
                  <label style="display:block;margin-bottom:4px;font-weight:600;">الحد الأدنى للطلب (جنيه)</label>
                  <input id="nc-min" type="number" min="0" value="0" style="width:100%;padding:8px;border:1.5px solid #ddd;border-radius:7px;">
                </div>
                <div style="grid-column:1/-1;margin-top:4px;">
                  <button class="btn btn-primary btn-create-coupon">إضافة الكوبون</button>
                  <span id="nc-msg" style="margin-right:10px;font-size:13px;"></span>
                </div>
              </div>`;
            openModal('إضافة كوبون جديد', body);
            
            // إضافة event listener لزر إضافة الكوبون
            document.querySelector('.btn-create-coupon').addEventListener('click', createCoupon);
        });
    }
});

async function createCoupon() {
    const code    = (document.getElementById('nc-code')?.value   || '').trim().toUpperCase();
    const type    = document.getElementById('nc-type')?.value    || 'percentage';
    const value   = parseFloat(document.getElementById('nc-value')?.value  || 0);
    const expiry  = document.getElementById('nc-expiry')?.value  || '';
    const limit   = document.getElementById('nc-limit')?.value   || '';
    const minPur  = parseFloat(document.getElementById('nc-min')?.value || 0);
    const msg     = document.getElementById('nc-msg');

    // Validation
    if (!code)   { if (msg) { msg.textContent = 'كود الكوبون مطلوب';   msg.style.color = '#e53935'; } return; }
    if (!value)  { if (msg) { msg.textContent = 'قيمة الخصم مطلوبة';  msg.style.color = '#e53935'; } return; }
    if (!expiry) { if (msg) { msg.textContent = 'تاريخ الانتهاء مطلوب'; msg.style.color = '#e53935'; } return; }

    try {
        // Prepare payload
        const payload = {
            code,
            discountType: type,
            discountValue: value,
            expiryDate: expiry,
            minPurchase: minPur,
            isActive: true
        };
        
        // Only add usageLimit if it has a value
        if (limit && limit.trim()) {
            payload.usageLimit = parseInt(limit);
        }

        const res = await fetch('/admin/api/coupons', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            if (msg) { msg.textContent = '✓ تمت الإضافة بنجاح'; msg.style.color = '#2e7d32'; }
            setTimeout(() => { closeModal(); loadCoupons(); }, 700);
        } else {
            const errorMsg = data.message || data.errors || 'فشل إضافة الكوبون';
            if (msg) { msg.textContent = errorMsg; msg.style.color = '#e53935'; }
        }
    } catch (e) {
        if (msg) { msg.textContent = 'خطأ في الاتصال: ' + e.message; msg.style.color = '#e53935'; }
    }
}

// مساعد: تهريب HTML للجداول
function escDash(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =====================================================
// MODAL MANAGEMENT
// =====================================================
function openModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// =====================================================
// SEARCH FUNCTIONALITY
// =====================================================
let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
        
        if (!searchTerm) {
            // If search is empty, return to dashboard
            showSection('dashboard');
            return;
        }

        // Determine search type based on keywords
        const productKeywords = ['بيتزا', 'برجر', 'مشروب', 'حلوى', 'مقبلات', 'يانكي', 'صلصة', 'نصف ونصف', 'product', 'food', 'meal'];
        const customerKeywords = ['عميل', 'زبون', 'customer', 'client'];
        const orderKeywords = ['طلب', 'order', 'invoice'];
        const offerKeywords = ['عرض', 'خصم', 'discount', 'offer', 'deal'];
        const couponKeywords = ['كوبون', 'coupon', 'code', 'promo'];
        const categoryKeywords = ['تصنيف', 'فئة', 'category', 'type'];
        
        // Check if search term matches product keywords or contains Arabic/English product names
        const isProductSearch = productKeywords.some(keyword => searchTerm.includes(keyword)) || 
                               state.products.some(p => p.name.toLowerCase().includes(searchTerm));
        
        // Check if search term matches customer keywords or looks like a name/email
        const isCustomerSearch = customerKeywords.some(keyword => searchTerm.includes(keyword)) || 
                                state.customers.some(c => 
                                    c.name.toLowerCase().includes(searchTerm) || 
                                    c.email.toLowerCase().includes(searchTerm)
                                );
        
        // Check if search term matches order keywords or order IDs
        const isOrderSearch = orderKeywords.some(keyword => searchTerm.includes(keyword)) || 
                             state.orders.some(o => o.id.toString().includes(searchTerm));
        
        // Check if search term matches offer keywords
        const isOfferSearch = offerKeywords.some(keyword => searchTerm.includes(keyword));
        
        // Check if search term matches coupon keywords
        const isCouponSearch = couponKeywords.some(keyword => searchTerm.includes(keyword));
        
        // Check if search term matches category keywords
        const isCategorySearch = categoryKeywords.some(keyword => searchTerm.includes(keyword));
        
        if (isProductSearch) {
            // Navigate to products section and filter results
            showSection('products');
            filterProducts(searchTerm);
        } else if (isCustomerSearch) {
            // Navigate to customers section and filter results
            showSection('customers');
            filterCustomers(searchTerm);
        } else if (isOrderSearch) {
            // Navigate to orders section and filter results
            showSection('orders');
            filterOrders(searchTerm);
        } else if (isOfferSearch) {
            // Navigate to offers section
            showSection('offers');
        } else if (isCouponSearch) {
            // Navigate to coupons section
            showSection('coupons');
        } else if (isCategorySearch) {
            // Navigate to categories section
            showSection('categories');
        } else {
            // Default to products if no specific match
            showSection('products');
            filterProducts(searchTerm);
        }
    }, 300); // 300ms debounce
}

function showSection(sectionName) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    if (navItem) navItem.classList.add('active');

    // Show section
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const section = document.getElementById(sectionName + '-section');
    if (section) section.classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'لوحة المعلومات',
        products: 'المنتجات',
        customers: 'العملاء',
        orders: 'الطلبات',
        categories: 'التصنيفات',
        offers: 'العروض',
        coupons: 'الكوبونات',
        inventory: 'المخزون'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'لوحة التحكم';
}

function filterProducts(searchTerm) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    let productsToShow = state.products;
    
    if (searchTerm) {
        productsToShow = state.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.id.toString().includes(searchTerm)
        );
    }

    if (productsToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #666;">
            ${searchTerm ? `لا توجد منتجات تطابق "${searchTerm}"` : 'لا توجد منتجات'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = productsToShow.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>جنيه ${product.price.toFixed(2)}</td>
            <td>${product.discount || 0}%</td>
            <td>${product.stock}</td>
            <td><span class="status-badge ${product.status === 'نشط' ? 'active' : 'inactive'}">${product.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit btn-edit-product" data-product-id="${product.id}" style="font-size: 12px; padding: 5px 10px;">تعديل</button>
                    <button class="action-btn delete btn-delete-product" data-product-id="${product.id}" style="font-size: 12px; padding: 5px 10px;">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة event listeners للأزرار بعد تحديث DOM
    attachProductActionListeners();
}

function filterCustomers(searchTerm) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    let customersToShow = state.customers;
    
    if (searchTerm) {
        customersToShow = state.customers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            customer.id.toString().includes(searchTerm)
        );
    }

    if (customersToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">
            ${searchTerm ? `لا يوجد عملاء يطابقون "${searchTerm}"` : 'لا يوجد عملاء'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = customersToShow.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td><strong>${customer.orders}</strong></td>
            <td>جنيه ${customer.totalSpent.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit btn-edit-customer" data-customer-id="${customer.id}" style="font-size: 12px; padding: 5px 10px;">تعديل</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة event listeners للأزرار بعد تحديث DOM
    attachCustomerEditListeners();
}

function attachCustomerEditListeners() {
    const editButtons = document.querySelectorAll('.btn-edit-customer');
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const customerId = parseInt(btn.getAttribute('data-customer-id'));
            editCustomer(customerId);
        });
    });
}

function filterOrders(searchTerm) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let ordersToShow = state.orders;
    
    if (searchTerm) {
        ordersToShow = state.orders.filter(order => 
            order.id.toString().includes(searchTerm) ||
            order.customer.toLowerCase().includes(searchTerm) ||
            order.date.includes(searchTerm) ||
            order.total.toString().includes(searchTerm)
        );
    }

    if (ordersToShow.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">
            ${searchTerm ? `لا توجد طلبات تطابق "${searchTerm}"` : 'لا توجد طلبات'}
        </td></tr>`;
        return;
    }

    tbody.innerHTML = ordersToShow.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${order.customer}</td>
            <td>${order.date}</td>
            <td><strong>جنيه ${order.total.toFixed(2)}</strong></td>
            <td><span class="status-badge ${order.status}">${getArabicOrderStatus(order.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit btn-update-order-filter" data-order-id="${order.id}" style="font-size: 12px; padding: 5px 10px;">تحديث</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // إضافة event listeners للأزرار بعد تحديث DOM
    attachOrderFilterActionListeners();
}

// =====================================================
// API INTEGRATION EXAMPLES
// Replace the sample data functions with actual API calls
// =====================================================

// Example: Fetch products from API
/*
async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        state.products = data;
        renderProducts();
    } catch (error) {
    }
}

// Example: Add product via API
async function addProduct(productData) {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        const data = await response.json();
        state.products.push(data);
        renderProducts();
    } catch (error) {
    }
}

// Example: Update product via API
async function updateProduct(id, productData) {
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        const data = await response.json();
        const index = state.products.findIndex(p => p.id === id);
        state.products[index] = data;
        renderProducts();
    } catch (error) {
    }
}

// Example: Delete product via API
async function deleteProductAPI(id) {
    try {
        await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        state.products = state.products.filter(p => p.id !== id);
        renderProducts();
    } catch (error) {
    }
}
*/