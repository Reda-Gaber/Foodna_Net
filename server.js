const express = require("express");
const session = require("express-session");
const MySqlStore = require("express-mysql-session")(session);
const path = require("path");

const DB = require("./models/db");
const homeRoutes = require("./routes/home.route");
const productsRoutes = require("./routes/products.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
const PORT = process.env.PORT || 3001;

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session store
const sessionStore = new MySqlStore({}, DB.promise());

app.use(session({
  secret: 'superSecretKey123',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 Hours
}));

// Static files
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.static(path.join(__dirname, "./images")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./views"));
console.log("Views directory:", app.get("views"));

// Routes
app.use("/", homeRoutes);
app.use("/api/products", productsRoutes);
app.use("/user", authRoutes);

app.use("/home", (req, res) => {
  res.redirect("/")
})

// Extra pages
app.get("/contact", (req, res) => res.render("contact"));
app.get("/menu", (req, res) => res.render("menu"));
app.get("/offers", (req, res) => res.render("offers"));
app.get("/about", (req, res) => res.render("about"));
app.get("/product-page", (req, res) => res.render("product-page", { id: req.query.id }));
app.get("/privacy-policy", (req, res) => res.render("privacy-policy"))
app.get("/refund-policy", (req, res) => res.render("refund-policy"))
app.get("/delivery-policy", (req, res) => res.render("delivery-policy"))

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// password => TBrcArvnMX