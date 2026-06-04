(function() {
  'use strict';

  try {
    if (localStorage.getItem('selected-theme') === 'dark') {
      document.documentElement.classList.add('dark-theme');

      if (document.body) {
        document.body.classList.add('dark-theme');
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          document.body.classList.add('dark-theme');
        });
      }
    }
  } catch (err) {
    console.warn('Unable to restore dark mode early:', err);
  }
})();
