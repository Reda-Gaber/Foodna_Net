function isAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect("/auth/register");
}

module.exports = isAuth;
