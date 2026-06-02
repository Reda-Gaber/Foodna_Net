/**
 * Auth Model (Customer)
 * إدارة مصادقة العملاء
 */
const db = require("../../config/db");

exports.findUserByEmail = async (email) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM Customers WHERE Email = ?",
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
};

exports.createUser = async ({ Customer_Name, Email, Phone, Password }) => {
  try {
    const [result] = await db.query(
      'INSERT INTO Customers (Customer_Name, Email, Phone, Password) VALUES (?, ?, ?, ?)',
      [Customer_Name, Email, Phone, Password]
    );
    const insertId = result.insertId;
    return { insertId, Customer_Id: insertId, Customer_Name, Email, Phone };
  } catch (error) {
    throw error;
  }
};
