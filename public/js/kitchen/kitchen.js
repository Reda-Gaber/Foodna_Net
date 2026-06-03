 // Helper functions for Swal
        function showConfirm(message, title = 'تأكيد') {
            return Swal.fire({
                title: title,
                text: message,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'نعم',
                cancelButtonText: 'إلغاء'
            });
        }

        function showLoading(message = 'جاري التحميل...') {
            Swal.fire({
                title: message,
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }

        function showSuccess(message, title = 'نجح', timer = 1500) {
            return Swal.fire({
                title: title,
                text: message,
                icon: 'success',
                timer: timer,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }

        function showError(message, title = 'خطأ') {
            return Swal.fire({
                title: title,
                text: message,
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
        }

        function closeSwal() {
            Swal.close();
        }

        const ordersContainer = document.getElementById('ordersContainer');
        const noOrdersMsg = document.getElementById('noOrders');
        let orders = [];

        // تحديث الوقت
        function updateTime() {
            const now = new Date();
            document.getElementById('currentTime').textContent = now.toLocaleTimeString('ar-EG');
        }
        setInterval(updateTime, 1000);
        updateTime();

        // عرض الطلبات
        function renderOrders() {
            if (orders.length === 0) {
                noOrdersMsg.style.display = 'block';
                ordersContainer.innerHTML = '';
                return;
            }

            noOrdersMsg.style.display = 'none';
            ordersContainer.innerHTML = orders.map(order => {
                const isCompleted = order.status === 'Completed' || order.status === 'Delivered';
                const statusText = {
                    'Pending': 'جديد',
                    'Processing': 'قيد التحضير',
                    'Ready': 'جاهز',
                    'Completed': 'مكتمل',
                    'Delivered': 'تم التسليم'
                }[order.status] || order.status;

                return `
                    <div class="order-card ${isCompleted ? 'completed' : ''}">
                        <div class="order-header">
                            <div>
                                <div class="order-number">${order.orderNumber}</div>
                                <div class="order-time">
                                    <i class="ri-time-line"></i> 
                                    ${new Date(order.createdAt).toLocaleString('ar-EG')}
                                </div>
                            </div>
                            <span class="badge badge-${order.status === 'Pending' ? 'warning' : order.status === 'Ready' ? 'success' : 'info'}">
                                ${statusText}
                            </span>
                        </div>

                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-item">
                                    <span>${item.quantity} × ${item.name}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)} جنيه</span>
                                </div>
                            `).join('')}
                        </div>

                        <div class="order-footer">
                            <div class="order-total">${order.total.toFixed(2)} جنيه</div>
                            ${!isCompleted ? `
                                <button class="btn btn-success" onclick="completeOrder(${order.id})">
                                    <i class="ri-check-line"></i> تم الانتهاء
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // جلب الطلبات
        async function fetchOrders() {
            try {
                console.log('🔵 Fetching orders...');
                const res = await fetch('/kitchen/api/orders');
                console.log('📥 Response status:', res.status);
                const data = await res.json();
                console.log('📥 Response data:', data);
                
                if (data.success) {
                    orders = data.data.orders.filter(o => 
                        o.status !== 'Completed' && o.status !== 'Delivered'
                    );
                    console.log('Filtered orders:', orders);
                    renderOrders();
                } else {
                    console.error(' API error:', data.message);
                    showError(data.message || 'فشل في جلب الطلبات', 'خطأ');
                }
            } catch (err) {
                console.error(' Error fetching orders:', err);
                showError('حدث خطأ في جلب الطلبات: ' + err.message, 'خطأ في الاتصال');
            }
        }

        // إكمال الطلب
        async function completeOrder(orderId) {
            console.log('🔵 completeOrder called with orderId:', orderId, typeof orderId);
            const confirmResult = await showConfirm('هل أنت متأكد من إكمال هذا الطلب؟', 'تأكيد');
            if (!confirmResult.isConfirmed) {
                return;
            }

            showLoading('جاري تحديث حالة الطلب...');

            try {
                const payload = { orderId: Number(orderId), status: 'Completed' };
                console.log(' Sending payload:', payload);
                
                const res = await fetch('/kitchen/api/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                
                console.log(' Response status:', res.status);
                const data = await res.json();
                console.log(' Response data:', data);
                
                closeSwal();
                
                if (data.success) {
                    showSuccess('تم تحديث حالة الطلب بنجاح', 'نجح', 1);
                    // إزالة الطلب من القائمة فوراً
                    orders = orders.filter(o => o.id !== orderId);
                    renderOrders();
                } else {
                    showError(data.message || 'فشل تحديث حالة الطلب', 'خطأ');
                }
            } catch (err) {
                console.error(' Error:', err);
                closeSwal();
                showError('حدث خطأ أثناء تحديث حالة الطلب: ' + err.message, 'خطأ في الاتصال');
            }
        }

        // جلب الطلبات كل 3 ثوان
        fetchOrders();
        setInterval(fetchOrders, 3000);
