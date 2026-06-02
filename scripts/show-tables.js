const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306,
      ssl: process.env.DB_HOST && !['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST)
        ? { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
        : false
    });

    const [rows] = await conn.query('SHOW TABLES');
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
  } catch (e) {
    console.error('ERROR', e.message);
    process.exit(1);
  }
})();
