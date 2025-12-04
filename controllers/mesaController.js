const { findAll, findActive, createMesa, updateMesa, deleteMesa, findById } = require('../models/mesa');

// Listar todas las mesas
exports.list = async (req, res) => {
  try {
    const mesas = await findAll();
    res.render('mesas/list', { mesas });
  } catch (error) {
    console.error('Error al listar mesas:', error);
    res.render('mesas/list', { mesas: [], error: 'Error al cargar las mesas' });
  }
};

// Mostrar formulario de creación
exports.showCreate = (req, res) => {
  res.render('mesas/form', { mesa: null, error: null });
};

// Crear nueva mesa
exports.create = async (req, res) => {
  const { nombre, capacidad, zona, estado } = req.body;

  if (!nombre || !capacidad || !zona) {
    return res.render('mesas/form', {
      mesa: req.body,
      error: 'Nombre, capacidad y zona son requeridos'
    });
  }

  try {
    await createMesa({
      nombre,
      capacidad: parseInt(capacidad),
      zona,
      estado: estado || 'activa'
    });
    res.redirect('/mesas');
  } catch (error) {
    console.error('Error al crear mesa:', error);
    res.render('mesas/form', {
      mesa: req.body,
      error: 'Error al crear la mesa'
    });
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const mesa = await findById(req.params.id);
    if (!mesa) {
      return res.status(404).send('Mesa no encontrada');
    }
    res.render('mesas/form', { mesa, error: null });
  } catch (error) {
    console.error('Error al obtener mesa:', error);
    res.status(500).send('Error al cargar la mesa');
  }
};

// Actualizar mesa
exports.update = async (req, res) => {
  const { nombre, capacidad, zona, estado } = req.body;

  if (!nombre || !capacidad || !zona) {
    const mesa = await findById(req.params.id);
    return res.render('mesas/form', {
      mesa: { ...mesa, ...req.body },
      error: 'Nombre, capacidad y zona son requeridos'
    });
  }

  try {
    await updateMesa(req.params.id, {
      nombre,
      capacidad: parseInt(capacidad),
      zona,
      estado
    });
    res.redirect('/mesas');
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    const mesa = await findById(req.params.id);
    res.render('mesas/form', {
      mesa: { ...mesa, ...req.body },
      error: 'Error al actualizar la mesa'
    });
  }
};

// Eliminar mesa
exports.delete = async (req, res) => {
  try {
    await deleteMesa(req.params.id);
    res.redirect('/mesas');
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    res.status(500).send('Error al eliminar la mesa');
  }
};

