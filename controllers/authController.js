const { Usuario } = require('../models');

exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

exports.showRegister = (req, res) => {
  res.render('registro', { error: null, success: null });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Email y contraseña son requeridos', form: { email } });
  }

  try {
    const user = await Usuario.findByEmail(email);

    if (!user) {
      return res.render('login', { error: 'Email o contraseña incorrectos', form: { email } });
    }

    const isValidPassword = await user.verifyPassword(password);

    if (!isValidPassword) {
      return res.render('login', { error: 'Email o contraseña incorrectos', form: { email } });
    }

    if (user.estado !== 'activo') {
      return res.render('login', { error: 'Tu cuenta está inactiva. Contacta al administrador.', form: { email } });
    }

    // Guardar en sesión
    req.session.userId = user.id_usuario;
    req.session.nombre = user.nombre;
    req.session.email = user.email;
    req.session.rol = user.rol;

    // Redirigir según el rol
    if (user.rol === 'admin') {
      return res.redirect('/dashboard');
    } else if (user.rol === 'recepcionista') {
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error en login:', error);
    return res.render('login', { error: 'Error al iniciar sesión. Intenta de nuevo.', form: { email } });
  }
};

exports.register = async (req, res) => {
  const { nombre, email, password, confirmPassword } = req.body;

  if (!nombre || !email || !password || !confirmPassword) {
    return res.render('registro', { 
      error: 'Todos los campos son requeridos', 
      success: null,
      form: { nombre, email }
    });
  }

  if (password !== confirmPassword) {
    return res.render('registro', { 
      error: 'Las contraseñas no coinciden', 
      success: null,
      form: { nombre, email }
    });
  }

  try {
    // Verificar si el email ya existe
    const existingUser = await Usuario.findByEmail(email);
    if (existingUser) {
      return res.render('registro', { 
        error: 'El email ya está registrado', 
        success: null,
        form: { nombre, email }
      });
    }
    
    await Usuario.create({ nombre, email, contraseña: password, rol: 'recepcionista' });
    return res.render('registro', { 
      success: 'Usuario registrado correctamente. Inicia sesión.', 
      error: null,
      form: null
    });
  } catch (error) {
    console.error('Error en registro:', error);
    const errorMessage = error.name === 'SequelizeUniqueConstraintError' || error.message.includes('email')
      ? 'El email ya está registrado' 
      : 'Error al registrar el usuario';
    return res.render('registro', { 
      error: errorMessage, 
      success: null,
      form: { nombre, email }
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/login');
  });
};
