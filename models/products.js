const db = require("./db");

// get all data from products table
const getAllProducts = (callback) => {
    const all = "SELECT * FROM Products";
    db.query(all, (err, value) => {
        if (err)
            return callback(err, null)

       
        callback(null, value)
    })
}

module.exports = { getAllProducts };