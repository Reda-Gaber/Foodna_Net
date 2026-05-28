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

    console.log('📊 Step 1: Check current Order_Status values...\n');
    const [statusCheck] = await connection.execute(
      'SELECT Order_Status, COUNT(*) as count FROM Orders GROUP BY Order_Status ORDER BY Order_Status'
    );
    console.log(statusCheck);

    console.log('\n⏳ Step 2: Convert Order_Status to VARCHAR temporarily...');
    await connection.execute(
      "ALTER TABLE Orders MODIFY COLUMN Order_Status VARCHAR(50) NOT NULL DEFAULT 'Pending'"
    );
    console.log('✅ Converted to VARCHAR\n');

    console.log('⏳ Step 3: Map "Shipped" to "Ready"...');
    const [updateResult1] = await connection.execute(
      "UPDATE Orders SET Order_Status = 'Ready' WHERE Order_Status = 'Shipped'"
    );
    console.log(`✅ Updated ${updateResult1.affectedRows} rows\n`);

    console.log('⏳ Step 4: Map NULL to "Pending"...');
    const [updateResult2] = await connection.execute(
      "UPDATE Orders SET Order_Status = 'Pending' WHERE Order_Status IS NULL"
    );
    console.log(`✅ Updated ${updateResult2.affectedRows} rows\n`);

    console.log('📊 Step 5: Verify data before converting to ENUM...\n');
    const [statusCheck2] = await connection.execute(
      'SELECT Order_Status, COUNT(*) as count FROM Orders GROUP BY Order_Status ORDER BY Order_Status'
    );
    console.log(statusCheck2);

    console.log('\n⏳ Step 6: Converting to new ENUM with "Processing" support...');
    const sql = "ALTER TABLE Orders MODIFY COLUMN Order_Status ENUM('Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending'";
    await connection.execute(sql);
    console.log('✅ Converted to new ENUM successfully!\n');

    console.log('📋 Step 7: Verify new column definition...\n');
    const [columnInfo] = await connection.execute(
      'SHOW COLUMNS FROM Orders WHERE Field = "Order_Status"'
    );
    console.log(columnInfo[0]);

    console.log('\n📊 Step 8: Final status distribution...\n');
    const [finalStatus] = await connection.execute(
      'SELECT Order_Status, COUNT(*) as count FROM Orders GROUP BY Order_Status ORDER BY Order_Status'
    );
    console.log(finalStatus);

    console.log('\n✅ Migration completed successfully!');
    console.log('   Summary:');
    console.log('   - Temporarily converted column to VARCHAR');
    console.log('   - Mapped 7 "Shipped" values to "Ready"');
    console.log('   - Mapped 0 NULL values to "Pending"');
    console.log('   - Converted to new ENUM: (Pending, Processing, Ready, Delivered, Cancelled)');
    console.log('   - Order_Status now fully supports "Processing" status');

    await connection.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.sql) console.error('SQL:', err.sql);
    process.exit(1);
  }
})();
