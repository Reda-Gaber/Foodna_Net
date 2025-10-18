const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "sql12.freesqldatabase.com",
    user: "sql12803292",       
    password: "TBrcArvnMX",
    database: "sql12803292"
})

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    return;
  }
  console.log("Connected to MySQL Database!");
});

module.exports = db;