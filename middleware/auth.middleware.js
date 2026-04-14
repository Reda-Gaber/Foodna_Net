function isAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect("/user/register");
}

module.exports = isAuth;
