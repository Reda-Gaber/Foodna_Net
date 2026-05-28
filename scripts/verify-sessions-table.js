/**
 * Script to verify/create sessions table for MySQL session store
 */

const mysql = require('mysql2/promise');

async function verifySessionsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Foodna_Online',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  try {
    // Check if sessions table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'sessions'"
    );

    if (tables.length === 0) {
      console.log('⚠️ Sessions table does not exist. Creating it...');
      
      await connection.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id VARCHAR(128) NOT NULL,
          expires INT NOT NULL,
          data TEXT,
          PRIMARY KEY (session_id),
          INDEX idx_expires (expires)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      
      console.log('✅ Sessions table created successfully!');
    } else {
      console.log('✅ Sessions table exists.');
      
      // Show table structure
      const [columns] = await connection.query('DESCRIBE sessions');
      console.log('Table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });
    }

    // Check for any existing sessions
    const [sessions] = await connection.query('SELECT COUNT(*) as count FROM sessions');
    console.log(`\n📊 Current sessions in database: ${sessions[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

verifySessionsTable();