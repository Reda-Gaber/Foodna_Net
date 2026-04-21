/**
 * checkout.js - يوجّه لصفحة /checkout بدل فتح modal
 * تم تعديله للتوافق مع صفحة الـ checkout الجديدة
 */
(function(){

  /**
   * openCheckoutModal - محوّل للـ redirect
   * محتفظ بنفس الاسم للتوافق مع أي كود تاني بيستدعيها
   */
  function openCheckoutModal(cartItems, totalAmount){
    if (!cartItems || cartItems.length === 0) return;
    // روح لصفحة الـ checkout مباشرة
    window.location.href = '/checkout';
  }

  window.openCheckoutModal = openCheckoutModal;

  // عند تحميل الصفحة - لو في سلة معلقة بعد تسجيل الدخول
  document.addEventListener('DOMContentLoaded', function(){
    try{
      const intent  = localStorage.getItem('checkoutIntent');
      const pending = localStorage.getItem('pendingCart');
      if (intent && pending){
        // امسح الـ flag ووجّه لصفحة الـ checkout
        localStorage.removeItem('checkoutIntent');
        localStorage.removeItem('postAuthRedirect');
        // السلة موجودة، روح للـ checkout يحمّلها
        if (window.location.pathname !== '/checkout'){
          window.location.href = '/checkout';
        }
      }
    }catch(e){
      console.warn('[Checkout] Rehydrate failed', e && e.message ? e.message : e);
    }
  });

})();