let state = [];

function resolveProductImage(image) {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return image;
  if (image.startsWith('images/')) return `/${image}`;
  return `/images/products/${image}`;
}

async function loadProducts() {
  try {
    const response = await fetch("/admin/products");
    if (!response.ok) throw new Error("Network error");

    const json = await response.json();

    // الـ API بيرجع { success: true, data: { products: [...], pagination: {...} } }
    state = (json.data && json.data.products) ? json.data.products : (Array.isArray(json.data) ? json.data : []);
    window._allProducts = state;

    const totalEl = document.getElementById('totalProducts');
    if (totalEl) totalEl.textContent = state.length;

    const tbody = document.getElementById('productsTableBody');

    if (!state || state.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">لا توجد منتجات</td></tr>`;
      return;
    }

    tbody.innerHTML = state.map(product => `
        <tr data-id="${product.Product_ID}">
            <td>${product.Product_ID}</td>
            <td>${product.Product_Name}</td>
            <td>${product.Category || ''}</td>
            <td>${parseFloat(product.Price || 0).toFixed(2)}</td>
            <td>${product.Quantity_Available ?? product.Quantity ?? 0}</td>
            <td>
                <div class="action-buttons">
                <button class="action-btn edit" data-action="edit" data-id="${product.Product_ID}">تعديل</button>
                <button class="action-btn delete" data-action="delete" data-id="${product.Product_ID}">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');

  } catch (err) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">خطأ في تحميل البيانات: ${err.message}</td></tr>`;
    if (typeof showError !== 'undefined') {
      showError('فشل تحميل المنتجات', 'خطأ في التحميل');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());

  document.getElementById('productsTableBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'delete') deleteProduct(id);
    if (action === 'edit') editProduct(id);
  });
});


function openProductModal(productId = null) {
  openProductModalAsync(productId);
}

async function openProductModalAsync(productId = null) {
  try {
    // جلب الفئات
    const catRes = await fetch('/admin/api/categories', { credentials: 'include' });
    const categoriesResponse = await catRes.json();
    const categories = categoriesResponse.data || categoriesResponse || [];

    // ====================================================
    // جلب بيانات المنتج الحالي من الـ API مباشرة
    // عشان نضمن إن الصورة والداتا الكاملة موجودة
    // ====================================================
    let product = null;
    if (productId) {
      try {
        const prodRes = await fetch(`/admin/products/${productId}`, { credentials: 'include' });
        const prodJson = await prodRes.json();
        product = (prodJson.data) ? prodJson.data : null;
      } catch (e) {
        // fallback على الـ state المحلي
        product = (window._allProducts || []).find(p => p.Product_ID == productId) || null;
      }
    }

    const isEdit = !!product;
    const modalTitle = isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد';

    const categoryOptions = categories.map(c => `
        <option value="${c.Category_ID}" ${product?.Category_ID == c.Category_ID ? 'selected' : ''}>
            ${c.Category_Name}
        </option>
    `).join('');

    // عرض الصورة الحالية إن وجدت
    const currentImageHtml = (isEdit && product.Image)
      ? `<div class="form-group">
           <label>الصورة الحالية</label>
           <img src="${resolveProductImage(product.Image)}" alt="صورة المنتج" style="max-width:120px; max-height:120px; border-radius:8px; display:block; margin-bottom:6px;">
           <small style="color:#888;">اترك حقل الصورة فارغاً للإبقاء على الصورة الحالية</small>
         </div>`
      : '';

    const modalBody = `
        <div id="productForm">
            <div class="form-group">
                <label for="productName">اسم المنتج</label>
                <input type="text" id="productName" value="${product?.Product_Name || ''}" required>
            </div>
            <div class="form-group">
                <label for="productCategoryId">الفئة</label>
                <select id="productCategoryId" required>
                    <option value="">-- اختر الفئة --</option>
                    ${categoryOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="productDescription">الوصف</label>
                <textarea id="productDescription" rows="3" style="width:100%">${product?.Description || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="productPrice">السعر</label>
                <input type="number" id="productPrice" step="0.01" value="${product?.Price || ''}" required>
            </div>
            <div class="form-group">
                <label for="productDiscount">الخصم (%)</label>
                <input type="number" id="productDiscount" step="0.01" min="0" max="100" value="${product?.Discount ?? 0}">
            </div>
            <div class="form-group">
                <label for="productStock">الكمية</label>
                <input type="number" id="productStock" value="${product?.Quantity_Available ?? product?.Quantity ?? ''}" required>
            </div>
            ${currentImageHtml}
            <div class="form-group">
                <label for="productImage">صورة جديدة ${isEdit ? '(اختياري)' : ''}</label>
                <input type="file" id="productImage" accept="image/*">
            </div>
            <div class="form-group">
                <label for="productStatus">الحالة</label>
                <select id="productStatus">
                    <option value="active" ${(product?.status || product?.Status) === 'active' ? 'selected' : ''}>نشط</option>
                    <option value="inactive" ${(product?.status || product?.Status) === 'inactive' ? 'selected' : ''}>غير نشط</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
                <button type="button" class="btn btn-primary" id="submitProductBtn">${isEdit ? 'تحديث' : 'إضافة'} المنتج</button>
            </div>
        </div>
    `;

    openModal(modalTitle, modalBody);

    document.getElementById('submitProductBtn').addEventListener('click', async () => {
      const categorySelect = document.getElementById('productCategoryId');
      const categoryId = parseInt(categorySelect.value);

      let categoryName = '';
      if (categorySelect.selectedIndex > 0) {
        categoryName = categorySelect.options[categorySelect.selectedIndex].text;
      }

      if (!categoryName) {
        alert('يرجى اختيار فئة صحيحة');
        return;
      }

      const nameVal = document.getElementById('productName').value.trim();
      const priceVal = document.getElementById('productPrice').value.trim();
      const stockVal = document.getElementById('productStock').value.trim();

      if (!nameVal || !priceVal || !stockVal) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      const formData = new FormData();
      formData.append('name', nameVal);
      formData.append('category_id', categoryId);
      formData.append('category', categoryName);
      formData.append('price', parseFloat(priceVal));
      formData.append('quantity', parseInt(stockVal));
      formData.append('discount', parseFloat(document.getElementById('productDiscount').value) || 0);
      formData.append('description', document.getElementById('productDescription').value || '');
      formData.append('status', document.getElementById('productStatus').value);

      // إضافة الصورة فقط لو المستخدم اختار صورة جديدة
      const imageInput = document.getElementById('productImage');
      if (imageInput.files && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }

      const submitBtn = document.getElementById('submitProductBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري الحفظ...';

      try {
        const fetchAndParse = async (url, options) => {
          const res = await fetch(url, options);
          const text = await res.text();
          let data;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (parseError) {
            data = { success: false, message: text || `خطأ غير متوقع: ${res.status}` };
          }
          return { res, data };
        };

        if (isEdit) {
          // UPDATE
          const { res, data } = await fetchAndParse(`/admin/products/update/${product.Product_ID}`, {
            method: 'POST',
            body: formData
          });
          if (res.ok && data.success) {
            await loadProducts();
            closeModal();
          } else {
            alert('فشل التحديث: ' + (data.message || 'خطأ غير معروف'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'تحديث المنتج';
          }
        } else {
          // CREATE
          const { res, data } = await fetchAndParse(`/admin/products/create`, {
            method: 'POST',
            body: formData
          });
          if (res.ok && data.success) {
            await loadProducts();
            closeModal();
          } else {
            alert('فشل الإنشاء: ' + (data.message || 'خطأ غير معروف'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'إضافة المنتج';
          }
        }
      } catch (err) {
        alert('خطأ في الاتصال: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'تحديث المنتج' : 'إضافة المنتج';
      }
    });

  } catch (error) {
    console.error('Error in openProductModal:', error);
    alert('خطأ في تحميل الفئات: ' + error.message);
  }
}


function editProduct(id) {
  openProductModal(id);
}

async function deleteProduct(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
  try {
    const res = await fetch(`/admin/products/delete/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await loadProducts();
    } else {
      alert('فشل الحذف: ' + (data.message || ''));
    }
  } catch (err) {
    alert('خطأ في الحذف: ' + err.message);
  }
}