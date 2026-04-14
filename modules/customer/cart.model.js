const db = require('../../config/db');

/**
 * إضافة منتج إلى السلة
 */
const addToCart = async (Customer_ID, Product_ID, Quantity) => {
  const query = `INSERT INTO Carts (Customer_ID, Product_ID, Quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE Quantity = Quantity + ?`;
  return await db.execute(query, [Customer_ID, Product_ID, Quantity, Quantity]);
};

/**
 * تحديث كمية منتج في السلة
 */
const updateCart = async (Customer_ID, Product_ID, Quantity) => {
  const query = `UPDATE Carts
                 SET Quantity = ?
                 WHERE Customer_ID = ? AND Product_ID = ?`;
  return await db.execute(query, [Quantity, Customer_ID, Product_ID]);
};

/**
 * حذف منتج من السلة
 */
const removeFromCart = async (Customer_ID, Product_ID) => {
  const query = `DELETE FROM Carts
                 WHERE Customer_ID = ? AND Product_ID = ?`;
  return await db.execute(query, [Customer_ID, Product_ID]);
};

/**
 * الحصول على محتويات السلة
 */
const getCart = async (Customer_ID) => {
  const query = `SELECT c.Product_ID, p.Product_Name as name, p.Price as price, 
                        c.Quantity, (p.Price * c.Quantity) AS total
                 FROM Carts c
                 JOIN Products p ON c.Product_ID = p.Product_ID
                 WHERE c.Customer_ID = ?`;
  const [rows] = await db.execute(query, [Customer_ID]);
  return rows;
};

/**
 * مسح السلة بالكامل
 */
const clearCart = async (Customer_ID) => {
  const query = `DELETE FROM Carts WHERE Customer_ID = ?`;
  return await db.execute(query, [Customer_ID]);
};

/**
 * التحقق من توفر المنتج والكمية
 */
const validateCartItem = async (Product_ID, Quantity) => {
  const query = `SELECT p.Product_ID, p.Quantity as available_quantity, 
                        i.Quantity_Available
                 FROM Products p
                 LEFT JOIN Products_Inventory pi ON p.Product_ID = pi.Product_ID
                 LEFT JOIN Inventory i ON pi.Inventory_ID = i.Inventory_ID
                 WHERE p.Product_ID = ?`;
  const [rows] = await db.execute(query, [Product_ID]);
  
  if (!rows || rows.length === 0) {
    throw new Error('المنتج غير موجود');
  }
  
  const product = rows[0];
  const availableQty = product.Quantity_Available || product.available_quantity || 0;
  
  if (availableQty < Quantity) {
    throw new Error(`الكمية المتاحة (${availableQty}) أقل من المطلوبة (${Quantity})`);
  }
  
  return product;
};

module.exports = { 
  addToCart, 
  updateCart, 
  removeFromCart, 
  getCart, 
  clearCart,
  validateCartItem
};
