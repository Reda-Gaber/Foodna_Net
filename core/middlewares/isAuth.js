const PUBLIC_PATHS = ['/login', '/register', '/auth/login', '/auth/register'];

function isAuthenticated(req, res, next) {
  // لو المسار public، اسمح بالمرور دايماً
  if (PUBLIC_PATHS.some(path => req.path.startsWith(path))) {
    // لو logged in كـ Admin/Cashier/Kitchen ارجعه للـ dashboard
    const role = req.session?.user?.role;
    if (role && role !== 'Client') {
      return res.redirect('/dashboard');
    }
    // Client أو مش logged in → اسمحله يشوف صفحة اللوجين
    return next();
  }

  // لو مش logged in، ارجعه لصفحة اللوجين
  if (!req.session?.user) {
    return res.redirect('/login');
  }

  next();
}

module.exports = isAuthenticated;