let state = { products: [] }; 

async function loadProducts() {
  try {
    const response = await fetch("/admin/products");
    if (!response.ok) throw new Error("Network error");

    const data = await response.json();
    state = data;
    window._allProducts = data;
    document.getElementById('totalProducts').textContent = state.length;

    const tbody = document.getElementById('productsTableBody');

    if (!state || state.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">لا توجد منتجات</td></tr>`;
      return;
    }

    tbody.innerHTML = state.map(product => `
        <tr data-id="${product.Product_ID}">
            <td>${product.Product_ID}</td>
            <td>${product.Product_Name}</td>
            <td>${product.Category}</td>
            <td>$${parseFloat(product.Price).toFixed(2)}</td>
            <td>${product.Quantity}</td>
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
        
        // استخراج البيانات الفعلية من الـ API response
        const categories = categoriesResponse.data || categoriesResponse || [];

        const product = productId ? (window._allProducts || []).find(p => p.Product_ID == productId) : null;
        const isEdit = !!product;

        const modalTitle = isEdit ? 'Edit Product' : 'Add New Product';
        const categoryOptions = categories.map(c => `
            <option value="${c.Category_ID}" ${product?.Category_ID == c.Category_ID ? 'selected' : ''}>
                ${c.Category_Name}
            </option>
        `).join('');

        const modalBody = `
            <form id="productForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="productName">Product Name</label>
                    <input type="text" id="productName" value="${product?.Product_Name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="productCategoryId">Category</label>
                    <select id="productCategoryId" required>
                        <option value="">-- Select Category --</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="productPrice">Price</label>
                    <input type="number" id="productPrice" step="0.01" value="${product?.Price || ''}" required>
                </div>
                <div class="form-group">
                    <label for="productStock">Stock</label>
                    <input type="number" id="productStock" value="${product?.Quantity || ''}" required>
                </div>
                <div class="form-group">
                    <label for="productImage">Image</label>
                    <input type="file" id="productImage" accept="image/*">
                </div>
                <div class="form-group">
                    <label for="productStatus">Status</label>
                    <select id="productStatus">
                        <option value="active" ${product?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${product?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Product</button>
                </div>
            </form>
        `;

        openModal(modalTitle, modalBody);

        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();

            const categorySelect = document.getElementById('productCategoryId');
            const categoryId = parseInt(categorySelect.value);
            
            // التأكد من الحصول على اسم الفئة بشكل صحيح
            let categoryName = '';
            if (categorySelect.selectedIndex > 0) {
                categoryName = categorySelect.options[categorySelect.selectedIndex].text;
            }
            
            if (!categoryName) {
                alert('يرجى اختيار فئة صحيحة');
                return;
            }

            const formData = new FormData();
            formData.append('name', document.getElementById('productName').value);
            formData.append('category_id', categoryId);
            formData.append('category', categoryName);
            formData.append('price', parseFloat(document.getElementById('productPrice').value));
            formData.append('quantity', parseInt(document.getElementById('productStock').value));
            formData.append('status', document.getElementById('productStatus').value);
            
            // إضافة الصورة إن وجدت
            const imageInput = document.getElementById('productImage');
            if (imageInput.files && imageInput.files[0]) {
                formData.append('image', imageInput.files[0]);
            }
            
            console.log('📤 إرسال البيانات:', { categoryId, categoryName });

            if (isEdit) {
                // UPDATE
                fetch(`/admin/products/update/${product.Product_ID}`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        loadProducts();
                        closeModal();
                    } else {
                        alert('فشل التحديث: ' + (data.message || ''));
                    }
                })
                .catch(err => alert('خطأ في التحديث'));
            } else {
                // CREATE
                fetch(`/admin/products/create`, {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        loadProducts();
                        closeModal();
                    } else {
                        alert('فشل الإنشاء: ' + (data.message || ''));
                    }
                })
                .catch(err => alert('خطأ في الإنشاء'));
            }
        });
    } catch (error) {
        console.error('Error in openProductModal:', error);
        alert('خطأ في تحميل الفئات');
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
      loadProducts();
    } else {
      alert('فشل الحذف: ' + (data.message || ''));
    }
  } catch (err) {
    alert('خطأ في الحذف');
  }
}
