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

exports.createUser = async ({Customer_Id, Customer_Name, Email, Phone, Password}) => {
  try {
    await db.query(
      "INSERT INTO Customers (Customer_Id, Customer_Name, Email, Phone, Password) VALUES (?, ?, ?, ?, ?)",
      [Customer_Id, Customer_Name, Email, Phone, Password]
    );
    return { Customer_Id, Customer_Name, Email, Phone, Password };
  } catch (error) {
    throw error;
  }
};
