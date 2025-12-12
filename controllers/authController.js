const { Usuario } = require('../models');
const crypto = require('crypto');

exports.showLogin = (req, res) => {
  res.render('login', { error: null });
};

exports.showForgotPassword = (req, res) => {
  res.render('forgot-password', { error: null, success: null });
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
    console.error('Stack:', error.stack);
    return res.render('login', { 
      error: `Error al iniciar sesión: ${error.message}. Intenta de nuevo.`, 
      form: { email } 
    });
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

// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.render('forgot-password', {
      error: 'Por favor ingresa tu correo electrónico',
      success: null
    });
  }

  try {
    const user = await Usuario.findByEmail(email);

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return res.render('forgot-password', {
        success: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
        error: null
      });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token válido por 1 hora

    // Guardar token en la base de datos
    try {
      await user.update({
        resetPasswordToken: token,
        resetPasswordExpires: expires
      });
    } catch (updateError) {
      // Si las columnas no existen, intentar agregarlas primero
      if (updateError.message && updateError.message.includes('Unknown column')) {
        console.error('Las columnas resetPasswordToken/resetPasswordExpires no existen en la base de datos.');
        console.error('Por favor ejecuta el script: migrations/add_reset_password_fields.sql');
        throw new Error('Configuración de base de datos incompleta. Contacta al administrador.');
      }
      throw updateError;
    }

    // En un entorno real, aquí enviarías un email con el token
    // Por ahora, mostraremos el token en la consola y en la vista (solo para desarrollo)
    console.log('==========================================');
    console.log('TOKEN DE RECUPERACIÓN DE CONTRASEÑA');
    console.log('Email:', email);
    console.log('Token:', token);
    console.log('URL:', `${req.protocol}://${req.get('host')}/reset-password/${token}`);
    console.log('==========================================');

    // En desarrollo, mostrar el token. En producción, enviar por email
    if (process.env.NODE_ENV !== 'production') {
      return res.render('forgot-password', {
        success: '✅ Token de recuperación generado exitosamente. En producción, este enlace se enviaría automáticamente por email.',
        error: null,
        token: token,
        url: `/reset-password/${token}`,
        req: req // Pasar req para construir la URL completa
      });
    }

    // En producción, solo mostrar mensaje genérico
    return res.render('forgot-password', {
      success: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
      error: null
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    console.error('Stack:', error.stack);
    return res.render('forgot-password', {
      error: `Error al procesar la solicitud: ${error.message}. Intenta de nuevo.`,
      success: null
    });
  }
};

// Mostrar formulario de reset de contraseña
exports.showResetPassword = async (req, res) => {
  const { token } = req.params;

  try {
    const { Op } = require('sequelize');
    const user = await Usuario.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.render('reset-password', {
        error: 'El token de recuperación es inválido o ha expirado. Solicita uno nuevo.',
        success: null,
        token: null
      });
    }

    return res.render('reset-password', {
      error: null,
      success: null,
      token: token
    });
  } catch (error) {
    console.error('Error en showResetPassword:', error);
    return res.render('reset-password', {
      error: 'Error al cargar el formulario. Intenta de nuevo.',
      success: null,
      token: null
    });
  }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.render('reset-password', {
      error: 'Por favor completa todos los campos',
      success: null,
      token: token
    });
  }

  if (password !== confirmPassword) {
    return res.render('reset-password', {
      error: 'Las contraseñas no coinciden',
      success: null,
      token: token
    });
  }

  if (password.length < 6) {
    return res.render('reset-password', {
      error: 'La contraseña debe tener al menos 6 caracteres',
      success: null,
      token: token
    });
  }

  try {
    const { Op } = require('sequelize');
    const user = await Usuario.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.render('reset-password', {
        error: 'El token de recuperación es inválido o ha expirado. Solicita uno nuevo.',
        success: null,
        token: null
      });
    }

    // Actualizar contraseña (el hook beforeUpdate la encriptará automáticamente)
    await user.update({
      contraseña: password,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return res.render('reset-password', {
      success: 'Tu contraseña ha sido restablecida exitosamente. Puedes iniciar sesión ahora.',
      error: null,
      token: null
    });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return res.render('reset-password', {
      error: 'Error al restablecer la contraseña. Intenta de nuevo.',
      success: null,
      token: token
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
