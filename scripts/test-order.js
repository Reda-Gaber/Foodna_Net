/**
 * Test Cashier Order Creation
 * اختبار إنشاء الطلب من الكاشير
 */

async function testOrderCreation() {
  const baseUrl = 'http://localhost:3001';
  
  const orderData = {
    items: [
      { productId: 67, quantity: 2, price: 111 },
      { productId: 70, quantity: 1, price: 100 }
    ],
    totalAmount: 322,
    paymentMethod: 'cash',
    discount: 0,
    couponCode: null,
    customerId: null,
    notes: ''
  };

  console.log('🧪 Testing order creation...\n');
  console.log('📤 Sending to:', `${baseUrl}/cashier/api/orders`);
  console.log('📦 Order data:', JSON.stringify(orderData, null, 2));

  try {
    const response = await fetch(`${baseUrl}/cashier/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📩 Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Order created successfully!');
      console.log('📋 Order ID:', data.data.orderId);
      console.log('📝 Order Number:', data.data.orderNumber);
      console.log('💰 Final Amount:', data.data.finalAmount);
    } else {
      console.log('\n❌ Order creation failed!');
      console.log('💬 Message:', data.message);
    }
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

// Run the test
testOrderCreation();
