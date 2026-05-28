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

    console.log('⏳ Executing ALTER TABLE...');
    const sql = "ALTER TABLE Orders MODIFY COLUMN Order_Status ENUM('Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending'";
    await connection.execute(sql);
    
    console.log('✅ ALTER TABLE executed successfully!');

    // Verify the change
    console.log('\n📋 Verifying new column definition...');
    const [rows] = await connection.execute('SHOW COLUMNS FROM Orders WHERE Field = "Order_Status"');
    console.log(JSON.stringify(rows, null, 2));

    await connection.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
