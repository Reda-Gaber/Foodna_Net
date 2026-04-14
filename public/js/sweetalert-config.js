/**
 * SweetAlert Configuration
 * إعدادات موحدة لـ SweetAlert2 في جميع أنحاء التطبيق
 */

// Loader for SweetAlert2 to ensure `Swal` is available
let _swalLoaderConfig = null;
function loadSwalConfig() {
    if (window.Swal) return Promise.resolve(window.Swal);
    if (_swalLoaderConfig) return _swalLoaderConfig;
    _swalLoaderConfig = new Promise((resolve, reject) => {
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
            // local script loaded; ensure it actually defined Swal (handle HTML 404 served with 200)
            if (window.Swal) return resolve(window.Swal);
            // try CDN
            loadScript(cdnSrc, () => {
                if (window.Swal) return resolve(window.Swal);
                console.error('SweetAlert2 loaded but `Swal` not found');
                reject(new Error('SweetAlert2 loaded but `Swal` not found'));
            }, () => {
                console.error('Failed to load SweetAlert2 from CDN after local load');
                reject(new Error('Failed to load SweetAlert2 from CDN after local load'));
            });
        }, () => {
            // local failed -> try CDN
            loadScript(cdnSrc, () => {
                if (window.Swal) return resolve(window.Swal);
                console.error('SweetAlert2 loaded from CDN but `Swal` not found');
                reject(new Error('SweetAlert2 loaded from CDN but `Swal` not found'));
            }, () => {
                console.error('SweetAlert2 failed to load from local and CDN');
                reject(new Error('SweetAlert2 failed to load'));
            });
        });
    });
    return _swalLoaderConfig;
}

/**
 * عرض رسالة خطأ
 * @param {string} message - رسالة الخطأ
 * @param {string} title - عنوان الخطأ (اختياري)
 */
function showError(message, title = 'خطأ') {
    const config = {
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#e62a32',
        customClass: {
            popup: 'swal-arabic',
            title: 'swal-title-arabic',
            content: 'swal-content-arabic'
        }
    };
    return loadSwalConfig().then(swal => swal.fire(config));
}

/**
 * عرض رسالة تحذير
 * @param {string} message - رسالة التحذير
 * @param {string} title - عنوان التحذير (اختياري)
 */
function showWarning(message, title = 'تحذير') {
    const config = {
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#f59e0b',
        customClass: {
            popup: 'swal-arabic',
            title: 'swal-title-arabic',
            content: 'swal-content-arabic'
        }
    };
    return loadSwalConfig().then(swal => swal.fire(config));
}

/**
 * عرض رسالة نجاح
 * @param {string} message - رسالة النجاح
 * @param {string} title - عنوان النجاح (اختياري)
 * @param {number} timer - الوقت بالثواني قبل الإغلاق التلقائي (اختياري)
 */
function showSuccess(message, title = 'نجح', timer = null) {
    const config = {
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#10b981',
        customClass: {
            popup: 'swal-arabic',
            title: 'swal-title-arabic',
            content: 'swal-content-arabic'
        }
    };
    
    if (timer) {
        config.timer = timer * 1000;
        config.showConfirmButton = false;
    }
    
    return loadSwalConfig().then(swal => swal.fire(config));
}

/**
 * عرض رسالة تأكيد
 * @param {string} message - رسالة التأكيد
 * @param {string} title - عنوان التأكيد (اختياري)
 * @param {function} onConfirm - دالة التنفيذ عند التأكيد
 */
function showConfirm(message, title = 'تأكيد', onConfirm = null) {
    const config = {
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: 'نعم',
        cancelButtonText: 'لا',
        confirmButtonColor: '#e62a32',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'swal-arabic',
            title: 'swal-title-arabic',
            content: 'swal-content-arabic'
        }
    };
    return loadSwalConfig().then(swal => swal.fire(config).then((result) => {
        if (result.isConfirmed && onConfirm) {
            onConfirm();
        }
        return result;
    }));
}

/**
 * عرض رسالة تحميل
 * @param {string} message - رسالة التحميل
 */
function showLoading(message = 'جاري المعالجة...') {
    const config = {
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: (popup) => {
            // `swal` instance will call showLoading
            if (window.Swal && typeof window.Swal.showLoading === 'function') window.Swal.showLoading();
        },
        customClass: {
            popup: 'swal-arabic',
            title: 'swal-title-arabic'
        }
    };
    return loadSwalConfig().then(swal => swal.fire(config));
}

/**
 * إغلاق رسالة SweetAlert
 */
function closeSwal() {
    if (window.Swal && typeof window.Swal.close === 'function') {
        window.Swal.close();
    }
}

// إضافة CSS للعربية
if (document.head) {
    const style = document.createElement('style');
    style.textContent = `
        .swal-arabic {
            font-family: 'Cairo', 'Montserrat', sans-serif;
            direction: rtl;
            text-align: right;
        }
        .swal-title-arabic {
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
        }
        .swal-content-arabic {
            font-family: 'Montserrat', sans-serif;
        }
    `;
    document.head.appendChild(style);
}



