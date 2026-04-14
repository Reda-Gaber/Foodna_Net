/**
 * Product Model (Admin)
 * إدارة المنتجات - النسخة المحسّنة باستخدام Async/Await
 */
const db = require('../../config/db');

class Product {
    /**
     * إنشاء منتج مع المخزون وربطه
     */
    static async create(data, imageFilename) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1️⃣ إضافة المنتج في جدول Products
            const [resultProduct] = await connection.query(
                `INSERT INTO Products 
                 (Product_Name, Category, Description, Image, Quantity, Price, Discount, Supplier_ID)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.name,
                    data.category,
                    data.description || null,
                    imageFilename,
                    data.quantity,
                    data.price,
                    (typeof data.discount === 'number' ? data.discount : (data.discount || 0)),
                    data.supplier_id || null
                ]
            );

            const newProductId = resultProduct.insertId;

            // 2️⃣ إضافة سجل المخزون
            const [resultInventory] = await connection.query(
                `INSERT INTO Inventory (Quantity_Available) VALUES (?)`,
                [data.quantity]
            );

            const newInventoryId = resultInventory.insertId;

            // 3️⃣ ربط المنتج بسجل المخزون
            await connection.query(
                `INSERT INTO Products_Inventory (Product_ID, Inventory_ID) VALUES (?, ?)`,
                [newProductId, newInventoryId]
            );

            await connection.commit();
            return { productId: newProductId, inventoryId: newInventoryId };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * تحديث المنتج مع المخزون
     */
    static async update(id, data, imageFilename) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1️⃣ تحديث بيانات المنتج
            await connection.query(
                `UPDATE Products SET
                 Product_Name = ?, Category = ?, Description = ?,
                 Image = ?, Quantity = ?, Price = ?, Discount = ?, Supplier_ID = ?
                 WHERE Product_ID = ?`,
                [
                    data.name,
                    data.category,
                    data.description || null,
                    imageFilename,
                    data.quantity,
                    data.price,
                    (typeof data.discount === 'number' ? data.discount : (data.discount || 0)),
                    data.supplier_id || null,
                    id
                ]
            );

            // 2️⃣ تحديث المخزون
            await connection.query(
                `UPDATE Inventory i
                 JOIN Products_Inventory pi ON i.Inventory_ID = pi.Inventory_ID
                 SET i.Quantity_Available = ?
                 WHERE pi.Product_ID = ?`,
                [data.quantity, id]
            );

            await connection.commit();
            return { productId: id };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * حذف منتج
     */
    static async deleteById(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // الحصول على Inventory_ID
            const [results] = await connection.query(
                'SELECT Inventory_ID FROM Products_Inventory WHERE Product_ID = ?',
                [id]
            );

            const inventoryId = results[0]?.Inventory_ID;

            // حذف الربط
            await connection.query(
                'DELETE FROM Products_Inventory WHERE Product_ID = ?',
                [id]
            );

            // حذف المخزون إذا كان موجوداً
            if (inventoryId) {
                await connection.query(
                    'DELETE FROM Inventory WHERE Inventory_ID = ?',
                    [inventoryId]
                );
            }

            // حذف المنتج
            await connection.query(
                'DELETE FROM Products WHERE Product_ID = ?',
                [id]
            );

            await connection.commit();
            return { productId: id };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * الحصول على منتج بواسطة ID
     */
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT p.*, i.Quantity_Available
             FROM Products p
             LEFT JOIN Products_Inventory pi ON p.Product_ID = pi.Product_ID
             LEFT JOIN Inventory i ON pi.Inventory_ID = i.Inventory_ID
             WHERE p.Product_ID = ?`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * الحصول على جميع المنتجات
     */
    static async findAll(limit = 50, offset = 0) {
        const [rows] = await db.query(
            `SELECT p.*, i.Quantity_Available
             FROM Products p
             LEFT JOIN Products_Inventory pi ON p.Product_ID = pi.Product_ID
             LEFT JOIN Inventory i ON pi.Inventory_ID = i.Inventory_ID
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
        return rows;
    }

    /**
     * الحصول على عدد المنتجات
     */
    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM Products');
        return rows[0].total;
    }
}

module.exports = Product;
