const router = require("express").Router();

const adminAuthRoutes = require("../modules/admin/auth.routes");
const adminProducts = require("../modules/admin/products.route");
const adminApiRoutes = require("../modules/admin/admin-api.routes");
const couponRoutes = require("../modules/admin/coupon.routes");

// Mount admin auth routes at root so their internal `/dashboard` becomes `/admin/dashboard`
router.use("/", adminAuthRoutes);
router.use("/products", adminProducts);
const { requireEmployee, authorizeRole } = require('../core/middlewares/authMiddleware');
router.use("/api", requireEmployee, authorizeRole('Admin'), adminApiRoutes);
router.use("/api", couponRoutes);



module.exports = router;