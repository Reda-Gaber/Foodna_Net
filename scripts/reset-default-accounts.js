/**
 * Reset Default Accounts Script
 * إعادة تعيين الحسابات الافتراضية للأقسام
 * 
 * Usage: node scripts/reset-default-accounts.js
 */

require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcrypt');

const defaultAccounts = [
    {
        email: 'admin@foodna.com',
        password: '000000',
        name: 'مدير النظام',
        role: 'Admin',
        phone: '01000000000'
    },
    {
        email: 'chef@foodna.com',
        password: '111111',
        name: 'مطبخ Foodna',
        role: 'Chef',
        phone: '01111111111'
    },
    {
        email: 'cashier@foodna.com',
        password: '222222',
        name: 'كاشير Foodna',
        role: 'Cashier',
        phone: '02222222222'
    }
];

async function resetDefaultAccounts() {
    try {
        console.log('🔄 بدء إعادة تعيين الحسابات الافتراضية...\n');

        for (const account of defaultAccounts) {
            // تشفير كلمة المرور
            const hashedPassword = await bcrypt.hash(account.password, 10);

            // التحقق من وجود الحساب
            const [existing] = await db.query(
                'SELECT * FROM Employees WHERE Email = ?',
                [account.email]
            );

            if (existing.length > 0) {
                // تحديث الحساب الموجود
                await db.query(
                    `UPDATE Employees 
                     SET Employee_Name = ?, 
                         Password = ?, 
                         Role = ?,
                         Phone = ?
                     WHERE Email = ?`,
                    [account.name, hashedPassword, account.role, account.phone, account.email]
                );
                console.log(`✅ تم تحديث حساب: ${account.email} (${account.role})`);
            } else {
                // إنشاء حساب جديد
                await db.query(
                    `INSERT INTO Employees (Employee_Name, Email, Password, Role, Phone)
                     VALUES (?, ?, ?, ?, ?)`,
                    [account.name, account.email, hashedPassword, account.role, account.phone]
                );
                console.log(`✅ تم إنشاء حساب: ${account.email} (${account.role})`);
            }
        }

        console.log('\n✨ تم إعادة تعيين جميع الحسابات الافتراضية بنجاح!\n');
        console.log('📋 الحسابات المتاحة:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        defaultAccounts.forEach(acc => {
            console.log(`\n🔹 ${acc.role}`);
            console.log(`   Email: ${acc.email}`);
            console.log(`   Password: ${acc.password}`);
        });
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ في إعادة تعيين الحسابات:', error);
        process.exit(1);
    }
}

// تشغيل السكريبت
resetDefaultAccounts();

