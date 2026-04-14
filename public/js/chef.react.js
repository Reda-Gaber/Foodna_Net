(function(){
  const { useState, useEffect } = React;
  const e = React.createElement;

  function timeElapsedString(ts){
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff/60000);
    const secs = Math.floor((diff%60000)/1000);
    return `${mins}:${String(secs).padStart(2,'0')}`;
  }

  function ChefApp(){
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unauth, setUnauth] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [showCustomers, setShowCustomers] = useState(false);

    useEffect(()=>{ fetchOrders(); const id = setInterval(fetchOrders,3000); return ()=>clearInterval(id); }, []);

    async function fetchOrders(){
      setLoading(true);
      try{
        const res = await fetch('/kitchen/api/orders', { credentials: 'include' });
        if (res.status===401){
          setOrders([]);
          setUnauth(true);
          setLoading(false);
          return;
        }
        setUnauth(false);
        const data = await res.json();
        if (data && data.success && data.data && data.data.orders){
          const list = (data.data.orders || []).map(o=>({ id:o.id, items:o.items||[], createdAt:o.createdAt, notes:o.notes||'', status:o.status }));
          setOrders(list);
        }
      }catch(err){ console.error(err); }
      setLoading(false);
    }

    // جلب العملاء (إذا كان هناك API متاح)
    async function fetchCustomers(){
      setLoadingCustomers(true);
      try{
        const res = await fetch('/api/customers', { credentials: 'include' });
        if (res.status === 401) { setCustomers([]); setLoadingCustomers(false); return; }
        const data = await res.json();
        // نتوقع الشكل: { success: true, data: { customers: [...] } }
        if (data && data.success && data.data && data.data.customers){
          setCustomers(data.data.customers);
        } else if (Array.isArray(data)) {
          // بعض الـ APIs قد يرجع مصفوفة مباشرة
          setCustomers(data);
        } else {
          setCustomers([]);
        }
      }catch(err){ console.error('fetchCustomers error', err); setCustomers([]); }
      setLoadingCustomers(false);
    }

    async function markPrepared(orderId){
      try{
        const res = await fetch('/kitchen/api/update', { method: 'POST', headers: {'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify({ orderId, status: 'Completed' }) });
        const data = await res.json();
        if (data.success){ 
          setOrders(prev => prev.filter(o => o.id !== orderId)); // Remove from list when completed
          alert('✅ تم تحديث الطلب بنجاح');
        }
        else alert(data.message || 'فشل التحديث');
      }catch(err){ console.error(err); alert('خطأ: ' + err.message); }
    }

    if (unauth) {
      return e('div', {className:'chef-react'},
        e('div', {className:'header', style:{marginBottom:12}}, e('h2',null,'طلبات المطبخ')),
        e('div', {style:{padding:20, textAlign:'center'}},
          e('p', {style:{fontSize:16, color:'#333'}}, 'انتهت الجلسة أو لا توجد صلاحية. الرجاء تسجيل الدخول.'),
          e('a', {href: '/register', style:{display:'inline-block',marginTop:10,background:'#ff6b6b',color:'#fff',padding:'10px 16px',borderRadius:6,textDecoration:'none'}}, 'تسجيل / دخول')
        )
      );
    }

    return e('div', {className:'chef-react'},
      e('div', {className:'header', style:{marginBottom:12}}, e('h2',null,'طلبات المطبخ')),
      e('div', {style:{textAlign:'center', marginBottom:12}},
        e('button', {className:'complete-btn', style:{background:'#fff', color:'#ff6b6b', border:'1px solid #ff6b6b', padding:'8px 12px', borderRadius:6, cursor:'pointer'}, onClick: ()=>{ setShowCustomers(s=>!s); if (!showCustomers) fetchCustomers(); }}, showCustomers ? 'اغلاق العملاء' : 'عرض العملاء')
      ),
      loading && orders.length===0 ? e('div',null,'جاري التحميل...') : null,
      !loading && orders.length===0 ? e('div',{className:'no-orders-container'}, e('div',{className:'no-orders-text'}, 'لا توجد طلبات')) : null,
      showCustomers ? e('div',{style:{maxWidth:'1200px',margin:'0 auto 1rem', padding:'0 1rem'}},
        loadingCustomers ? e('div', {style:{textAlign:'center', padding:12}}, 'جاري تحميل العملاء...') : null,
        e('div', {style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12}},
          customers.map(c => e('div',{key:c.id, style:{background:'#fff', padding:12, borderRadius:8, boxShadow:'0 4px 10px rgba(0,0,0,0.06)'}},
            e('div',{style:{fontWeight:700, marginBottom:6}}, c.name),
            e('div',{style:{fontSize:13, color:'#666'}}, c.phone || c.email || ''),
            e('div',{style:{marginTop:8, fontSize:13}}, 'طلبات: ' + (c.orders||0) + ' • ' + (c.totalSpent||'0.00') + ' ج.م')
          ))
        )
      ) : null,
      e('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:16}},
        orders.map(order => e('div',{key:order.id, className:'order-card', style:{background:'#fff',padding:12,borderRadius:10,opacity: order.status==='Delivered'?0.6:1}},
          e('div', {style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
            e('div',null, e('strong',null,'طلب رقم: '), e('span',null, order.id)),
            e('div',{style:{fontSize:12,padding:'2px 8px',borderRadius:4,background:order.status==='Pending'?'#ffc107':order.status==='Shipped'?'#17a2b8':'#28a745',color:'white'}}, order.status)
          ),
          e('div', {style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
            e('small',null, 'قبل: '+timeElapsedString(order.createdAt)),
            e('small',null, new Date(order.createdAt).toLocaleString('ar-EG'))
          ),
          e('div', null, order.items.map((it,idx)=> e('div',{key:idx, style:{padding:'6px 0',borderBottom:'1px dashed #eee'}}, e('div',{style:{fontWeight:700}}, `${it.quantity}x ${it.name}`), it.options? e('div',null,it.options):null))),
          order.notes ? e('div',{style:{marginTop:8,fontStyle:'italic'}}, 'ملاحظة: '+order.notes) : null,
          order.address ? e('div',{style:{marginTop:6,fontSize:13,color:'#555'}}, e('strong',null,'العنوان: '), e('span',null, order.address)) : null,
          order.phone ? e('div',{style:{marginTop:4,fontSize:13,color:'#555'}}, e('strong',null,'هاتف: '), e('span',null, order.phone)) : null,
          order.status !== 'Delivered' ? e('div',{style:{marginTop:10}}, e('button',{className:'complete-btn', onClick: ()=>markPrepared(order.id)}, 'تم التجهيز')) : e('div',{style:{marginTop:10,padding:'0.75rem',background:'#d4edda',color:'#155724',borderRadius:6,textAlign:'center',fontWeight:500}}, '✅ تم تسليم الطلب')
        ))
      )
    );
  }

  const root = document.getElementById('chef-root');
  if (root) ReactDOM.createRoot(root).render(React.createElement(ChefApp));
})();
