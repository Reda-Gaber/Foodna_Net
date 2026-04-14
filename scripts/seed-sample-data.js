/**
 * ============================================
 * Foodna Shop - Sample Data Seeding Script
 * ============================================
 * هذا السكريبت يضيف بيانات تجريبية للاختبار
 * 
 * الاستخدام:
 * node scripts/seed-sample-data.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const sampleDbHost = process.env.DB_HOST || 'localhost';
const sampleUseSsl = !['localhost', '127.0.0.1', '::1'].includes(sampleDbHost);
const sampleDbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : sampleUseSsl
    ? 4000
    : 3306;

const pool = mysql.createPool({
  host: sampleDbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: sampleDbPort,
  ssl: sampleUseSsl
    ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============================================
// بيانات تجريبية - العملاء
// ============================================
const sampleCustomers = [
  {
    email: 'ahmed@example.com',
    password: 'password123', // سيتم تشفيره
    name: 'أحمد محمود',
    phone: '0123456789'
  },
  {
    email: 'fatima@example.com',
    password: 'password123',
    name: 'فاطمة علي',
    phone: '0987654321'
  },
  {
    email: 'sara@example.com',
    password: 'password123',
    name: 'سارة محمد',
    phone: '0555888999'
  },
  {
    email: 'mohannad@example.com',
    password: 'password123',
    name: 'محنان حسن',
    phone: '0777666555'
  },
  {
    email: 'layla@example.com',
    password: 'password123',
    name: 'ليلى عمرو',
    phone: '0999888777'
  }
];

// ============================================
// بيانات تجريبية - التصنيفات
// ============================================
const sampleCategories = [
  { name: 'برجر', description: 'برجر لذيذ وشهي' },
  { name: 'فراخ', description: 'دجاج طازج ومشوي' },
  { name: 'بيتزا', description: 'بيتزا إيطالية أصلية' },
  { name: 'ساندويتشات', description: 'ساندويتشات متنوعة' },
  { name: 'مشروبات', description: 'عصائر ومشروبات منعشة' },
  { name: 'حلويات', description: 'حلويات لذيذة' }
];

// ============================================
// بيانات تجريبية - المنتجات
// ============================================
const sampleProducts = [
  {
    name: 'برجر دجاج مشوي',
    description: 'برجر طازج مع دجاج مشوي وخضار طازة',
    price: 45.00,
    category: 'برجر',
    image: '1762902237154-645538955.png'
  },
  {
    name: 'برجر لحم بقري',
    description: 'برجر فاخر مع لحم بقري محروق برفق',
    price: 55.00,
    category: 'برجر',
    image: '1762909185861-969414054.png'
  },
  {
    name: 'دجاج مقلي حار',
    description: 'دجاج مقلي بتوابل خاصة حارة جداً',
    price: 50.00,
    category: 'فراخ',
    image: '1762935081163-376096564.png'
  },
  {
    name: 'دجاج مشوي عادي',
    description: 'دجاج مشوي بطريقة تقليدية لذيذة',
    price: 48.00,
    category: 'فراخ',
    image: '1762935130403-942859508.png'
  },
  {
    name: 'بيتزا فراخ',
    description: 'بيتزا بيضاء مع فراخ وجبنة موتزاريلا',
    price: 60.00,
    category: 'بيتزا',
    image: '1762935250639-132375204.png'
  },
  {
    name: 'بيتزا دجاج باربيكيو',
    description: 'بيتزا برايم مع دجاج بصلصة باربيكيو',
    price: 65.00,
    category: 'بيتزا',
    image: '1762935312969-229292621.png'
  },
  {
    name: 'ساندويتش فراخ',
    description: 'ساندويتش فراخ طازج مع صلصات خاصة',
    price: 35.00,
    category: 'ساندويتشات',
    image: 'Screenshot from 2025-11-09 02-15-13.png'
  },
  {
    name: 'ساندويتش الشاورما',
    description: 'شاورما لحم لذيذة مع تتبيلة خاصة',
    price: 40.00,
    category: 'ساندويتشات',
    image: 'Screenshot from 2025-11-09 02-15-39.png'
  },
  {
    name: 'عصير برتقال طازج',
    description: 'عصير برتقال طازج مصنوع من برتقال بلدي',
    price: 20.00,
    category: 'مشروبات',
    image: 'Screenshot from 2025-11-09 02-16-07.png'
  },
  {
    name: 'عصير تفاح طازج',
    description: 'عصير تفاح حلو ومنعش في الصيف',
    price: 18.00,
    category: 'مشروبات',
    image: 'Screenshot from 2025-11-09 02-16-19.png'
  }
];

// ============================================
// دالة لتشفير كلمة المرور (bcrypt)
// ============================================
async function hashPassword(password) {
  const bcrypt = require('bcrypt');
  return bcrypt.hash(password, 10);
}

// ============================================
// دالة لإضافة العملاء
// ============================================
async function seedCustomers(connection) {
  console.log('🔄 جاري إضافة العملاء...');
  
  for (const customer of sampleCustomers) {
    const hashedPassword = await hashPassword(customer.password);
    
    try {
      await connection.execute(
        `INSERT INTO Customers (Email, Password, Customer_Name, Phone) 
         VALUES (?, ?, ?, ?)`,
        [customer.email, hashedPassword, customer.name, customer.phone]
      );
      console.log(`✅ تم إضافة: ${customer.name}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  العميل ${customer.email} موجود بالفعل`);
      } else {
        console.error(`❌ خطأ في إضافة ${customer.name}:`, error.message);
      }
    }
  }
}

// ============================================
// دالة لإضافة التصنيفات
// ============================================
async function seedCategories(connection) {
  console.log('\n🔄 جاري إضافة التصنيفات...');
  
  for (const category of sampleCategories) {
    try {
      await connection.execute(
        `INSERT INTO Categories (Category_Name, Description) 
         VALUES (?, ?)`,
        [category.name, category.description]
      );
      console.log(`✅ تم إضافة: ${category.name}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  التصنيف ${category.name} موجود بالفعل`);
      } else {
        console.error(`❌ خطأ في إضافة ${category.name}:`, error.message);
      }
    }
  }
}

// ============================================
// دالة لإضافة المنتجات
// ============================================
async function seedProducts(connection) {
  console.log('\n🔄 جاري إضافة المنتجات...');
  
  for (const product of sampleProducts) {
    try {
      await connection.execute(
        `INSERT INTO Products (Product_Name, Description, Price, Category, Image, Quantity) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [product.name, product.description, product.price, product.category, product.image, 50]
      );
      console.log(`✅ تم إضافة: ${product.name} - ${product.price} ج.م`);
    } catch (error) {
      console.error(`❌ خطأ في إضافة ${product.name}:`, error.message);
    }
  }
}

// ============================================
// دالة لإضافة طلبات تجريبية
// ============================================
async function seedOrders(connection) {
  console.log('\n🔄 جاري إضافة الطلبات...');
  
  try {
    // الحصول على معرفات العملاء والمنتجات
    const [customers] = await connection.execute(
      `SELECT Customer_ID, Customer_Name FROM Customers LIMIT 3`
    );
    
    const [products] = await connection.execute(
      `SELECT Product_ID, Product_Name, Price FROM Products LIMIT 5`
    );
    
    if (customers.length === 0 || products.length === 0) {
      console.log('⚠️  لا توجد عملاء أو منتجات لإنشاء طلبات');
      return;
    }
    
    // إنشاء 3 طلبات
    for (let i = 0; i < 3; i++) {
      const customer = customers[i % customers.length];
      const totalAmount = Math.random() * 200 + 100;
      const statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const [orderResult] = await connection.execute(
        `INSERT INTO Orders (Customer_ID, Total_Amount, Order_Status, Delivery_Address, Payment_Method) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          customer.Customer_ID,
          totalAmount.toFixed(2),
          status,
          customer.Customer_Name + ' - القاهرة',
          ['cash', 'card'][Math.floor(Math.random() * 2)]
        ]
      );
      
      const orderId = orderResult.insertId;
      
      // إضافة عناصر للطلب
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        await connection.execute(
          `INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, product.Product_ID, quantity, product.Price]
        );
      }
      
      console.log(`✅ تم إضافة طلب #${orderId} للعميل: ${customer.Customer_Name} - الحالة: ${status}`);
    }
  } catch (error) {
    console.error(`❌ خطأ في إضافة الطلبات:`, error.message);
  }
}

// ============================================
// الدالة الرئيسية
// ============================================
async function main() {
  let connection;
  
  try {
    console.log('\n🚀 بدء إضافة البيانات التجريبية...\n');
    
    connection = await pool.getConnection();
    
    await seedCustomers(connection);
    await seedCategories(connection);
    await seedProducts(connection);
    await seedOrders(connection);
    
    console.log('\n✅ تم بنجاح إضافة جميع البيانات التجريبية!\n');
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
