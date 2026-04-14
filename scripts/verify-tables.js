/**
 * Verify Database Tables
 * التحقق من وجود جداول قاعدة البيانات
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyTables() {
  const verifyDbHost = process.env.DB_HOST || 'localhost';
  const verifyUseSsl = !['localhost', '127.0.0.1', '::1'].includes(verifyDbHost);
  const verifyDbPort = process.env.DB_PORT
    ? Number(process.env.DB_PORT)
    : verifyUseSsl
      ? 4000
      : 3306;

  const connection = await mysql.createConnection({
    host: verifyDbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Foodna_Online',
    port: verifyDbPort,
    ssl: verifyUseSsl
      ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
      : false
  });

  try {
    console.log('🔍 Checking database tables...\n');

    // Check for Orders table
    try {
      const [orders] = await connection.query('DESCRIBE Orders');
      console.log('✅ Orders table exists');
      console.log('   Columns:', orders.map(col => col.Field).join(', '));
    } catch (err) {
      console.log('❌ Orders table NOT found');
    }

    // Check for Order_Items table
    try {
      const [items] = await connection.query('DESCRIBE Order_Items');
      console.log('✅ Order_Items table exists');
      console.log('   Columns:', items.map(col => col.Field).join(', '));
    } catch (err) {
      console.log('❌ Order_Items table NOT found');
    }

    // Check for Order_Discounts table
    try {
      const [discounts] = await connection.query('DESCRIBE Order_Discounts');
      console.log('✅ Order_Discounts table exists');
      console.log('   Columns:', discounts.map(col => col.Field).join(', '));
    } catch (err) {
      console.log('❌ Order_Discounts table NOT found');
    }

    // Check for Products table
    try {
      const [products] = await connection.query('DESCRIBE Products');
      console.log('✅ Products table exists');
      console.log('   Columns:', products.map(col => col.Field).join(', '));
    } catch (err) {
      console.log('❌ Products table NOT found');
    }

    // Check for Coupons table
    try {
      const [coupons] = await connection.query('DESCRIBE Coupons');
      console.log('✅ Coupons table exists');
      console.log('   Columns:', coupons.map(col => col.Field).join(', '));
    } catch (err) {
      console.log('❌ Coupons table NOT found');
    }

    // Test inserting a sample order
    console.log('\n🧪 Testing order creation...');
    try {
      const [result] = await connection.query(
        `INSERT INTO Orders (Customer_ID, Total_Amount, Order_Status, Delivery_Address, Payment_Method, Created_At)
         VALUES (NULL, 100.00, 'Pending', 'Test', 'cash', NOW())`
      );
      
      const orderId = result.insertId;
      console.log('✅ Sample order created with ID:', orderId);

      // Try to add an item
      try {
        await connection.query(
          `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price)
           VALUES (?, ?, ?, ?)`,
          [orderId, 1, 1, 50.00]
        );
        console.log('✅ Sample order item added');
      } catch (itemErr) {
        console.log('❌ Failed to add order item:', itemErr.message);
      }

      // Clean up - delete the test order
      await connection.query('DELETE FROM Orders WHERE Order_ID = ?', [orderId]);
      console.log('✅ Test order cleaned up');
    } catch (testErr) {
      console.log('❌ Failed to create test order:', testErr.message);
      console.log('   Error code:', testErr.code);
      console.log('   Error SQL:', testErr.sql);
    }

  } finally {
    await connection.end();
    console.log('\n✅ Database verification complete!');
  }
}

verifyTables().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
