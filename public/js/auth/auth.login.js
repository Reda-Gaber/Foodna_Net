 const validationRules = {
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'البريد الإلكتروني غير صحيح'
            },
            password: {
                required: true,
                minLength: 6,
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
            }
        };

        // Clear error on input
        document.getElementById('email').addEventListener('input', function() {
            clearError('email');
        });

        document.getElementById('password').addEventListener('input', function() {
            clearError('password');
        });

        function clearError(fieldName) {
            const field = document.getElementById(fieldName);
            const errorElement = document.getElementById(fieldName + 'Error');
            
            field.classList.remove('error');
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }

        function showFieldError(fieldName, message) {
            const field = document.getElementById(fieldName);
            const errorElement = document.getElementById(fieldName + 'Error');
            
            field.classList.add('error');
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }

        function validateField(fieldName, value) {
            const rules = validationRules[fieldName];
            if (!rules) return true;

            // Check required
            if (rules.required && !value.trim()) {
                showFieldError(fieldName, `${fieldName === 'email' ? 'البريد الإلكتروني' : 'كلمة المرور'} مطلوب`);
                return false;
            }

            // Check email pattern
            if (fieldName === 'email' && value && !rules.pattern.test(value)) {
                showFieldError(fieldName, rules.message);
                return false;
            }

            // Check password min length
            if (fieldName === 'password' && value && value.length < rules.minLength) {
                showFieldError(fieldName, rules.message);
                return false;
            }

            clearError(fieldName);
            return true;
        }

        function validateForm() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            let isValid = true;

            if (!validateField('email', email)) {
                isValid = false;
            }

            if (!validateField('password', password)) {
                isValid = false;
            }

            return isValid;
        }

        // Form submission with validation
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear previous errors
            clearError('email');
            clearError('password');

            // Validate form
            if (!validateForm()) {
                showError('يرجى تصحيح الأخطاء في النموذج', 'خطأ في التحقق');
                return false;
            }

            const formData = new URLSearchParams();
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);

            // append optional next param so server can redirect back
            const params = new URLSearchParams(window.location.search);
            const next = params.get('next');
            if (next) formData.append('next', next);

            // Show loading
            showLoading('جاري تسجيل الدخول...');

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });

                const data = await response.json();

                closeSwal();

                if (data.success) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const nextParam = urlParams.get('next');
                    const redirectTo = nextParam ? decodeURIComponent(nextParam) : (data.redirect || '/');

                    showSuccess('تم تسجيل الدخول بنجاح', 'نجح', 1);
                    setTimeout(() => {
                        window.location.replace(redirectTo);
                    }, 300);
                } else {
                    showError(data.message || 'فشل تسجيل الدخول', 'خطأ في تسجيل الدخول');
                }
            } catch (error) {
                closeSwal();
                showError('حدث خطأ في الاتصال بالخادم', 'خطأ في الاتصال');
                console.error('Login error:', error);
            }

            return false;
        });