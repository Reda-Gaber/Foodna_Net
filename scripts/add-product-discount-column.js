#!/usr/bin/env node
/**
 * Migration: add Discount column to Products table
 * Usage: node scripts/add-product-discount-column.js
 */
require('dotenv').config();
const db = require('../config/db');

async function run() {
  try {
    console.log('🔄 Adding Discount column to Products (if missing)...');
    await db.query(`ALTER TABLE Products ADD COLUMN IF NOT EXISTS Discount DECIMAL(6,2) DEFAULT 0;`).catch(async (err) => {
      // Some MySQL versions don't support IF NOT EXISTS for ADD COLUMN
      if (err && err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Discount column already exists');
        return;
      }
      // fallback: check column existence
      const [cols] = await db.query("SHOW COLUMNS FROM Products LIKE 'Discount'");
      if (cols && cols.length > 0) {
        console.log('✅ Discount column already exists');
        return;
      }
      // try without IF NOT EXISTS
      await db.query(`ALTER TABLE Products ADD COLUMN Discount DECIMAL(6,2) DEFAULT 0;`);
    });

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  }
}

run();
