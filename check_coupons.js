const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'Foodna_Online'
    });

    const [rows] = await conn.execute('SHOW TABLES LIKE "Coupons"');
    console.log('Coupons table exists:', rows.length > 0);

    if (rows.length > 0) {
      const [columns] = await conn.execute('DESCRIBE Coupons');
      console.log('Coupons table columns:', columns.map(col => col.Field));
    }

    conn.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
