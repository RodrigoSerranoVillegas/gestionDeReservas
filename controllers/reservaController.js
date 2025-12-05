const { Reserva, Cliente, Mesa, Usuario, ConfiguracionRestaurante, HorarioAtencion } = require('../models');

// Mostrar formulario público de reserva
exports.showForm = (req, res) => {
  res.render('reservar', { error: null, success: null, form: null });
};

// Crear reserva (público)
exports.create = async (req, res) => {
  const { nombre, telefono, email, fecha, hora, numero_personas, observaciones } = req.body;

  if (!nombre || !fecha || !hora || !numero_personas) {
    return res.render('reservar', {
      error: 'Nombre, fecha, hora y número de personas son requeridos',
      success: null,
      form: req.body
    });
  }

  try {
    // Validar que la hora esté dentro del horario de atención
    const horaValida = await isHoraValida(fecha, hora);
    if (!horaValida) {
      return res.render('reservar', {
        error: 'La hora seleccionada no está dentro del horario de atención',
        success: null,
        form: req.body
      });
    }

    const reserva = await createReserva({
      nombre_completo: nombre,
      telefono,
      email,
      fecha_reserva: fecha,
      hora_inicio: hora,
      numero_personas: parseInt(numero_personas),
      observaciones,
      canal: 'web'
    });

    return res.render('reservar', {
      success: `Reserva creada exitosamente. Código: ${reserva.id_reserva}`,
      error: null,
      form: null
    });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return res.render('reservar', {
      error: error.message || 'Error al crear la reserva',
      success: null,
      form: req.body
    });
  }
};

// Listar reservas (público - solo muestra)
exports.list = async (req, res) => {
  try {
    const reservas = await findAll();
    res.render('inicio', { reservas });
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.render('inicio', { reservas: [], error: 'Error al cargar las reservas' });
  }
};

// Dashboard - Reservas del día
exports.dashboard = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const reservas = await findByDate(hoy);
    const estadisticas = await getEstadisticasDia(hoy);
    res.render('dashboard', { reservas, estadisticas, fecha: hoy });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.render('dashboard', { reservas: [], estadisticas: null, fecha: new Date().toISOString().split('T')[0], error: 'Error al cargar el dashboard' });
  }
};

// Listar todas las reservas (admin/recepcionista)
exports.listAll = async (req, res) => {
  try {
    const reservas = await findAll();
    res.render('reservas/list', { reservas });
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.render('reservas/list', { reservas: [], error: 'Error al cargar las reservas' });
  }
};

// Ver detalles de una reserva
exports.show = async (req, res) => {
  try {
    const reserva = await findById(req.params.id);
    if (!reserva) {
      return res.status(404).send('Reserva no encontrada');
    }
    const mesas = await findAllMesas();
    res.render('reservas/show', { reserva, mesas });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).send('Error al cargar la reserva');
  }
};

// Mostrar formulario de edición
exports.showEdit = async (req, res) => {
  try {
    const reserva = await findById(req.params.id);
    if (!reserva) {
      return res.status(404).send('Reserva no encontrada');
    }
    
    // Asegurar que la fecha esté en formato YYYY-MM-DD para el input type="date"
    if (reserva.fecha_reserva) {
      // Si viene como objeto Date, convertirlo a string
      if (reserva.fecha_reserva instanceof Date) {
        reserva.fecha_reserva = reserva.fecha_reserva.toISOString().split('T')[0];
      } else if (typeof reserva.fecha_reserva === 'string') {
        // Si ya es string, asegurarse de que esté en formato correcto
        const fecha = new Date(reserva.fecha_reserva);
        if (!isNaN(fecha.getTime())) {
          reserva.fecha_reserva = fecha.toISOString().split('T')[0];
        }
      }
    }
    
    // Asegurar que la hora esté en formato HH:MM para el input type="time"
    if (reserva.hora_inicio && reserva.hora_inicio.length > 5) {
      reserva.hora_inicio = reserva.hora_inicio.substring(0, 5);
    }
    
    const mesas = await findAllMesas();
    const clientes = await findAllClientes();
    res.render('reservas/form', { reserva, mesas, clientes, error: null });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).send('Error al cargar la reserva');
  }
};

// Actualizar reserva
exports.update = async (req, res) => {
  const { fecha_reserva, hora_inicio, numero_personas, id_mesa, estado, observaciones } = req.body;

  try {
    // Validar hora si se cambia
    if (hora_inicio && fecha_reserva) {
      const horaValida = await isHoraValida(fecha_reserva, hora_inicio);
      if (!horaValida) {
        const reserva = await findById(req.params.id);
        // Formatear fecha y hora para el formulario
        if (reserva.fecha_reserva instanceof Date) {
          reserva.fecha_reserva = reserva.fecha_reserva.toISOString().split('T')[0];
        }
        if (reserva.hora_inicio && reserva.hora_inicio.length > 5) {
          reserva.hora_inicio = reserva.hora_inicio.substring(0, 5);
        }
        const mesas = await findAllMesas();
        const clientes = await findAllClientes();
        return res.render('reservas/form', {
          reserva: { ...reserva, fecha_reserva, hora_inicio, numero_personas, id_mesa, estado, observaciones },
          mesas,
          clientes,
          error: 'La hora seleccionada no está dentro del horario de atención'
        });
      }
    }

    await updateReserva(req.params.id, {
      fecha_reserva,
      hora_inicio,
      numero_personas: numero_personas ? parseInt(numero_personas) : undefined,
      id_mesa: id_mesa ? parseInt(id_mesa) : null,
      estado,
      observaciones
    });
    res.redirect(`/reservas/${req.params.id}`);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    const reserva = await findById(req.params.id);
    // Formatear fecha y hora para el formulario
    if (reserva.fecha_reserva instanceof Date) {
      reserva.fecha_reserva = reserva.fecha_reserva.toISOString().split('T')[0];
    }
    if (reserva.hora_inicio && reserva.hora_inicio.length > 5) {
      reserva.hora_inicio = reserva.hora_inicio.substring(0, 5);
    }
    const mesas = await findAllMesas();
    const clientes = await findAllClientes();
    res.render('reservas/form', {
      reserva: { ...reserva, fecha_reserva, hora_inicio, numero_personas, id_mesa, estado, observaciones },
      mesas,
      clientes,
      error: error.message || 'Error al actualizar la reserva'
    });
  }
};

// Cancelar reserva
exports.cancel = async (req, res) => {
  try {
    await cancelarReserva(req.params.id);
    res.redirect('/reservas');
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).send('Error al cancelar la reserva');
  }
};

// Marcar como no-show
exports.noShow = async (req, res) => {
  try {
    await marcarNoShow(req.params.id);
    res.redirect('/reservas');
  } catch (error) {
    console.error('Error al marcar no-show:', error);
    res.status(500).send('Error al marcar no-show');
  }
};
