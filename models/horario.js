const { query } = require('../config/database');

// Obtener todos los horarios
async function findAll() {
  try {
    return await query(
      'SELECT * FROM horarios_atencion ORDER BY dia_semana, hora_apertura'
    );
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    throw error;
  }
}

// Obtener horarios activos
async function findActive() {
  try {
    return await query(
      'SELECT * FROM horarios_atencion WHERE activo = TRUE ORDER BY dia_semana, hora_apertura'
    );
  } catch (error) {
    console.error('Error al obtener horarios activos:', error);
    throw error;
  }
}

// Obtener horarios por día de la semana
async function findByDiaSemana(diaSemana) {
  try {
    return await query(
      'SELECT * FROM horarios_atencion WHERE dia_semana = ? AND activo = TRUE ORDER BY hora_apertura',
      [diaSemana]
    );
  } catch (error) {
    console.error('Error al obtener horarios por día:', error);
    throw error;
  }
}

// Verificar si una hora está dentro del horario de atención
async function isHoraValida(fecha, hora) {
  try {
    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay(); // 0=domingo, 1=lunes, etc.
    
    const horarios = await findByDiaSemana(diaSemana);
    
    if (horarios.length === 0) {
      return false; // No hay horario para ese día
    }

    const [horaH, horaM] = hora.split(':').map(Number);
    const horaMinutos = horaH * 60 + horaM;

    for (const horario of horarios) {
      const [aperturaH, aperturaM] = horario.hora_apertura.split(':').map(Number);
      const [cierreH, cierreM] = horario.hora_cierre.split(':').map(Number);
      
      const aperturaMinutos = aperturaH * 60 + aperturaM;
      const cierreMinutos = cierreH * 60 + cierreM;

      if (horaMinutos >= aperturaMinutos && horaMinutos < cierreMinutos) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error al validar hora:', error);
    throw error;
  }
}

// Crear nuevo horario
async function createHorario({ dia_semana, hora_apertura, hora_cierre, activo = true }) {
  try {
    const result = await query(
      'INSERT INTO horarios_atencion (dia_semana, hora_apertura, hora_cierre, activo) VALUES (?, ?, ?, ?)',
      [dia_semana, hora_apertura, hora_cierre, activo]
    );
    return await findById(result.insertId);
  } catch (error) {
    console.error('Error al crear horario:', error);
    throw error;
  }
}

// Buscar horario por ID
async function findById(id) {
  try {
    const horarios = await query(
      'SELECT * FROM horarios_atencion WHERE id_horario = ?',
      [id]
    );
    return horarios.length > 0 ? horarios[0] : null;
  } catch (error) {
    console.error('Error al buscar horario por ID:', error);
    throw error;
  }
}

// Actualizar horario
async function updateHorario(id, { dia_semana, hora_apertura, hora_cierre, activo }) {
  try {
    const updates = [];
    const params = [];

    if (dia_semana !== undefined) {
      updates.push('dia_semana = ?');
      params.push(dia_semana);
    }
    if (hora_apertura !== undefined) {
      updates.push('hora_apertura = ?');
      params.push(hora_apertura);
    }
    if (hora_cierre !== undefined) {
      updates.push('hora_cierre = ?');
      params.push(hora_cierre);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      params.push(activo);
    }

    if (updates.length === 0) {
      return await findById(id);
    }

    params.push(id);
    await query(
      `UPDATE horarios_atencion SET ${updates.join(', ')} WHERE id_horario = ?`,
      params
    );

    return await findById(id);
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    throw error;
  }
}

// Eliminar horario
async function deleteHorario(id) {
  try {
    await query(
      'DELETE FROM horarios_atencion WHERE id_horario = ?',
      [id]
    );
    return true;
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    throw error;
  }
}

module.exports = {
  findAll,
  findActive,
  findByDiaSemana,
  isHoraValida,
  createHorario,
  findById,
  updateHorario,
  deleteHorario
};

