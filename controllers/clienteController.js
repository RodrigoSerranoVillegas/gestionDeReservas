const { Cliente, Reserva } = require('../models');

// Listar todos los clientes
exports.list = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      order: [['nombre_completo', 'ASC']]
    });
    res.render('clientes/list', { clientes });
  } catch (error) {
    console.error('Error al listar clientes:', error);
    res.render('clientes/list', { clientes: [], error: 'Error al cargar los clientes' });
  }
};

// Ver detalles de un cliente
exports.show = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).send('Cliente no encontrado');
    }
    const historial = await Reserva.findAll({
      where: { id_cliente: req.params.id },
      include: [
        {
          model: require('../models').Mesa,
          as: 'mesa',
          attributes: ['id_mesa', 'nombre', 'zona']
        }
      ],
      order: [['fecha_reserva', 'DESC'], ['hora_inicio', 'DESC']]
    });
    res.render('clientes/show', { cliente, historial });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).send('Error al cargar el cliente');
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).send('Cliente no encontrado');
    }
    res.render('clientes/form', { cliente, error: null });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).send('Error al cargar el cliente');
  }
};

// Actualizar cliente
exports.update = async (req, res) => {
  const { nombre_completo, telefono, email, notas } = req.body;

  if (!nombre_completo) {
    const cliente = await findById(req.params.id);
    return res.render('clientes/form', {
      cliente: { ...cliente, ...req.body },
      error: 'El nombre completo es requerido'
    });
  }

  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).send('Cliente no encontrado');
    }
    await cliente.update({
      nombre_completo,
      telefono: telefono || null,
      email: email || null,
      notas: notas || null
    });
    res.redirect(`/clientes/${req.params.id}`);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    const cliente = await Cliente.findByPk(req.params.id);
    res.render('clientes/form', {
      cliente: { ...cliente.toJSON(), ...req.body },
      error: 'Error al actualizar el cliente'
    });
  }
};

