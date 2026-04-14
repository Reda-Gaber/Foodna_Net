-- إنشاء طلبات اختبارية للمطبخ
-- Test Orders for Kitchen Display

-- تنظيف البيانات القديمة (اختياري)
-- DELETE FROM Orders WHERE Created_At < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 1. إضافة عميل اختباري
INSERT INTO Customers (Customer_Name, Email, Phone, Password_Hash, Address)
VALUES ('عميل اختباري', 'test@example.com', '1234567890', 'hashed', 'عنوان اختباري')
ON DUPLICATE KEY UPDATE Customer_Name = 'عميل اختباري';

-- 2. إضافة طلبات اختبارية بحالات مختلفة

-- طلب قيد الانتظار
INSERT INTO Orders (Customer_ID, Status, Total_Amount, Payment_Method, Created_At)
SELECT c.Customer_Id, 'Pending', 150.00, 'cash', NOW()
FROM Customers c
WHERE c.Email = 'test@example.com'
LIMIT 1;

-- طلب قيد التجهيز
INSERT INTO Orders (Customer_ID, Status, Total_Amount, Payment_Method, Created_At)
SELECT c.Customer_Id, 'Processing', 200.00, 'cash', DATE_SUB(NOW(), INTERVAL 5 MINUTE)
FROM Customers c
WHERE c.Email = 'test@example.com'
LIMIT 1;

-- طلب جاهز
INSERT INTO Orders (Customer_ID, Status, Total_Amount, Payment_Method, Created_At)
SELECT c.Customer_Id, 'Ready', 180.00, 'card', DATE_SUB(NOW(), INTERVAL 10 MINUTE)
FROM Customers c
WHERE c.Email = 'test@example.com'
LIMIT 1;

-- طلب مسلم (حديث - آخر 24 ساعة)
INSERT INTO Orders (Customer_ID, Status, Total_Amount, Payment_Method, Created_At)
SELECT c.Customer_Id, 'Delivered', 250.00, 'cash', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM Customers c
WHERE c.Email = 'test@example.com'
LIMIT 1;

-- 3. إضافة عناصر الطلب
-- احصل على آخر 4 طلبات وأضف عناصر لها
INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price)
SELECT o.Order_ID, 1, 2, 75.00
FROM Orders o
WHERE o.Customer_ID IN (
  SELECT Customer_Id FROM Customers WHERE Email = 'test@example.com'
)
LIMIT 4;

INSERT INTO Order_Items (Order_ID, Product_ID, Quantity, Price)
SELECT o.Order_ID, 2, 1, 50.00
FROM Orders o
WHERE o.Customer_ID IN (
  SELECT Customer_Id FROM Customers WHERE Email = 'test@example.com'
)
LIMIT 1;

-- التحقق من الطلبات المدرجة
SELECT 
  o.Order_ID,
  o.Customer_ID,
  c.Customer_Name,
  o.Order_Status,
  o.Total_Amount,
  o.Created_At,
  GROUP_CONCAT(
    CONCAT(oi.Quantity, 'x ', p.Product_Name) 
    SEPARATOR ', '
  ) as items
FROM Orders o
LEFT JOIN Customers c ON o.Customer_ID = c.Customer_Id
LEFT JOIN Order_Items oi ON o.Order_ID = oi.Order_ID
LEFT JOIN Products p ON oi.Product_ID = p.Product_ID
WHERE c.Email = 'test@example.com'
GROUP BY o.Order_ID
ORDER BY o.Created_At DESC;

-- النتيجة المتوقعة:
-- Order_ID | Status | Items
-- ---------|--------|-------
-- 1        | Pending | 2x منتج، 1x منتج
-- 2        | Processing | ...
-- 3        | Ready | ...
-- 4        | Delivered | ...
