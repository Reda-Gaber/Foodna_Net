/**
 * ============================================
 * Foodna Shop - Complete Data Seeding Script
 * ============================================
 * يضيف 10 منتجات جديدة + 10 عملاء + 10 طلبات
 * 
 * الاستخدام:
 * node scripts/seed-complete-data.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const completeDbHost = process.env.DB_HOST || 'localhost';
const completeUseSsl = !['localhost', '127.0.0.1', '::1'].includes(completeDbHost);
const completeDbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : completeUseSsl
    ? 4000
    : 3306;

const pool = mysql.createPool({
  host: completeDbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: completeDbPort,
  ssl: completeUseSsl
    ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============================================
// 10 منتجات جديدة بأسماء عربية
// ============================================
const newProducts = [
  {
    name: 'برجر الكنج الملكي',
    description: 'برجر فاخر مع دجاج بتتبيلة خاصة وجبنة شيدر',
    price: 75.00,
    category: 'برجر',
    image: 'Screenshot from 2025-11-09 02-17-07.png'
  },
  {
    name: 'برجر التراجيدا',
    description: 'برجر دجاج مع بيكون لذيذ وخضار طازة',
    price: 70.00,
    category: 'برجر',
    image: 'Screenshot from 2025-11-09 02-17-12.png'
  },
  {
    name: 'فراخ بالزعتر والليمون',
    description: 'فراخ مشوية بتتبيلة الزعتر واللومي العراقي',
    price: 65.00,
    category: 'فراخ',
    image: 'Screenshot from 2025-11-09 02-17-16.png'
  },
  {
    name: 'فراخ الكسرولة',
    description: 'فراخ مطهوة في الفرن مع البصل والطماطم',
    price: 58.00,
    category: 'فراخ',
    image: 'Screenshot from 2025-11-09 02-17-22.png'
  },
  {
    name: 'بيتزا الدجاج المدخن',
    description: 'بيتزا شهية مع دجاج مدخن وصلصة باربيكيو',
    price: 70.00,
    category: 'بيتزا',
    image: 'Screenshot from 2025-11-09 02-17-33.png'
  },
  {
    name: 'بيتزا الخضار الفاخرة',
    description: 'بيتزا بجميع أنواع الخضار الطازة والزيتون',
    price: 55.00,
    category: 'بيتزا',
    image: 'Screenshot from 2025-11-09 02-17-43.png'
  },
  {
    name: 'ساندويتش الكفتة المشوية',
    description: 'كفتة لحم مشوية مع خضار وطحينة',
    price: 45.00,
    category: 'ساندويتشات',
    image: 'Screenshot from 2025-11-09 02-17-48.png'
  },
  {
    name: 'ساندويتش الجمبري',
    description: 'جمبري طازج مع صلصة خاصة وخضار',
    price: 55.00,
    category: 'ساندويتشات',
    image: 'Screenshot from 2025-11-09 02-17-53.png'
  },
  {
    name: 'عصير الفراولة والموز',
    description: 'عصير صحي من فراولة طازة وموز بلاش',
    price: 25.00,
    category: 'مشروبات',
    image: 'Screenshot from 2025-11-09 02-16-25.png'
  },
  {
    name: 'عصير الشمام والزنجبيل',
    description: 'عصير انتعاش مع شمام طازج وزنجبيل',
    price: 22.00,
    category: 'مشروبات',
    image: 'Screenshot from 2025-11-09 02-16-33.png'
  }
];

// ============================================
// 10 عملاء جدد بأسماء عربية
// ============================================
const newCustomers = [
  { email: 'karim.hassan@mail.com', password: 'pass123', name: 'كريم حسن', phone: '0101234567' },
  { email: 'leila.mahmoud@mail.com', password: 'pass123', name: 'ليلى محمود', phone: '0102345678' },
  { email: 'amira.khalid@mail.com', password: 'pass123', name: 'أميرة خالد', phone: '0103456789' },
  { email: 'hamza.ali@mail.com', password: 'pass123', name: 'حمزة علي', phone: '0104567890' },
  { email: 'hana.samir@mail.com', password: 'pass123', name: 'هنا سمير', phone: '0105678901' },
  { email: 'hassan.ibrahim@mail.com', password: 'pass123', name: 'حسن إبراهيم', phone: '0106789012' },
  { email: 'dina.youssef@mail.com', password: 'pass123', name: 'دينا يوسف', phone: '0107890123' },
  { email: 'tariq.walid@mail.com', password: 'pass123', name: 'طارق وليد', phone: '0108901234' },
  { email: 'noor.ahmed@mail.com', password: 'pass123', name: 'نور أحمد', phone: '0109012345' },
  { email: 'rania.hassan@mail.com', password: 'pass123', name: 'رانيا حسن', phone: '0110123456' }
];

// ============================================
// دالة تشفير كلمة المرور
// ============================================
async function hashPassword(password) {
  const bcrypt = require('bcrypt');
  return bcrypt.hash(password, 10);
}

// ============================================
// إضافة المنتجات الجديدة
// ============================================
async function seedNewProducts(connection) {
  console.log('\n🔄 جاري إضافة 10 منتجات جديدة...');
  let addedCount = 0;
  
  for (const product of newProducts) {
    try {
      await connection.execute(
        `INSERT INTO Products (Product_Name, Description, Price, Category, Image, Quantity) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product.name, product.description, product.price, product.category, product.image, 50]
      );
      console.log(`✅ ${product.name} - ${product.price} ج.م`);
      addedCount++;
    } catch (error) {
      console.error(`❌ خطأ: ${product.name}:`, error.message);
    }
  }
  return addedCount;
}

// ============================================
// إضافة عملاء جدد
// ============================================
async function seedNewCustomers(connection) {
  console.log('\n🔄 جاري إضافة 10 عملاء جدد...');
  let addedCount = 0;
  
  for (const customer of newCustomers) {
    try {
      const hashedPassword = await hashPassword(customer.password);
      await connection.execute(
        `INSERT INTO Customers (Email, Password, Customer_Name, Phone) 
         VALUES (?, ?, ?, ?)`,
        [customer.email, hashedPassword, customer.name, customer.phone]
      );
      console.log(`✅ ${customer.name} (${customer.email})`);
      addedCount++;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  ${customer.email} موجود بالفعل`);
      } else {
        console.error(`❌ خطأ: ${customer.name}:`, error.message);
      }
    }
  }
  return addedCount;
}

// ============================================
// إضافة 10 طلبات جديدة
// ============================================
async function seedNewOrders(connection) {
  console.log('\n🔄 جاري إضافة 10 طلبات جديدة...');
  
  try {
    // الحصول على جميع العملاء
    const [customers] = await connection.execute(
      `SELECT Customer_ID, Customer_Name FROM Customers ORDER BY RAND() LIMIT 15`
    );
    
    // الحصول على عينة من المنتجات
    const [products] = await connection.execute(
      `SELECT Product_ID, Product_Name, Price FROM Products ORDER BY RAND() LIMIT 20`
    );
    
    if (customers.length === 0 || products.length === 0) {
      console.log('⚠️  لا توجد عملاء أو منتجات كافية');
      return 0;
    }
    
    const statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
    let ordersCreated = 0;
    
    // إنشاء 10 طلبات
    for (let i = 0; i < 10; i++) {
      const customer = customers[i % customers.length];
      const itemCount = Math.floor(Math.random() * 3) + 2; // 2-4 منتجات لكل طلب
      let totalAmount = 0;
      
      // حساب الإجمالي أولاً
      const selectedProducts = [];
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        selectedProducts.push({ product, quantity });
        totalAmount += product.Price * quantity;
      }
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // إنشاء الطلب
      const [orderResult] = await connection.execute(
        `INSERT INTO Orders (Customer_ID, Total_Amount, Order_Status, Delivery_Address, Payment_Method) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          customer.Customer_ID,
          totalAmount.toFixed(2),
          status,
          customer.Customer_Name + ' - القاهرة',
          ['cash', 'card', 'online'][Math.floor(Math.random() * 3)]
        ]
      );
      
      const orderId = orderResult.insertId;
      
      // إضافة المنتجات للطلب
      for (const item of selectedProducts) {
        await connection.execute(
          `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product.Product_ID, item.quantity, item.product.Price]
        );
      }
      
      console.log(`✅ طلب #${orderId} - ${customer.Customer_Name} - ${totalAmount.toFixed(2)} ج.م - ${status}`);
      ordersCreated++;
    }
    
    return ordersCreated;
  } catch (error) {
    console.error(`❌ خطأ في إنشاء الطلبات:`, error.message);
    return 0;
  }
}

// ============================================
// تحديث أسماء المنتجات القديمة للعربية
// ============================================
async function updateOldProductNames(connection) {
  console.log('\n🔄 جاري تحديث أسماء المنتجات القديمة...');
  
  const updates = [
    { oldName: 'shawerma Checkin', newName: 'شاورما الدجاج الشهية' },
    { oldName: 'shawerma Checkin 1', newName: 'شاورما لحم بقري' },
    { oldName: 'pizza chicken', newName: 'بيتزا دجاج فاخرة' },
    { oldName: 'pizza 2', newName: 'بيتزا السوبريم' }
  ];
  
  for (const update of updates) {
    try {
      await connection.execute(
        `UPDATE Products SET Product_Name = ? WHERE Product_Name = ?`,
        [update.newName, update.oldName]
      );
      console.log(`✅ تم تحديث: ${update.oldName} → ${update.newName}`);
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${update.oldName}:`, error.message);
    }
  }
}

// ============================================
// الدالة الرئيسية
// ============================================
async function main() {
  let connection;
  
  try {
    console.log('\n🚀 بدء إضافة البيانات الكاملة...\n');
    console.log('═'.repeat(50));
    
    connection = await pool.getConnection();
    
    const productsAdded = await seedNewProducts(connection);
    const customersAdded = await seedNewCustomers(connection);
    const ordersAdded = await seedNewOrders(connection);
    await updateOldProductNames(connection);
    
    console.log('\n' + '═'.repeat(50));
    console.log('\n✅ ملخص البيانات المضافة:');
    console.log(`   • ${productsAdded} منتجات جديدة`);
    console.log(`   • ${customersAdded} عملاء جدد`);
    console.log(`   • ${ordersAdded} طلبات جديدة`);
    console.log('\n🎉 تم إكمال العملية بنجاح!\n');
  } catch (error) {
    console.error('\n❌ خطأ في البرنامج:', error.message);
  } finally {
    if (connection) {
      await connection.release();
    }
    await pool.end();
  }
}

// تشغيل البرنامج
main();
