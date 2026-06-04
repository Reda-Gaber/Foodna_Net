 
        // البيانات من السيرفر
        const orderData = JSON.stringify(order) ;
        const itemsData = JSON.stringify(items);
        const discountData = JSON.stringify(discount || 0);

        /**
         * طباعة الإيصال الحراري
         */
        async function handlePrintThermal() {
            const btn = document.getElementById('printThermalBtn');
            const originalHTML = btn.innerHTML;
            
            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 0.8s linear infinite;"></i><span>جاري الطباعة...</span>';
                
                const result = await quickPrint(orderData, itemsData, discountData, 'thermal');
                
                if (result.success) {
                    showNotification('تمت الطباعة بنجاح', 'success');
                    document.getElementById('orderStatus').textContent = '✓ تمت الطباعة';
                    document.getElementById('orderStatus').style.color = '#16a34a';
                } else {
                    showNotification(result.message || 'فشلت الطباعة الحرارية', 'warning');
                    // الرجوع للطباعة العادية كبديل
                    setTimeout(() => {
                        const fallback = confirm('هل تريد الطباعة العادية بدلاً منها؟');
                        if (fallback) handlePrintBrowser();
                    }, 500);
                }
            } catch (error) {
                console.error('خطأ:', error);
                showNotification('حدث خطأ في الطباعة', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        }

        /**
         * طباعة الإيصال الطباعة العادية
         */
        function handlePrintBrowser() {
            try {
                const printer = createReceiptPrinter(orderData, itemsData, discountData);
                printer.printBrowser();
                showNotification('فتحت نافذة الطباعة', 'success');
                document.getElementById('orderStatus').textContent = '✓ تمت الطباعة';
                document.getElementById('orderStatus').style.color = '#16a34a';
            } catch (error) {
                console.error('خطأ:', error);
                showNotification('حدث خطأ في الطباعة', 'error');
            }
        }

        /**
         * عرض إشعار
         */
        function showNotification(message, type = 'info') {
            if (window.Swal) {
                Swal.fire({
                    title: type === 'success' ? '✓ نجح' : type === 'error' ? '✗ خطأ' : 'تنبيه',
                    text: message,
                    icon: type,
                    timer: 3000,
                    position: 'top-end',
                    toast: true,
                    showConfirmButton: false
                });
            } else {
                alert(message);
            }
        }

        // تحديث حالة الطلب
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('orderStatus').textContent = `رقم الطلب: #${orderData.Order_ID} - جاهز للطباعة`;
        });
   