const { Reserva, Cliente, Mesa, Usuario, ConfiguracionRestaurante, HorarioAtencion } = require('../models');
const { validarCrearReserva, validarActualizarReserva } = require('../utils/validaciones');

// Funciones helper
async function createReserva(data) {
  // Buscar o crear cliente
  const cliente = await Cliente.findOrCreateCliente({
    nombre_completo: data.nombre_completo,
    telefono: data.telefono,
    email: data.email,
    notas: data.observaciones
  });

  // Calcular hora_fin basada en duración estándar
  const config = await ConfiguracionRestaurante.getConfig();
  const [horaH, horaM] = data.hora_inicio.split(':').map(Number);
  const horaInicioMinutos = horaH * 60 + horaM;
  const duracion = data.duracion || config.duracion_estandar_reserva;
  const horaFinMinutos = horaInicioMinutos + duracion;
  const horaFin = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;

  // Crear la reserva
  const reserva = await Reserva.create({
    id_cliente: cliente.id_cliente,
    id_mesa: data.id_mesa || null,
    fecha_reserva: data.fecha_reserva,
    hora_inicio: data.hora_inicio,
    hora_fin: horaFin,
    numero_personas: data.numero_personas,
    observaciones: data.observaciones,
    canal: data.canal || 'web',
    estado: data.estado || 'pendiente',
    creado_por: data.creado_por || null
  });

  return reserva;
}

// Función helper para formatear reserva con relaciones planas
function formatReserva(reserva) {
  if (!reserva) return null;
  
  const reservaData = reserva.toJSON ? reserva.toJSON() : reserva;
  
  // Aplanar relaciones para compatibilidad con vistas
  if (reservaData.cliente) {
    reservaData.cliente_nombre = reservaData.cliente.nombre_completo;
    reservaData.cliente_telefono = reservaData.cliente.telefono;
    reservaData.cliente_email = reservaData.cliente.email;
    // Preservar id_cliente si no está en el nivel principal
    if (!reservaData.id_cliente && reservaData.cliente.id_cliente) {
      reservaData.id_cliente = reservaData.cliente.id_cliente;
    }
  }
  
  if (reservaData.mesa) {
    reservaData.mesa_nombre = reservaData.mesa.nombre;
    reservaData.mesa_zona = reservaData.mesa.zona;
    reservaData.mesa_capacidad = reservaData.mesa.capacidad;
    // Preservar id_mesa si no está en el nivel principal
    if (!reservaData.id_mesa && reservaData.mesa.id_mesa) {
      reservaData.id_mesa = reservaData.mesa.id_mesa;
    }
  }
  
  // Asegurar que id_mesa sea un número o null
  if (reservaData.id_mesa !== null && reservaData.id_mesa !== undefined) {
    reservaData.id_mesa = parseInt(reservaData.id_mesa);
  } else {
    reservaData.id_mesa = null;
  }
  
  return reservaData;
}

async function findAll() {
  const reservas = await Reserva.findAll({
    include: [
      { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre_completo', 'telefono', 'email'] },
      { model: Mesa, as: 'mesa', attributes: ['id_mesa', 'nombre', 'zona', 'capacidad'] }
    ],
    order: [['fecha_reserva', 'DESC'], ['hora_inicio', 'ASC']]
  });
  
  return reservas.map(formatReserva);
}

async function findByDate(fecha) {
  const reservas = await Reserva.findByDateWithRelations(fecha);
  return reservas.map(formatReserva);
}

async function getEstadisticasDia(fecha) {
  return await Reserva.getEstadisticasDia(fecha);
}

async function findById(id) {
  const reserva = await Reserva.findByPk(id, {
    include: [
      { model: Cliente, as: 'cliente' },
      { model: Mesa, as: 'mesa' }
    ]
  });
  return formatReserva(reserva);
}

async function updateReserva(id, data) {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    throw new Error('Reserva no encontrada');
  }
  
  // Calcular hora_fin si se actualiza hora_inicio
  if (data.hora_inicio) {
    const config = await ConfiguracionRestaurante.getConfig();
    const [horaH, horaM] = data.hora_inicio.split(':').map(Number);
    const horaInicioMinutos = horaH * 60 + horaM;
    const duracion = data.duracion || config.duracion_estandar_reserva;
    const horaFinMinutos = horaInicioMinutos + duracion;
    data.hora_fin = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;
  }
  
  await reserva.update(data);
  // Recargar con relaciones para obtener datos actualizados
  await reserva.reload({
    include: [
      { model: Cliente, as: 'cliente' },
      { model: Mesa, as: 'mesa' }
    ]
  });
  return formatReserva(reserva);
}

async function cancelarReserva(id) {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    throw new Error('Reserva no encontrada');
  }
  await reserva.update({ estado: 'cancelada' });
  return reserva;
}

async function marcarNoShow(id) {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    throw new Error('Reserva no encontrada');
  }
  await reserva.update({ estado: 'no_show' });
  return reserva;
}

async function findAllMesas() {
  return await Mesa.findAll({
    where: { estado: 'activa' },
    order: [['nombre', 'ASC']]
  });
}

async function findAllClientes() {
  return await Cliente.findAll({
    order: [['nombre_completo', 'ASC']]
  });
}

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
    // Buscar o crear cliente primero para obtener id_cliente
    const cliente = await Cliente.findOrCreateCliente({
      nombre_completo: nombre,
      telefono,
      email,
      notas: observaciones
    });

    // Validar todas las reglas de negocio
    await validarCrearReserva({
      fecha_reserva: fecha,
      hora_inicio: hora,
      numero_personas: parseInt(numero_personas),
      id_mesa: null, // No se asigna mesa automáticamente en reserva pública
      id_cliente: cliente.id_cliente
    });

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

// Mostrar formulario de creación (interno)
exports.showCreate = async (req, res) => {
  try {
    const mesas = await findAllMesas();
    const clientes = await findAllClientes();
    res.render('reservas/form', { reserva: null, mesas, clientes, error: null });
  } catch (error) {
    console.error('Error al cargar formulario de creación:', error);
    res.status(500).send('Error al cargar el formulario');
  }
};

// Crear reserva (interno - recepcionista/admin)
exports.createInternal = async (req, res) => {
  const { id_cliente, fecha_reserva, hora_inicio, numero_personas, id_mesa, estado, observaciones } = req.body;
  const creado_por = req.session?.userId || null;

  if (!id_cliente || !fecha_reserva || !hora_inicio || !numero_personas) {
    const mesas = await findAllMesas();
    const clientes = await findAllClientes();
    return res.render('reservas/form', {
      reserva: req.body,
      mesas,
      clientes,
      error: 'Cliente, fecha, hora y número de personas son requeridos'
    });
  }

  try {
    // Obtener cliente
    const cliente = await Cliente.findByPk(id_cliente);
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    // Preparar datos para validación
    const dataReserva = {
      fecha_reserva,
      hora_inicio,
      numero_personas: parseInt(numero_personas),
      id_mesa: id_mesa && id_mesa !== '' && id_mesa !== '0' ? parseInt(id_mesa) : null,
      id_cliente: cliente.id_cliente
    };

    // Validar todas las reglas de negocio
    await validarCrearReserva(dataReserva);

    // Crear la reserva
    const reserva = await createReserva({
      nombre_completo: cliente.nombre_completo,
      telefono: cliente.telefono,
      email: cliente.email,
      fecha_reserva,
      hora_inicio,
      numero_personas: parseInt(numero_personas),
      id_mesa: dataReserva.id_mesa,
      observaciones,
      canal: 'presencial',
      estado: estado || 'pendiente',
      creado_por
    });

    res.redirect(`/reservas/${reserva.id_reserva}`);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    const mesas = await findAllMesas();
    const clientes = await findAllClientes();
    res.render('reservas/form', {
      reserva: req.body,
      mesas,
      clientes,
      error: error.message || 'Error al crear la reserva'
    });
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
  const rolUsuario = req.session?.rol || 'recepcionista';

  try {
    // Preparar datos para actualizar
    const updateData = {
      fecha_reserva,
      hora_inicio,
      estado,
      observaciones
    };
    
    // Solo actualizar numero_personas si se proporciona
    if (numero_personas) {
      updateData.numero_personas = parseInt(numero_personas);
    }
    
    // Manejar id_mesa: si viene vacío o "0", establecer como null
    if (id_mesa && id_mesa !== '' && id_mesa !== '0') {
      updateData.id_mesa = parseInt(id_mesa);
    } else {
      updateData.id_mesa = null;
    }

    // Validar todas las reglas de negocio antes de actualizar
    await validarActualizarReserva(req.params.id, updateData, rolUsuario);
    
    await updateReserva(req.params.id, updateData);
    res.redirect(`/reservas/${req.params.id}`);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    const reserva = await findById(req.params.id);
    // Formatear fecha y hora para el formulario
    if (reserva && reserva.fecha_reserva) {
      if (reserva.fecha_reserva instanceof Date) {
        reserva.fecha_reserva = reserva.fecha_reserva.toISOString().split('T')[0];
      } else if (typeof reserva.fecha_reserva === 'string') {
        const fecha = new Date(reserva.fecha_reserva);
        if (!isNaN(fecha.getTime())) {
          reserva.fecha_reserva = fecha.toISOString().split('T')[0];
        }
      }
    }
    if (reserva && reserva.hora_inicio && reserva.hora_inicio.length > 5) {
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
