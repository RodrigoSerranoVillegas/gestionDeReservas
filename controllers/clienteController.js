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

  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).send('Cliente no encontrado');
    }

    if (!nombre_completo) {
      const clienteData = cliente.toJSON ? cliente.toJSON() : cliente;
      return res.render('clientes/form', {
        cliente: { ...clienteData, ...req.body },
        error: 'El nombre completo es requerido'
      });
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
    try {
      const cliente = await Cliente.findByPk(req.params.id);
      const clienteData = cliente ? (cliente.toJSON ? cliente.toJSON() : cliente) : req.body;
      res.render('clientes/form', {
        cliente: { ...clienteData, ...req.body },
        error: 'Error al actualizar el cliente: ' + error.message
      });
    } catch (err) {
      res.render('clientes/form', {
        cliente: req.body,
        error: 'Error al actualizar el cliente: ' + error.message
      });
    }
  }
};

