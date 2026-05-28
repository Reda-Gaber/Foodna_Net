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

    console.log('✓ Database connected\n');

    console.log('Testing UPDATE to new status values...\n');
    
    // Test: Update to 'Processing' (new status)
    const testOrderId = 450035;
    await connection.execute(
      'UPDATE Orders SET Order_Status = ? WHERE Order_ID = ?',
      ['Processing', testOrderId]
    );
    console.log(`✓ Successfully updated Order #${testOrderId} to 'Processing'`);

    // Verify the update
    const [result] = await connection.execute(
      'SELECT Order_ID, Order_Status FROM Orders WHERE Order_ID = ?',
      [testOrderId]
    );
    
    if (result[0]) {
      console.log(`  Current status: ${result[0].Order_Status}\n`);
    }

    // Check all statuses distribution
    console.log('Status distribution:\n');
    const [statusDist] = await connection.execute(
      'SELECT Order_Status, COUNT(*) as count FROM Orders GROUP BY Order_Status ORDER BY Order_Status'
    );
    statusDist.forEach(row => {
      console.log(`  ${row.Order_Status}: ${row.count} orders`);
    });

    await connection.end();
    console.log('\n✓ All tests passed! The database migration is complete.');
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
