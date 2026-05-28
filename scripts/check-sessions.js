require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 4000,
    ssl: { rejectUnauthorized: false }
  });
  
  const [t] = await conn.query('SHOW TABLES LIKE "sessions"');
  console.log('Sessions table exists:', t.length > 0);
  
  if(t.length > 0) {
    const [s] = await conn.query('SELECT COUNT(*) as c FROM sessions');
    console.log('Active sessions:', s[0].c);
    
    // Show sample session data
    const [sample] = await conn.query('SELECT session_id, expires, LEFT(data, 200) as data_preview FROM sessions LIMIT 1');
    if(sample.length > 0) {
      console.log('Sample session:', sample[0]);
    }
  }
  
  await conn.end();
})();