const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', '002-add-updated-at.sql'), 'utf8');
    const dbHost = process.env.DB_HOST;
    const useSsl = !['localhost', '127.0.0.1', '::1'].includes(dbHost);
    const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : (useSsl ? 4000 : 3306);

    const connection = await mysql.createConnection({
      host: dbHost,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'Foodna_Online',
      port: dbPort,
      ssl: useSsl ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' } : false,
      multipleStatements: true
    });

    console.log('Applying migration 002-add-updated-at.sql...');
    const [res] = await connection.query(sql);
    console.log('Migration applied. Result:', res);

    // Verify the column now exists
    const [cols] = await connection.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Orders' AND COLUMN_NAME = 'Updated_At'`
    );
    console.log('Updated_At column info:', cols);

    await connection.end();
    console.log('Done.');
  } catch (err) {
    console.error('Migration error:', err.message);
    if (err.sql) console.error('SQL:', err.sql);
    process.exit(1);
  }
})();
