const product = require("../models/products");

const getProducts = (req, res) => {
    product.getAllProducts((err, products) => {
        if (err) {
            return res.status(500).json({err: "Error Database"})
        }
        res.json(products);
    })
}

module.exports = { getProducts }