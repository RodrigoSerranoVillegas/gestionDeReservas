const { Mesa } = require('../models');

// Listar todas las mesas
exports.list = async (req, res) => {
  try {
    const mesas = await Mesa.findAll({
      order: [['zona', 'ASC'], ['nombre', 'ASC']]
    });
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
    await Mesa.create({
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
      error: 'Error al crear la mesa: ' + error.message
    });
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).send('Mesa no encontrada');
    }
    const mesaData = mesa.toJSON ? mesa.toJSON() : mesa;
    res.render('mesas/form', { mesa: mesaData, error: null });
  } catch (error) {
    console.error('Error al obtener mesa:', error);
    res.status(500).send('Error al cargar la mesa');
  }
};

// Actualizar mesa
exports.update = async (req, res) => {
  const { nombre, capacidad, zona, estado } = req.body;

  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).send('Mesa no encontrada');
    }

    if (!nombre || !capacidad || !zona) {
      const mesaData = mesa.toJSON ? mesa.toJSON() : mesa;
      return res.render('mesas/form', {
        mesa: { ...mesaData, ...req.body },
        error: 'Nombre, capacidad y zona son requeridos'
      });
    }

    await mesa.update({
      nombre,
      capacidad: parseInt(capacidad),
      zona,
      estado: estado || 'activa'
    });
    res.redirect('/mesas');
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    try {
      const mesa = await Mesa.findByPk(req.params.id);
      const mesaData = mesa ? (mesa.toJSON ? mesa.toJSON() : mesa) : req.body;
      res.render('mesas/form', {
        mesa: { ...mesaData, ...req.body },
        error: 'Error al actualizar la mesa: ' + error.message
      });
    } catch (err) {
      res.render('mesas/form', {
        mesa: req.body,
        error: 'Error al actualizar la mesa: ' + error.message
      });
    }
  }
};

// Eliminar mesa
exports.delete = async (req, res) => {
  try {
    const mesa = await Mesa.findByPk(req.params.id);
    if (!mesa) {
      return res.status(404).send('Mesa no encontrada');
    }
    await mesa.destroy();
    res.redirect('/mesas');
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    res.status(500).send('Error al eliminar la mesa: ' + error.message);
  }
};

