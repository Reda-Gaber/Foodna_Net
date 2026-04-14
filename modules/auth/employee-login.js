const router = require("express").Router();
const db = require("../../config/db");
const bcrypt = require("bcrypt");

router.get("/login", (req, res) => {
  res.render("auth/employee-login");
});

router.post("/emp/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email or password is undefind" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM Employees WHERE Email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const employee = rows[0];
    const isMatch = await bcrypt.compare(password, employee.Password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Save Session
    req.session.user = {
      id: employee.Employee_ID,
      name: employee.Employee_Name,
      role: employee.Role,
    };

    switch (employee.Role) {
      case "Admin":
        return res.redirect("/admin/dashboard");
      case "Cashier":
        return res.redirect("/cashier");
      case "Chef": 
        return res.redirect("/chef");
      default:
        return res.redirect("/dashboard");
    }

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Logout error:", err);
    res.redirect("/login");
  });
});

module.exports = router;