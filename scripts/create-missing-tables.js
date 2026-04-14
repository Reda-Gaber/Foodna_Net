/**
 * Create Missing Tables Script
 * إنشاء الجداول المفقودة في قاعدة البيانات
 * 
 * Usage: node scripts/create-missing-tables.js
 */

require('dotenv').config();
const db = require('../config/db');

async function createMissingTables() {
    try {
        console.log('🔄 بدء إنشاء الجداول المفقودة...\n');

        // إنشاء جدول Orders إذا لم يكن موجوداً
        await db.query(`
            CREATE TABLE IF NOT EXISTS Orders (
                Order_ID INT PRIMARY KEY AUTO_INCREMENT,
                Customer_ID INT NULL,
                Total_Amount DECIMAL(10, 2) NOT NULL,
                Status ENUM('Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled') DEFAULT 'Pending',
                Delivery_Address VARCHAR(500),
                Payment_Method ENUM('cash', 'card', 'online') DEFAULT 'cash',
                Kitchen_Status ENUM('pending', 'preparing', 'completed') DEFAULT 'pending',
                Kitchen_Completed_At TIMESTAMP NULL,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_customer (Customer_ID),
                INDEX idx_status (Status),
                INDEX idx_created (Created_At),
                INDEX idx_kitchen_status (Kitchen_Status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ جدول Orders جاهز');

        // إنشاء جدول Order_Items
        await db.query(`
            CREATE TABLE IF NOT EXISTS Order_Items (
                Order_Item_ID INT PRIMARY KEY AUTO_INCREMENT,
                Order_ID INT NOT NULL,
                Product_ID INT NOT NULL,
                Quantity INT NOT NULL,
                Price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
                FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE,
                INDEX idx_order (Order_ID),
                INDEX idx_product (Product_ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ جدول Order_Items تم إنشاؤه');

        // إنشاء جدول Reviews
        await db.query(`
            CREATE TABLE IF NOT EXISTS Reviews (
                Review_ID INT PRIMARY KEY AUTO_INCREMENT,
                Customer_ID INT NOT NULL,
                Product_ID INT NOT NULL,
                Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
                Comment TEXT,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_Id) ON DELETE CASCADE,
                FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE,
                UNIQUE KEY unique_review (Customer_ID, Product_ID),
                INDEX idx_product (Product_ID),
                INDEX idx_customer (Customer_ID),
                INDEX idx_rating (Rating)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ جدول Reviews جاهز');

        // إنشاء جدول Categories
        await db.query(`
            CREATE TABLE IF NOT EXISTS Categories (
                Category_ID INT PRIMARY KEY AUTO_INCREMENT,
                Category_Name VARCHAR(100) NOT NULL UNIQUE,
                Description TEXT,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_name (Category_Name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ جدول Categories جاهز');

        // إضافة Category_ID إلى Products إذا لم يكن موجوداً
        try {
            await db.query(`
                ALTER TABLE Products 
                ADD COLUMN Category_ID INT;
            `);
            console.log('✅ تم إضافة Category_ID إلى Products');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Category_ID موجود بالفعل في Products');
            } else {
                throw err;
            }
        }

        // إنشاء جدول Coupons
        await db.query(`
            CREATE TABLE IF NOT EXISTS Coupons (
                Coupon_ID INT PRIMARY KEY AUTO_INCREMENT,
                Code VARCHAR(50) NOT NULL UNIQUE,
                Discount_Type ENUM('percentage', 'fixed') NOT NULL,
                Discount_Value DECIMAL(10, 2) NOT NULL,
                Min_Purchase DECIMAL(10, 2) DEFAULT 0,
                Max_Discount DECIMAL(10, 2) NULL,
                Expiry_Date DATETIME NOT NULL,
                Usage_Limit INT NULL,
                Usage_Count INT DEFAULT 0,
                Is_Active BOOLEAN DEFAULT TRUE,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_code (Code),
                INDEX idx_active (Is_Active),
                INDEX idx_expiry (Expiry_Date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ جدول Coupons جاهز');

        // إنشاء جدول Order_Discounts
        await db.query(`
            CREATE TABLE IF NOT EXISTS Order_Discounts (
                Discount_ID INT PRIMARY KEY AUTO_INCREMENT,
                Order_ID INT NOT NULL,
                Coupon_ID INT NOT NULL,
                Discount_Amount DECIMAL(10, 2) NOT NULL,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (Order_ID) REFERENCES Orders(Order_ID) ON DELETE CASCADE,
                FOREIGN KEY (Coupon_ID) REFERENCES Coupons(Coupon_ID) ON DELETE CASCADE,
                INDEX idx_order (Order_ID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ جدول Order_Discounts جاهز');

        // إضافة Foreign Key للـ Orders -> Customers إذا لم يكن موجوداً
        try {
            await db.query(`
                ALTER TABLE Orders 
                ADD CONSTRAINT fk_orders_customer 
                FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_Id) ON DELETE SET NULL;
            `);
            console.log('✅ تم إضافة Foreign Key للـ Orders -> Customers');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_CANT_CREATE_TABLE') {
                console.log('ℹ️  Foreign Key موجود بالفعل');
            } else {
                throw err;
            }
        }

        console.log('\n✨ تم إنشاء جميع الجداول بنجاح!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في إنشاء الجداول:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// تشغيل السكريبت
createMissingTables();



