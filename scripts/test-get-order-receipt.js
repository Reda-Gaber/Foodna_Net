const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const dbHost = process.env.DB_HOST;
    const useSsl = !['localhost', '127.0.0.1', '::1'].includes(dbHost);
    const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : (useSsl ? 4000 : 3306);
    const connection = await mysql.createConnection({
      host: dbHost,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'Foodna_Online',
      port: dbPort,
      ssl: useSsl ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' } : false
    });

    const orderId = process.argv[2] || '480035';
    const [rows] = await connection.execute(
      `SELECT Order_ID, Customer_ID, Total_Amount, Order_Status,
              Delivery_Address, Payment_Method, Created_At, Updated_At
       FROM Orders WHERE Order_ID = ?`,
      [orderId]
    );

    console.log('Result:', rows);
    await connection.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.sql) console.error('SQL:', err.sql);
    process.exit(1);
  }
})();
