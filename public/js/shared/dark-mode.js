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
  const themeButton = document.getElementById('theme-button');
  const darkTheme = 'dark-theme';
  const iconTheme = 'ri-sun-line';

  // ============================
  // تحميل الحالة المحفوظة
  // ============================
  const savedTheme = localStorage.getItem('selected-theme');
  const savedIcon = localStorage.getItem('selected-icon');

  // تطبيق الوضع المحفوظ
  if (savedTheme === 'dark') {
    document.documentElement.classList.add(darkTheme);
    document.body.classList.add(darkTheme);
    if (themeButton) {
      themeButton.classList.add(iconTheme); // تغيير الأيقونة إلى sun
      themeButton.classList.remove('ri-moon-line');
    }
  } else {
    document.documentElement.classList.remove(darkTheme);
    document.body.classList.remove(darkTheme);
    if (themeButton) {
      themeButton.classList.remove(iconTheme); // تغيير الأيقونة إلى moon
      themeButton.classList.add('ri-moon-line');
    }
  }

  if (!themeButton) {
    return;
  }

  // ============================
  // دوال مساعدة
  // ============================
  const setDarkMode = (isDark) => {
    document.documentElement.classList[isDark ? 'add' : 'remove'](darkTheme);
    document.body.classList[isDark ? 'add' : 'remove'](darkTheme);
    themeButton.classList[isDark ? 'add' : 'remove'](iconTheme);
    themeButton.classList[isDark ? 'remove' : 'add']('ri-moon-line');
  };

  const getCurrentTheme = () =>
    document.documentElement.classList.contains(darkTheme) ? 'dark' : 'light';

  const getCurrentIcon = () =>
    themeButton.classList.contains(iconTheme) ? 'ri-sun-line' : 'ri-moon-line';

  // ============================
  // الاستماع لنقرات زر تبديل الوضع
  // ============================
  themeButton.addEventListener('click', (e) => {
    e.preventDefault();

    const isDark = !document.documentElement.classList.contains(darkTheme);
    setDarkMode(isDark);

    // حفظ الاختيار في localStorage
    const newTheme = getCurrentTheme();
    const newIcon = getCurrentIcon();

    localStorage.setItem('selected-theme', newTheme);
    localStorage.setItem('selected-icon', newIcon);
  });

  // ============================
  // تطبيق الوضع عند تغييره في نافذة أخرى
  // ============================
  window.addEventListener('storage', (e) => {
    if (e.key === 'selected-theme') {
      const newTheme = e.newValue;

      if (newTheme === 'dark') {
        setDarkMode(true);
      } else {
        setDarkMode(false);
      }
    }
  });
})();

