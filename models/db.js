const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST || "sql12.freesqldatabase.com",
    user: process.env.DB_USER || "sql12803292",       
    password: process.env.DB_PASS || "TBrcArvnMX",
    database: process.env.DB_NAME || "sql12803292",
    port: process.env.DB_PORT || 3306
})


db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    return;
  }
  console.log("Connected to MySQL Database!");
});

module.exports = db;