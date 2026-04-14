/* Initialize Swiper carousels with RTL support and improved responsive design.
   Handles product carousels with proper navigation, spacing, and RTL layout.
*/
(function () {
  function initProductSwipers() {
    if (typeof Swiper === 'undefined') {
      console.warn('⚠️ Swiper not loaded');
      return;
    }

    // Detect RTL from document direction
    const isRTL = document.documentElement.dir === 'rtl' || 
                  window.getComputedStyle(document.documentElement).direction === 'rtl';
    
    console.log('📱 Initializing Swipers. RTL:', isRTL);

    const containers = Array.from(document.querySelectorAll('.products-card.swiper'));
    console.log(`🔄 Found ${containers.length} Swiper containers`);
    
    containers.forEach((container, idx) => {
      // Avoid re-initialization
      if (container.dataset.swiperInitialized === 'true') {
        console.log(`⏭️ Swiper ${idx} already initialized`);
        return;
      }

      const wrapper = container.querySelector('.swiper-wrapper');
      const navPrev = container.querySelector('.swiper-button-prev');
      const navNext = container.querySelector('.swiper-button-next');

      if (!wrapper) {
        console.warn(`⚠️ Swiper ${idx}: No wrapper found`);
        return;
      }

      // Ensure slides have proper class
      const slideCount = wrapper.children.length;
      Array.from(wrapper.children).forEach((child, i) => {
        if (!child.classList.contains('swiper-slide')) {
          child.classList.add('swiper-slide');
        }
      });

      console.log(`✅ Swiper ${idx}: Found ${slideCount} slides`);

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
          
          // Responsive breakpoints (mobile first)
          slidesPerView: 1,
          spaceBetween: 12,
          
          breakpoints: {
            320: {
              slidesPerView: 1.2,
              spaceBetween: 12,
            },
            480: {
              slidesPerView: 1.5,
              spaceBetween: 14,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            992: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
            1200: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          },

          // Navigation
          navigation: {
            nextEl: navNext,
            prevEl: navPrev,
            disabledClass: 'swiper-button-disabled',
          },

          // Auto-disable buttons at edges
          on: {
            init: function() {
              console.log(`✅ Swiper ${idx} initialized with ${slideCount} slides`);
            },
            slideChange: function() {
              console.log(`🔄 Swiper ${idx}: Slide changed`);
            },
          }
        });

        container.dataset.swiperInitialized = 'true';
        container.dataset.swiperInstance = idx;
        console.log(`✅ Swiper ${idx} successfully initialized`);
      } catch (err) {
        console.error(`❌ Swiper ${idx} initialization failed:`, err.message);
      }
    });
  }

  // Initialize on DOM ready
  function onDOMReady() {
    console.log('🔵 DOM ready. Initializing Swipers...');
    setTimeout(initProductSwipers, 100);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    onDOMReady();
  } else {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  }
  
  // Also initialize on page load (backup)
  window.addEventListener('load', () => {
    console.log('🔵 Page fully loaded. Re-checking Swipers...');
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
      console.log('🔄 Detected new carousels. Re-initializing...');
      setTimeout(initProductSwipers, 100);
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
})();
