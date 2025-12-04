const { query } = require('../config/database');

// Buscar mesa por ID
async function findById(id) {
  try {
    const mesas = await query(
      'SELECT * FROM mesas WHERE id_mesa = ?',
      [id]
    );
    return mesas.length > 0 ? mesas[0] : null;
  } catch (error) {
    console.error('Error al buscar mesa por ID:', error);
    throw error;
  }
}

// Obtener todas las mesas
async function findAll() {
  try {
    return await query(
      'SELECT * FROM mesas ORDER BY zona, nombre'
    );
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    throw error;
  }
}

// Obtener mesas activas
async function findActive() {
  try {
    return await query(
      'SELECT * FROM mesas WHERE estado = ? ORDER BY zona, nombre',
      ['activa']
    );
  } catch (error) {
    console.error('Error al obtener mesas activas:', error);
    throw error;
  }
}

// Crear nueva mesa
async function createMesa({ nombre, capacidad, zona, estado = 'activa' }) {
  try {
    const result = await query(
      'INSERT INTO mesas (nombre, capacidad, zona, estado) VALUES (?, ?, ?, ?)',
      [nombre, capacidad, zona, estado]
    );
    return await findById(result.insertId);
  } catch (error) {
    console.error('Error al crear mesa:', error);
    throw error;
  }
}

// Actualizar mesa
async function updateMesa(id, { nombre, capacidad, zona, estado }) {
  try {
    const updates = [];
    const params = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (capacidad !== undefined) {
      updates.push('capacidad = ?');
      params.push(capacidad);
    }
    if (zona !== undefined) {
      updates.push('zona = ?');
      params.push(zona);
    }
    if (estado !== undefined) {
      updates.push('estado = ?');
      params.push(estado);
    }

    if (updates.length === 0) {
      return await findById(id);
    }

    params.push(id);
    await query(
      `UPDATE mesas SET ${updates.join(', ')} WHERE id_mesa = ?`,
      params
    );

    return await findById(id);
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    throw error;
  }
}

// Eliminar mesa (soft delete)
async function deleteMesa(id) {
  try {
    await query(
      'UPDATE mesas SET estado = ? WHERE id_mesa = ?',
      ['inactiva', id]
    );
    return true;
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    throw error;
  }
}

// Buscar mesas disponibles para una fecha y hora específica
async function findAvailableMesas(fecha, horaInicio, horaFin, numeroPersonas) {
  try {
    // Obtener todas las mesas activas con capacidad suficiente
    const mesas = await query(
      `SELECT m.* FROM mesas m 
       WHERE m.estado = 'activa' 
       AND m.capacidad >= ? 
       AND m.id_mesa NOT IN (
         SELECT r.id_mesa FROM reservas r 
         WHERE r.fecha_reserva = ? 
         AND r.estado NOT IN ('cancelada', 'no_show', 'completada')
         AND (
           (r.hora_inicio < ? AND r.hora_fin > ?) OR
           (r.hora_inicio < ? AND r.hora_fin > ?) OR
           (r.hora_inicio >= ? AND r.hora_inicio < ?)
         )
       )
       ORDER BY m.capacidad ASC, m.nombre ASC`,
      [
        numeroPersonas,
        fecha,
        horaFin, horaInicio,
        horaFin, horaInicio,
        horaInicio, horaFin
      ]
    );
    return mesas;
  } catch (error) {
    console.error('Error al buscar mesas disponibles:', error);
    throw error;
  }
}

// Obtener capacidad total de mesas activas
async function getTotalCapacity() {
  try {
    const result = await query(
      'SELECT SUM(capacidad) as total FROM mesas WHERE estado = ?',
      ['activa']
    );
    return result[0]?.total || 0;
  } catch (error) {
    console.error('Error al obtener capacidad total:', error);
    throw error;
  }
}

module.exports = {
  findById,
  findAll,
  findActive,
  createMesa,
  updateMesa,
  deleteMesa,
  findAvailableMesas,
  getTotalCapacity
};

