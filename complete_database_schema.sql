-- ============================================
-- Foodna Shop - Complete Database Schema
-- ============================================
-- هذا الملف يحتوي على جميع جداول قاعدة البيانات المطلوبة

-- ============================================
-- جدول العملاء (Customers)
-- ============================================
CREATE TABLE IF NOT EXISTS Customers (
  Customer_Id INT PRIMARY KEY AUTO_INCREMENT,
  Email VARCHAR(100) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  Customer_Name VARCHAR(100) NOT NULL,
  Phone VARCHAR(20),
  Address VARCHAR(500),
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (Email),
  INDEX idx_phone (Phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- جدول المنتجات (Products)
-- ============================================
CREATE TABLE IF NOT EXISTS Products (
  Product_ID INT PRIMARY KEY AUTO_INCREMENT,
  Product_Name VARCHAR(255) NOT NULL,
  Description TEXT,
  Price DECIMAL(10, 2) NOT NULL,
  Category VARCHAR(100),
  Image VARCHAR(255),
  Quantity INT DEFAULT 0,
  Category_ID INT,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (Product_Name),
  INDEX idx_category (Category),
  INDEX idx_price (Price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- جدول المخزون (Inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS Inventory (
  Inventory_ID INT PRIMARY KEY AUTO_INCREMENT,
  Quantity_Available INT NOT NULL DEFAULT 0,
  Last_Updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_quantity (Quantity_Available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- جدول ربط المنتجات والمخزون (Products_Inventory)
-- ============================================
CREATE TABLE IF NOT EXISTS Products_Inventory (
  Product_ID INT NOT NULL,
  Inventory_ID INT NOT NULL,
  PRIMARY KEY (Product_ID, Inventory_ID),
  FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE,
  FOREIGN KEY (Inventory_ID) REFERENCES Inventory(Inventory_ID) ON DELETE CASCADE,
  INDEX idx_product (Product_ID),
  INDEX idx_inventory (Inventory_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- جدول السلة (Cart)
-- ============================================
CREATE TABLE IF NOT EXISTS Cart (
  Cart_ID INT PRIMARY KEY AUTO_INCREMENT,
  Customer_ID INT NOT NULL,
  Product_ID INT NOT NULL,
  Quantity INT NOT NULL DEFAULT 1,
  Added_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_Id) ON DELETE CASCADE,
  FOREIGN KEY (Product_ID) REFERENCES Products(Product_ID) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (Customer_ID, Product_ID),
  INDEX idx_customer (Customer_ID),
  INDEX idx_product (Product_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- جدول الطلبات (Orders)
-- ============================================
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
  FOREIGN KEY (Customer_ID) REFERENCES Customers(Customer_Id) ON DELETE SET NULL,
  INDEX idx_customer (Customer_ID),
  INDEX idx_status (Status),
  INDEX idx_created (Created_At),
  INDEX idx_kitchen_status (Kitchen_Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- جدول تفاصيل الطلبات (Order_Items)
-- ============================================
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

-- ============================================
-- جدول التقييمات (Reviews)
-- ============================================
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

-- ============================================
-- جدول التصنيفات (Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS Categories (
  Category_ID INT PRIMARY KEY AUTO_INCREMENT,
  Category_Name VARCHAR(100) NOT NULL UNIQUE,
  Description TEXT,
  Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (Category_Name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- تحديث جدول Products لإضافة Category_ID
-- ============================================
ALTER TABLE Products 
ADD FOREIGN KEY IF NOT EXISTS (Category_ID) REFERENCES Categories(Category_ID) ON DELETE SET NULL;

-- ============================================
-- جدول الكوبونات (Coupons)
-- ============================================
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

-- ============================================
-- جدول خصومات الطلبات (Order_Discounts)
-- ============================================
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

-- ============================================
-- فهارس إضافية للأداء
-- ============================================
CREATE INDEX IF NOT EXISTS idx_product_category ON Products(Category);
CREATE INDEX IF NOT EXISTS idx_product_name ON Products(Product_Name);
CREATE INDEX IF NOT EXISTS idx_customer_email ON Customers(Email);

-- ============================================
-- تعليقات توضيحية
-- ============================================
-- 1. تأكد من تشغيل هذا الملف بالكامل مرة واحدة
-- 2. هذا الملف ينشئ جميع الجداول المطلوبة
-- 3. بعد هذا، قم بتشغيل seed-sample-data.js لإضافة بيانات تجريبية
