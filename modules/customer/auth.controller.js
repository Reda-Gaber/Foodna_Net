const authModel = require('./auth.model');
const bcrypt = require('bcrypt');
const db = require('../../config/db');

const checkEmailExists = async (email) => {
  const user = await authModel.findUserByEmail(email);
  return !!user;
};

const emailIsExists = async (req, res) => {
  try {
    const email = req.body?.email || req.query?.email;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const checkEmail = await checkEmailExists(email);
    if (checkEmail) return res.status(409).json({ notValid: 'Email already exists' });
    return res.json({ valid: 'Email is available' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const createAccount = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;
    if (!username || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    if (password.length < 4)
      return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });
    if (password !== confirmPassword)
      return res.status(400).json({ error: 'كلمات المرور غير متطابقة' });
    if (await checkEmailExists(email))
      return res.status(409).json({ error: 'البريد الإلكتروني موجود بالفعل' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء الحساب وأخذ الـ ID من الـ database مباشرة
    const newUser = await authModel.createUser({
      Customer_Name: username,
      Email:         email,
      Phone:         phone,
      Password:      hashedPassword
    });

    // الـ ID بييجي من الـ database (auto increment) مش random
    const customerId = newUser.insertId || newUser.Customer_Id;

    req.session.userId        = customerId;
    req.session.email         = email;
    req.session.role          = 'Client';
    req.session.authenticated = true;
    req.session.user = {
      id:    customerId,
      name:  username,
      email: email,
      role:  'Client'
    };

    const next = req.body?.next || req.query?.next;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error after register:', err);
        return res.status(500).json({ error: 'تم إنشاء الحساب بنجاح لكن حدث خطأ في الجلسة، الرجاء تسجيل الدخول' });
      }
      // رجع JSON للـ fetch handler
      return res.json({
        success: true,
        message: 'تم إنشاء الحساب بنجاح',
        redirect: next ? decodeURIComponent(next) : '/'
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!req.body) {
      return res.status(400).json({ success: false, message: 'طلب تسجيل الدخول غير صالح، تأكد من إرسال البيانات بشكل صحيح' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'البريد وكلمة المرور مطلوبان' });
    }

    const user = await authModel.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // حفظ كامل بيانات الـ session
    req.session.userId        = user.Customer_Id;
    req.session.email         = user.Email;
    req.session.role          = 'Client';
    req.session.authenticated = true;
    req.session.user = {
      id:    user.Customer_Id,
      name:  user.Customer_Name,
      email: user.Email,
      role:  'Client'
    };

    const next = req.body?.next || req.query?.next;

    // session.save() مع error handling واضح
    req.session.save((err) => {
      if (err) {
        console.error('Session save error after login:', err);
        return res.status(500).json({ success: false, message: 'خطأ في حفظ الجلسة، حاول مرة أخرى' });
      }
      return res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        redirect: next ? decodeURIComponent(next) : '/'
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

const get = (req, res) => {
  if (!req.session || !req.session.email) return res.redirect('/user/register');
  res.render('index', { user: req.session.email });
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/user/register'));
};

/**
 * تحديث بيانات الملف الشخصي
 * PUT /user/api/update
 */
const updateProfile = async (req, res) => {
  try {
    const customerId = req.session?.userId;
    if (!customerId) return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });

    const { name, email, phone, address } = req.body;

    if (!name || !email)
      return res.status(400).json({ success: false, message: 'الاسم والبريد الإلكتروني مطلوبان' });

    // التحقق إذا كان البريد مستخدم من حساب آخر
    const [existing] = await db.query(
      'SELECT Customer_Id FROM Customers WHERE Email = ? AND Customer_Id != ?',
      [email, customerId]
    );
    if (existing && existing.length > 0)
      return res.status(409).json({ success: false, message: 'البريد الإلكتروني مستخدم من حساب آخر' });

    await db.query(
      'UPDATE Customers SET Customer_Name = ?, Email = ?, Phone = ?, Address = ? WHERE Customer_Id = ?',
      [name, email, phone || '', address || '', customerId]
    );

    // تحديث الـ session
    req.session.email = email;

    return res.json({ success: true, message: 'تم تحديث البيانات بنجاح' });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

/**
 * تغيير كلمة المرور
 * PUT /user/api/update-password
 */
const updatePassword = async (req, res) => {
  try {
    const customerId = req.session?.userId;
    if (!customerId) return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية والجديدة مطلوبتان' });
    if (newPassword.length < 4)
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });

    const [rows] = await db.query('SELECT Password FROM Customers WHERE Customer_Id = ?', [customerId]);
    if (!rows || rows.length === 0)
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].Password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE Customers SET Password = ? WHERE Customer_Id = ?', [hashed, customerId]);

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('updatePassword error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
};

module.exports = { emailIsExists, createAccount, login, get, logout, updateProfile, updatePassword };