const { createReserva, findAll } = require('../models/reserva');

exports.showForm = (req, res) => {
  res.render('reservar');
};

exports.create = (req, res) => {
  const { nombre, telefono, email, fecha, hora, numero_personas, observaciones } = req.body;

  // Validaciones básicas
  if (!nombre || !fecha || !hora || !numero_personas) {
    return res.render('reservar', { error: 'Nombre, fecha, hora y número de personas son requeridos', form: req.body });
  }

  try {
    const reserva = createReserva({ nombre, telefono, email, fecha, hora, numero_personas, observaciones });
    return res.render('reservar', { success: `Reserva creada. Código: ${reserva.id_reserva}`, reserva });
  } catch (err) {
    return res.render('reservar', { error: 'Error al crear la reserva', form: req.body });
  }
};

exports.list = (req, res) => {
  const reservas = findAll();
  res.render('inicio', { reservas });
};
