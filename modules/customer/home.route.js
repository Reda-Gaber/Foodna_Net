const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("customer/index");
});

module.exports = router;
