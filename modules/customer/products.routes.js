const express = require("express");
const router = express.Router();
const products = require("./products.controller");
const productModel = require("./products.model");

// الحصول على جميع المنتجات (مع دعم البحث والتصفية)
router.get("/", products.getProducts);

// الحصول على منتج بواسطة ID
router.get("/:id", async (req, res) => {
    try {
        const product = await productModel.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'المنتج غير موجود' });
        }
        return res.json(product);
    } catch (error) {
        return res.status(500).json({ error: 'فشل في جلب المنتج' });
    }
});

module.exports = router 