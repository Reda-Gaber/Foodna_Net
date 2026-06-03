require('dotenv').config();
const db = require('../config/db');

(async () => {
  const [all] = await db.query(
    'SELECT Product_Name, Category, Description, Quantity FROM Products WHERE Quantity > 0 LIMIT 40'
  );
  console.log('=== ALL PRODUCTS ===');
  all.forEach((p) => console.log(`- ${p.Product_Name} | ${p.Category} | ${p.Description?.slice(0, 40)}`));

  const [juice] = await db.query(
    `SELECT Product_Name, Category FROM Products
     WHERE Quantity > 0 AND (Product_Name LIKE '%عصير%' OR Description LIKE '%عصير%')`
  );
  console.log('\n=== JUICE LIKE %عصير% ===', juice.length);
  juice.forEach((p) => console.log(`- ${p.Product_Name}`));

  const [drinks] = await db.query(
    `SELECT Product_Name, Category, Description FROM Products
     WHERE Quantity > 0 AND (Category LIKE '%مشرو%' OR Product_Name LIKE '%سبيرو%')`
  );
  console.log('\n=== DRINKS ===', drinks.length);
  drinks.forEach((p) => console.log(`- ${p.Product_Name} | ${p.Description?.slice(0, 50)}`));

  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
