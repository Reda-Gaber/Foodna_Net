// ── Tabs ──
function phTab(name, btn) {
  document.querySelectorAll('.ph-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ph-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('ph-' + name).classList.add('active');
  btn.classList.add('active');
  if (name === 'orders') loadOrders();
}

// ── Toast ──
function toast(msg, type = '') {
  const t = document.getElementById('phToast');
  const icons = { ok: '✓', err: '✕', '': 'ℹ' };
  t.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  t.className = 'ph-toast ' + type + ' show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Toggle password ──
function togglePass(id, icon) {
  const inp = document.getElementById(id);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  icon.className = (show ? 'ri-eye-line' : 'ri-eye-off-line') + ' ph-eye';
}

// ── Update profile ──
document.getElementById('infoForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('saveInfoBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line"></i> جاري الحفظ...';
  const body = Object.fromEntries(new FormData(e.target));
  try {
    const res  = await fetch('/user/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok && data.success) toast('تم حفظ البيانات بنجاح ✓', 'ok');
    else toast(data.message || 'حدث خطأ', 'err');
  } catch { toast('خطأ في الاتصال', 'err'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-save-3-line"></i> حفظ التغييرات';
  }
});

// ── Update password ──
document.getElementById('passForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('savePassBtn');
  const fd  = new FormData(e.target);
  const np  = fd.get('newPassword');
  const cp  = fd.get('confirmPassword');
  if (np !== cp) { toast('كلمتا المرور غير متطابقتين', 'err'); return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line"></i> جاري التحديث...';
  try {
    const res  = await fetch('/user/api/update-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword: fd.get('currentPassword'), newPassword: np })
    });
    const data = await res.json();
    if (res.ok && data.success) { toast('تم تغيير كلمة المرور ✓', 'ok'); e.target.reset(); }
    else toast(data.message || 'حدث خطأ', 'err');
  } catch { toast('خطأ في الاتصال', 'err'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-key-2-line"></i> تحديث كلمة المرور';
  }
});

// ── Orders ──
const statusMap = {
  Pending:    { ar: 'قيد الانتظار', cls: 'b-pending' },
  Processing: { ar: 'تحت التجهيز',  cls: 'b-processing' },
  Ready:      { ar: 'جاهز للتسليم', cls: 'b-ready' },
  Processing: { ar: 'قيد الإعداد',   cls: 'b-processing' },
  Delivered:  { ar: 'تم التسليم',   cls: 'b-delivered' },
  Cancelled:  { ar: 'ملغى',         cls: 'b-cancelled' }
};
const payMap = { cash: 'دفع عند الاستلام', card: 'بطاقة ائتمان', online: 'محفظة إلكترونية' };

let ordersLoaded = false;

async function loadOrders() {
  if (ordersLoaded) return;
  try {
    const res  = await fetch('/api/orders', { credentials: 'include' });
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    document.getElementById('ordLoading').style.display = 'none';
    const orders = data.data || data;
    if (Array.isArray(orders) && orders.length) {
      renderOrders(orders);
      ordersLoaded = true;
    } else {
      document.getElementById('ordEmpty').style.display = 'block';
    }
  } catch {
    document.getElementById('ordLoading').innerHTML = '<p style="color:#dc2626;text-align:center">خطأ في تحميل الطلبات، حاول مرة أخرى</p>';
  }
}

function renderOrders(orders) {
  document.getElementById('ordList').innerHTML = orders.map(o => {
    const s    = statusMap[o.Order_Status] || { ar: o.Order_Status, cls: '' };
    const date = new Date(o.Created_At).toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });
    const canCancel = o.Order_Status === 'Pending';
    return `
    <div class="ord-card">
      <div class="ord-top">
        <div class="ord-id"><i class="ri-receipt-2-line" style="color:var(--brand)"></i> طلب #${o.Order_ID}</div>
        <span class="ord-badge ${s.cls}">${s.ar}</span>
      </div>
      <div class="ord-meta">
        <span><i class="ri-calendar-event-line"></i>${date}</span>
        <span><i class="ri-map-pin-2-line"></i>${o.Delivery_Address || 'في المتجر'}</span>
        <span><i class="ri-bank-card-line"></i>${payMap[o.Payment_Method] || o.Payment_Method || ''}</span>
      </div>
      <div class="ord-foot">
        <div class="ord-total">${parseFloat(o.Total_Amount || 0).toFixed(2)} جنيه</div>
        <div class="ord-actions">
          ${canCancel ? `<button class="ord-btn ord-btn-red" onclick="cancelOrd(${o.Order_ID},this)">
            <i class="ri-close-circle-line"></i> إلغاء
          </button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

async function cancelOrd(id, btn) {
  if (!confirm('هل تريد إلغاء الطلب #' + id + '؟')) return;
  btn.disabled = true;
  btn.textContent = 'جاري الإلغاء...';
  try {
    const res  = await fetch('/api/orders/' + id, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.success) {
      toast('تم إلغاء الطلب #' + id + ' ✓', 'ok');
      ordersLoaded = false;
      document.getElementById('ordList').innerHTML = '';
      document.getElementById('ordLoading').style.display = 'block';
      loadOrders();
    } else {
      toast(data.message || 'فشل الإلغاء', 'err');
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-close-circle-line"></i> إلغاء';
    }
  } catch {
    toast('خطأ في الاتصال', 'err');
    btn.disabled = false;
  }
}

// ── Upload Avatar ──
async function uploadAvatar(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  // preview فوري
  const ring = document.getElementById('avatarRing');
  const reader = new FileReader();
  reader.onload = e => {
    ring.querySelector('i') && ring.querySelector('i').remove();
    let img = document.getElementById('avatarImg');
    if (!img) {
      img = document.createElement('img');
      img.id = 'avatarImg';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
      ring.insertBefore(img, ring.firstChild);
    }
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  // رفع الصورة
  const progress = document.getElementById('avatarProgress');
  const bar      = document.getElementById('avatarBar');
  if (progress) progress.style.display = 'block';

  // simulate progress
  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(pct + 10, 85);
    if (bar) bar.style.width = pct + '%';
  }, 100);

  try {
    const fd = new FormData();
    fd.append('avatar', file);
    const res  = await fetch('/user/api/update', {
      method: 'POST',
      credentials: 'include',
      body: fd
    });
    const data = await res.json();
    clearInterval(tick);
    if (bar) bar.style.width = '100%';
    setTimeout(() => { if (progress) progress.style.display = 'none'; }, 600);
    if (res.ok && data.success) {
      toast('تم تحديث الصورة الشخصية ✓', 'ok');
    } else {
      toast(data.message || 'فشل رفع الصورة', 'err');
    }
  } catch(e) {
    clearInterval(tick);
    if (progress) progress.style.display = 'none';
    toast('خطأ في الاتصال', 'err');
  }
  input.value = '';
}

// ── Load full profile data ──
(async function() {
  try {
    const res  = await fetch('/user/api/me', { credentials: 'include' });
    if (!res.ok) return;
    const json = await res.json();
    const u    = json.data || {};
    const set  = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.value = val; };
    set('[name="name"]',    u.name);
    set('[name="email"]',   u.email);
    set('[name="phone"]',   u.phone);
    set('[name="address"]', u.address);
    // Hero
    const h2 = document.querySelector('.ph-hero h2');
    const p  = document.querySelector('.ph-hero p');
    if (h2 && u.name)  h2.textContent = u.name;
    if (p  && u.email) p.innerHTML = '<i class="ri-mail-line"></i> ' + u.email;
    // Avatar
    if (u.avatar) {
      const ring = document.querySelector('.ph-avatar-ring');
      if (ring) ring.innerHTML = '<img src="' + u.avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
    }
  } catch(e) {}
})();

// ── Logout ──
async function doLogout() {
  try { await fetch('/user/logout', { credentials: 'include' }); } catch(_) {}
  try { localStorage.clear(); } catch(_) {}
  window.location.replace('/user/register');
}

// فتح tab الطلبات لو في URL ?tab=orders
if (new URLSearchParams(location.search).get('tab') === 'orders') {
  phTab('orders', document.querySelectorAll('.ph-tab')[1]);
}