const mysql = require("mysql2");
require("dotenv").config();

// استخدام Connection Pool بدلاً من Connection واحد
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'reda',
  password: process.env.DB_PASSWORD || 'mysql.ui',
  database: process.env.DB_NAME || 'Foodna_Online',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// اختبار الاتصال
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    return;
  }
  console.log("Connected to MySQL Database!");
  connection.release();
});

// تصدير Promise-based interface للاستخدام مع async/await
module.exports = db.promise();