const mysql = require("mysql2");
require("dotenv").config();

const dbHost = process.env.DB_HOST || 'gateway01.eu-central-1.prod.aws.tidbcloud.com';
const useSsl = !['localhost', '127.0.0.1', '::1'].includes(dbHost);
const dbPort = process.env.DB_PORT
  ? Number(process.env.DB_PORT)
  : useSsl
    ? 4000
    : 3306;

// استخدام Connection Pool بدلاً من Connection واحد
const db = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER || '48CisnEZo2nYG6d.root',
  password: process.env.DB_PASSWORD || 'FxFGXEgO23yckgmB',
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