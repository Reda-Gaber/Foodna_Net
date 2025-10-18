const authModel = require('../models/auth.model');
const bcrypt = require('bcrypt');

const checkEmailExists = async (email) => {
  const user = await authModel.findUserByEmail(email);
  return !!user;
};

const emailIsExists = async (req, res) => {
  try {
    const email = req.body?.email || req.query?.email;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const checkEmail = await checkEmailExists(email);
    if (checkEmail) {
      return res.status(409).json({ notValid: 'Email already exists' });
    }

    return res.json({ valid: 'Email is available' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};


const createAccount = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;
    if (!username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }
    if (await checkEmailExists(email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const generateCustomerId = () => Math.floor(100000 + Math.random() * 900000);

    await authModel.createUser({
      Customer_Id: generateCustomerId(),
      Customer_Name: username,
      Email: email,
      Phone: phone,
      Password: hashedPassword
    });

    return res.status(201).redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authModel.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    req.session.userId = user.Customer_Id;
    req.session.email = user.Email;

    return res.redirect('/home');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getHome = (req, res) => {
  if (!req.session || !req.session.email) return res.redirect('/user/register');
  res.render('index', { user: req.session.email });
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/user/register'));
};

module.exports = { emailIsExists, createAccount, login, getHome, logout };


