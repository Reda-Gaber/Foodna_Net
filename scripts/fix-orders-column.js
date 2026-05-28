/**
 * Fix Orders Table Script
 * إضافة العمود Total_Amount إلى جدول Orders إذا لم يكن موجوداً
 * 
 * Usage: node scripts/fix-orders-column.js
 */

require('dotenv').config();
const db = require('../config/db');

async function fixOrdersTable() {
    try {
        console.log('🔄 بدء فحص وإصلاح جدول Orders...\n');

        // إضافة العمود Total_Amount إذا لم يكن موجوداً
        try {
            await db.query(`
                ALTER TABLE Orders 
                ADD COLUMN Total_Amount DECIMAL(10, 2) NOT NULL DEFAULT 0
            `);
            console.log('✅ تم إضافة العمود Total_Amount');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ العمود Total_Amount موجود بالفعل');
            } else {
                throw err;
            }
        }

        // إضافة عمود Delivery_Address
        try {
            await db.query(`
                ALTER TABLE Orders 
                ADD COLUMN Delivery_Address VARCHAR(500)
            `);
            console.log('✅ تم إضافة العمود Delivery_Address');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ العمود Delivery_Address موجود بالفعل');
            } else {
                throw err;
            }
        }

        // إضافة عمود Payment_Method
        try {
            await db.query(`
                ALTER TABLE Orders 
                ADD COLUMN Payment_Method ENUM('cash', 'card', 'online') DEFAULT 'cash'
            `);
            console.log('✅ تم إضافة العمود Payment_Method');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ العمود Payment_Method موجود بالفعل');
            } else {
                throw err;
            }
        }

        // إضافة عمود Created_At
        try {
            await db.query(`
                ALTER TABLE Orders 
                ADD COLUMN Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ تم إضافة العمود Created_At');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ العمود Created_At موجود بالفعل');
            } else {
                throw err;
            }
        }

        // تحديث عمود Order_Date ليصبح له قيمة افتراضية
        try {
            await db.query(`
                ALTER TABLE Orders 
                MODIFY COLUMN Order_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ تم تحديث العمود Order_Date ليصبح له قيمة افتراضية');
        } catch (err) {
            console.log('ℹ️  تحديث Order_Date:', err.message);
        }

        // عرض الجدول
        const [columns] = await db.query('DESCRIBE Orders');
        console.log('\n📋 هيكل جدول Orders:');
        console.log('─'.repeat(60));
        columns.forEach(col => {
            console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null}`);
        });
        console.log('─'.repeat(60));

        console.log('\n✨ تم إصلاح جدول Orders بنجاح!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في إصلاح الجدول:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// تشغيل السكريبت
fixOrdersTable();
