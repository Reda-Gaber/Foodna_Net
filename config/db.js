const mysql = require("mysql2");
require("dotenv").config();

const dbHost = process.env.DB_HOST;
const useSsl = !['localhost', '127.0.0.1', '::1'].includes(dbHost);
const dbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : useSsl ? 4000 : 3306;

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ DB credentials missing from .env!');
  process.exit(1);
}

const db = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'Foodna_Online',
  port: dbPort,
  ssl: useSsl
    ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    : false,
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