const { findByEmail, createUser } = require('../models/user');

exports.showLogin = (req, res) => {
  res.render('login');
};

exports.showRegister = (req, res) => {
  res.render('registro');
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email y contraseña son requeridos' });
  }

  const user = findByEmail(email);

  if (!user || user.password !== password) {
    return res.render('login', { error: 'Email o contraseña incorrectos' });
  }

  // Aquí se guardaría en sesión (más adelante con express-session)
  res.redirect('/dashboard');
};

exports.register = (req, res) => {
  const { nombre, email, password, confirmPassword } = req.body;

  if (!nombre || !email || !password || !confirmPassword) {
    return res.render('registro', { error: 'Todos los campos son requeridos' });
  }

  if (password !== confirmPassword) {
    return res.render('registro', { error: 'Las contraseñas no coinciden' });
  }

  const existingUser = findByEmail(email);
  if (existingUser) {
    return res.render('registro', { error: 'El email ya está registrado' });
  }

  try {
    createUser({ nombre, email, password });
    res.render('registro', { success: 'Usuario registrado correctamente. Inicia sesión.' });
  } catch (error) {
    res.render('registro', { error: 'Error al registrar el usuario' });
  }
};
