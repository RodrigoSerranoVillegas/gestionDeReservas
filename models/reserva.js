const { query } = require('../config/database');
const { findAvailableMesas } = require('./mesa');
const { findOrCreate } = require('./cliente');
const { getConfig } = require('./configuracion');

// Buscar reserva por ID
async function findById(id) {
  try {
    const reservas = await query(
      `SELECT r.*, 
              c.nombre_completo as cliente_nombre, c.telefono as cliente_telefono, c.email as cliente_email,
              m.nombre as mesa_nombre, m.capacidad as mesa_capacidad, m.zona as mesa_zona,
              u.nombre as creado_por_nombre
       FROM reservas r
       LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
       LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
       LEFT JOIN usuarios u ON r.creado_por = u.id_usuario
       WHERE r.id_reserva = ?`,
      [id]
    );
    return reservas.length > 0 ? reservas[0] : null;
  } catch (error) {
    console.error('Error al buscar reserva por ID:', error);
    throw error;
  }
}

// Obtener todas las reservas
async function findAll() {
  try {
    return await query(
      `SELECT r.*, 
              c.nombre_completo as cliente_nombre, c.telefono as cliente_telefono, c.email as cliente_email,
              m.nombre as mesa_nombre, m.zona as mesa_zona
       FROM reservas r
       LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
       LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
       ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC`
    );
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    throw error;
  }
}

// Obtener reservas por fecha
async function findByDate(fecha) {
  try {
    return await query(
      `SELECT r.*, 
              c.nombre_completo as cliente_nombre, c.telefono as cliente_telefono, c.email as cliente_email,
              m.nombre as mesa_nombre, m.zona as mesa_zona
       FROM reservas r
       LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
       LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
       WHERE r.fecha_reserva = ?
       ORDER BY r.hora_inicio ASC`,
      [fecha]
    );
  } catch (error) {
    console.error('Error al obtener reservas por fecha:', error);
    throw error;
  }
}

// Crear nueva reserva
async function createReserva({
  nombre_completo,
  telefono,
  email,
  fecha_reserva,
  hora_inicio,
  numero_personas,
  observaciones,
  canal = 'web',
  creado_por = null,
  id_mesa = null
}) {
  try {
    // Validar que la fecha no sea en el pasado
    const fechaReserva = new Date(fecha_reserva);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaReserva < hoy) {
      throw new Error('No se pueden crear reservas en fechas pasadas');
    }

    // Buscar o crear cliente
    const cliente = await findOrCreate({
      nombre_completo,
      telefono,
      email,
      notas: observaciones
    });

    // Obtener configuración para calcular hora_fin
    const config = await getConfig();
    const duracion = config.duracion_estandar_reserva || 90;

    // Calcular hora_fin
    const [hora, minutos] = hora_inicio.split(':').map(Number);
    const horaInicioDate = new Date();
    horaInicioDate.setHours(hora, minutos, 0, 0);
    const horaFinDate = new Date(horaInicioDate.getTime() + duracion * 60000);
    const hora_fin = `${horaFinDate.getHours().toString().padStart(2, '0')}:${horaFinDate.getMinutes().toString().padStart(2, '0')}:00`;

    // Si no se proporciona mesa, buscar una disponible
    let mesaId = id_mesa;
    if (!mesaId) {
      const mesasDisponibles = await findAvailableMesas(
        fecha_reserva,
        hora_inicio,
        hora_fin,
        numero_personas
      );
      if (mesasDisponibles.length > 0) {
        // Elegir la mesa con capacidad más ajustada
        mesaId = mesasDisponibles[0].id_mesa;
      } else {
        // No hay mesas disponibles, pero se puede crear la reserva sin mesa
        mesaId = null;
      }
    }

    // Crear la reserva
    const result = await query(
      'INSERT INTO reservas (id_cliente, id_mesa, fecha_reserva, hora_inicio, hora_fin, numero_personas, estado, canal, observaciones, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        cliente.id_cliente,
        mesaId,
        fecha_reserva,
        hora_inicio,
        hora_fin,
        numero_personas,
        'pendiente',
        canal,
        observaciones || null,
        creado_por
      ]
    );

    return await findById(result.insertId);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    throw error;
  }
}

// Actualizar reserva
async function updateReserva(id, {
  fecha_reserva,
  hora_inicio,
  numero_personas,
  id_mesa,
  estado,
  observaciones
}) {
  try {
    const updates = [];
    const params = [];

    if (fecha_reserva !== undefined) {
      updates.push('fecha_reserva = ?');
      params.push(fecha_reserva);
    }
    if (hora_inicio !== undefined) {
      updates.push('hora_inicio = ?');
      params.push(hora_inicio);
      
      // Recalcular hora_fin si se cambia hora_inicio
      const config = await getConfig();
      const duracion = config.duracion_estandar_reserva || 90;
      const [hora, minutos] = hora_inicio.split(':').map(Number);
      const horaInicioDate = new Date();
      horaInicioDate.setHours(hora, minutos, 0, 0);
      const horaFinDate = new Date(horaInicioDate.getTime() + duracion * 60000);
      const hora_fin = `${horaFinDate.getHours().toString().padStart(2, '0')}:${horaFinDate.getMinutes().toString().padStart(2, '0')}:00`;
      updates.push('hora_fin = ?');
      params.push(hora_fin);
    }
    if (numero_personas !== undefined) {
      updates.push('numero_personas = ?');
      params.push(numero_personas);
    }
    if (id_mesa !== undefined) {
      updates.push('id_mesa = ?');
      params.push(id_mesa);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      params.push(estado);
    }
    if (observaciones !== undefined) {
      updates.push('observaciones = ?');
      params.push(observaciones);
    }

    if (updates.length === 0) {
      return await findById(id);
    }

    params.push(id);
    await query(
      `UPDATE reservas SET ${updates.join(', ')} WHERE id_reserva = ?`,
      params
    );

    return await findById(id);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    throw error;
  }
}

// Cancelar reserva
async function cancelarReserva(id) {
  try {
    await query(
      'UPDATE reservas SET estado = ? WHERE id_reserva = ?',
      ['cancelada', id]
    );
    return await findById(id);
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    throw error;
  }
}

// Marcar como no-show
async function marcarNoShow(id) {
  try {
    await query(
      'UPDATE reservas SET estado = ? WHERE id_reserva = ?',
      ['no_show', id]
    );
    return await findById(id);
  } catch (error) {
    console.error('Error al marcar no-show:', error);
    throw error;
  }
}

// Obtener estadísticas del día
async function getEstadisticasDia(fecha) {
  try {
    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN estado = 'en_curso' THEN 1 ELSE 0 END) as en_curso,
        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN estado = 'no_show' THEN 1 ELSE 0 END) as no_shows,
        SUM(numero_personas) as total_personas
       FROM reservas 
       WHERE fecha_reserva = ?`,
      [fecha]
    );
    return stats[0];
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
}

module.exports = {
  findById,
  findAll,
  findByDate,
  createReserva,
  updateReserva,
  cancelarReserva,
  marcarNoShow,
  getEstadisticasDia
};
