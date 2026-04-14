/**
 * Dark Mode Handler
 * تطبيق الوضع الليلي والنهاري
 * هذا الملف يعمل في جميع صفحات الموقع
 */

(function() {
  'use strict';

  // ============================
  // DARK MODE - تبديل الوضع الليلي
  // ============================
  const themButton = document.getElementById('theme-button');
  const darkTheme = 'dark-theme';
  const iconTheme = 'ri-sun-line';

  if (!themButton) {
    console.warn('⚠️ Theme button not found on this page');
    return;
  }

  console.log('✅ Dark mode initialized on page load');

  // ============================
  // تحميل الحالة المحفوظة
  // ============================
  const savedTheme = localStorage.getItem('selected-theme');
  const savedIcon = localStorage.getItem('selected-icon');

  // تطبيق الوضع المحفوظ
  if (savedTheme === 'dark') {
    document.body.classList.add(darkTheme);
    themButton.classList.add(iconTheme); // تغيير الأيقونة إلى sun
  } else {
    document.body.classList.remove(darkTheme);
    themButton.classList.remove(iconTheme); // تغيير الأيقونة إلى moon
  }

  // ============================
  // دوال مساعدة
  // ============================
  const getCurrentTheme = () => 
    document.body.classList.contains(darkTheme) ? 'dark' : 'light';

  const getCurrentIcon = () => 
    themButton.classList.contains(iconTheme) ? 'ri-sun-line' : 'ri-moon-line';

  // ============================
  // الاستماع لنقرات زر تبديل الوضع
  // ============================
  themButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    console.log('🌓 Dark mode button clicked');
    
    // تبديل الفئة
    document.body.classList.toggle(darkTheme);
    themButton.classList.toggle(iconTheme);

    // حفظ الاختيار في localStorage
    const newTheme = getCurrentTheme();
    const newIcon = getCurrentIcon();
    
    localStorage.setItem('selected-theme', newTheme);
    localStorage.setItem('selected-icon', newIcon);

    console.log('✨ Theme switched to:', newTheme);
    console.log('🎨 Icon changed to:', newIcon);
  });

  // ============================
  // تطبيق الوضع عند تغييره في نافذة أخرى
  // ============================
  window.addEventListener('storage', (e) => {
    if (e.key === 'selected-theme') {
      const newTheme = e.newValue;
      
      if (newTheme === 'dark') {
        document.body.classList.add(darkTheme);
        themButton.classList.add(iconTheme);
      } else {
        document.body.classList.remove(darkTheme);
        themButton.classList.remove(iconTheme);
      }
      
      console.log('🔄 Theme updated from another tab/window:', newTheme);
    }
  });

  console.log('✅ Dark mode system fully initialized');
})();
