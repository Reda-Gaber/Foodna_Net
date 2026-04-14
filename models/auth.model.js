const db = require('./db');

exports.findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM Customers WHERE Email = ?";
    db.query(query, [email], (err, result) => {
      if (err) return reject(err);
      resolve(result[0] || null);
    });
  });
};

exports.createUser = ({Customer_Id, Customer_Name, Email, Phone, Password }) => {
  return new Promise((resolve, reject) => {
    const query = "INSERT INTO Customers (Customer_Id, Customer_Name, Email, Phone, Password) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [Customer_Id, Customer_Name, Email, Phone, Password], (err, result) => {
      if (err) return reject(err);
      resolve({ Customer_Id, Customer_Name, Email, Phone, Password });
    });
  });
};
