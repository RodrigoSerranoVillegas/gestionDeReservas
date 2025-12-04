const { findAll, findById, createUser, updateUser, deleteUser } = require('../models/usuario');

// Listar todos los usuarios
exports.list = async (req, res) => {
  try {
    const usuarios = await findAll();
    res.render('usuarios/list', { usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.render('usuarios/list', { usuarios: [], error: 'Error al cargar los usuarios' });
  }
};

// Mostrar formulario de creación
exports.showCreate = (req, res) => {
  res.render('usuarios/form', { usuario: null, error: null });
};

// Crear nuevo usuario
exports.create = async (req, res) => {
  const { nombre, email, password, confirmPassword, rol } = req.body;

  if (!nombre || !email || !password || !confirmPassword) {
    return res.render('usuarios/form', {
      usuario: req.body,
      error: 'Todos los campos son requeridos'
    });
  }

  if (password !== confirmPassword) {
    return res.render('usuarios/form', {
      usuario: req.body,
      error: 'Las contraseñas no coinciden'
    });
  }

  try {
    await createUser({ nombre, email, password, rol: rol || 'recepcionista' });
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.render('usuarios/form', {
      usuario: req.body,
      error: error.message || 'Error al crear el usuario'
    });
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const usuario = await findById(req.params.id);
    if (!usuario) {
      return res.status(404).send('Usuario no encontrado');
    }
    res.render('usuarios/form', { usuario, error: null });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).send('Error al cargar el usuario');
  }
};

// Actualizar usuario
exports.update = async (req, res) => {
  const { nombre, email, rol, estado } = req.body;

  if (!nombre || !email) {
    const usuario = await findById(req.params.id);
    return res.render('usuarios/form', {
      usuario: { ...usuario, ...req.body },
      error: 'Nombre y email son requeridos'
    });
  }

  try {
    await updateUser(req.params.id, { nombre, email, rol, estado });
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    const usuario = await findById(req.params.id);
    res.render('usuarios/form', {
      usuario: { ...usuario, ...req.body },
      error: 'Error al actualizar el usuario'
    });
  }
};

// Eliminar usuario
exports.delete = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).send('Error al eliminar el usuario');
  }
};

