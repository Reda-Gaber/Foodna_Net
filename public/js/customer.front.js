/* Initialize Swiper carousels with RTL support and improved responsive design.
   Handles product carousels with proper navigation, spacing, and RTL layout.
*/
(function () {
  function initProductSwipers() {
    if (typeof Swiper === 'undefined') {
      return;
    }

    // Detect RTL from document direction
    const isRTL = document.documentElement.dir === 'rtl' || 
                  window.getComputedStyle(document.documentElement).direction === 'rtl';

    const containers = Array.from(document.querySelectorAll('.products-card.swiper'));
    
    containers.forEach((container, idx) => {
      // Avoid re-initialization
      if (container.dataset.swiperInitialized === 'true') {
        return;
      }

      const wrapper = container.querySelector('.swiper-wrapper');
      const navPrev = container.querySelector('.swiper-button-prev');
      const navNext = container.querySelector('.swiper-button-next');

      if (!wrapper) {
        return;
      }

      // Ensure slides have proper class
      const slideCount = wrapper.children.length;
      Array.from(wrapper.children).forEach((child, i) => {
        if (!child.classList.contains('swiper-slide')) {
          child.classList.add('swiper-slide');
        }
      });

      try {


//      


        // Instantiate Swiper with responsive config
        const swiperInstance = new Swiper(container, {
           direction: 'horizontal',
            rtl: false,
          loop: false,
          grabCursor: true,
          centeredSlides: false,
          initialSlide: 0,

          // منع التجاوز والauto-calculating
          watchOverflow: true,
          allowTouchMove: true,
          slidesPerView: 3, // إجبار عرض 3 منتجات دائماً
          spaceBetween: 20, // مسافة ثابتة
          slidesPerGroup: 3, // عدد المنتجات التي تتحرك في كل مرة
          centeredSlides: false,
          centerInsufficientSlides: false, // لا توسيط الشرائح إذا كانت أقل

          // Responsive breakpoints - الحفاظ على 3 منتجات كحد أقصى
          breakpoints: {
            320: {
              slidesPerView: 1, // في الشاشات الصغيرة جداً: منتج واحد
              spaceBetween: 10,
            },
            480: {
              slidesPerView: 2, // في الشاشات المتوسطة: منتجان
              spaceBetween: 15,
            },
            768: {
              slidesPerView: 3, // في الشاشات الكبيرة: 3 منتجات
              spaceBetween: 20,
            },
            992: {
              slidesPerView: 3, // الحفاظ على 3 منتجات
              spaceBetween: 20,
            },
            1200: {
              slidesPerView: 3, // الحفاظ على 3 منتجات
              spaceBetween: 24,
            },
          },

          // Navigation
          navigation: {
            nextEl: navNext,
            prevEl: navPrev,
            disabledClass: 'swiper-button-disabled',
          },

            on: {
            init: function() {
              // force slides to respect swiper width instead of their own fixed width
              this.slides.forEach(slide => {
                const card = slide.querySelector('.product, .product_only');
                if (card) {
                  card.style.width = '100%';
                  card.style.maxWidth = '100%';
                  card.style.minWidth = 'unset';
                }
              });
            },
            slideChange: function() {
            },
          }
        });

        container.dataset.swiperInitialized = 'true';
        container.dataset.swiperInstance = idx;
      } catch (err) {
      }
    });
  }

  // Initialize on DOM ready
  function onDOMReady() {
    setTimeout(initProductSwipers, 100);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    onDOMReady();
  } else {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  }
  
  // Also initialize on page load (backup)
  window.addEventListener('load', () => {
    setTimeout(initProductSwipers, 100);
  });

  // Re-initialize if new carousels are added dynamically
  const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        for (const node of m.addedNodes) {
          if (node.classList && node.classList.contains('products-card')) {
            hasNewNodes = true;
            break;
          }
        }
      }
    }
    if (hasNewNodes) {
      setTimeout(initProductSwipers, 100);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
})();
