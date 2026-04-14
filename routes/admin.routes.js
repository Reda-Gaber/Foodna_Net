const router = require("express").Router();

const adminAuthRoutes = require("../modules/admin/auth.routes");
const adminProducts = require("../modules/admin/products.route");
const adminApiRoutes = require("../modules/admin/admin-api.routes");

// Mount admin auth routes at root so their internal `/dashboard` becomes `/admin/dashboard`
router.use("/", adminAuthRoutes);
router.use("/products", adminProducts);
router.use("/api", adminApiRoutes);



module.exports = router;