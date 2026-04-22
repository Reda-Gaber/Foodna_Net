let state = { products: [] }; 

async function loadProducts() {
  try {
    const response = await fetch("/admin/products");
    if (!response.ok) throw new Error("Network error");

    const data = await response.json();
    state = data;document.getElementById('totalProducts').textContent = state.length;

    const tbody = document.getElementById('productsTableBody');

    if (!state || state.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">لا توجد منتجات</td></tr>`;
      return;
    }

    tbody.innerHTML = state.map(product => `
        <tr>
            <td>${product.Product_ID}</td>
            <td>${product.Product_Name}</td>
            <td>${product.Category}</td>
            <td>$${parseFloat(product.Price).toFixed(2)}</td>
            <td>${product.Quantity}</td>
            <td>
                <div class="action-buttons">
                <a id="delete" href="/admin/productsDelete" ><button class="action-btn delete">حذف</button></a>
                </div>
                </td>
                </tr>
                `).join('');
    // <button class="action-btn edit" onclick="editProduct(${product.Product_ID})">Edit</button>
                
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
  
  document.getElementById("delete").addEventListener("click", (e) => {
    e.preventDefault();});
});


function openProductModal(productId = null) {
    const product = productId ? state.products.find(p => p.id === productId) : null;
    const isEdit = !!product;

    const modalTitle = isEdit ? 'Edit Product' : 'Add New Product';
    const modalBody = `
        <form id="productForm">
            <div class="form-group">
                <label for="productName">Product Name</label>
                <input type="text" id="productName" value="${product?.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="productCategory">Category</label>
                <input type="text" id="productCategory" value="${product?.category || ''}" required>
            </div>
            <div class="form-group">
                <label for="productPrice">Price</label>
                <input type="number" id="productPrice" step="0.01" value="${product?.price || ''}" required>
            </div>
            <div class="form-group">
                <label for="productStock">Stock</label>
                <input type="number" id="productStock" value="${product?.stock || ''}" required>
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

        const productData = {
            id: product?.id || Date.now(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: parseInt(document.getElementById('productStock').value),
            status: document.getElementById('productStatus').value
        };

        if (isEdit) {
            const index = state.products.findIndex(p => p.id === productId);
            state.products[index] = productData;
        } else {
            state.products.push(productData);
        }

        renderProducts();
        renderDashboard();
        renderInventory();
        closeModal();
    });
}

function editProduct(id) {
    openProductModal(id);
}

// function deleteProduct(id) {
//     if (confirm('Are you sure you want to delete this product?')) {
//         state.products = state.products.filter(p => p.id !== id);
//         renderProducts();
//         renderDashboard();
//         renderInventory();
//     }
// }
