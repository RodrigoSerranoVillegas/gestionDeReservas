const { query } = require('../config/database');

// Buscar cliente por ID
async function findById(id) {
  try {
    const clientes = await query(
      'SELECT * FROM clientes WHERE id_cliente = ?',
      [id]
    );
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error('Error al buscar cliente por ID:', error);
    throw error;
  }
}

// Buscar cliente por email
async function findByEmail(email) {
  try {
    const clientes = await query(
      'SELECT * FROM clientes WHERE email = ?',
      [email]
    );
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error('Error al buscar cliente por email:', error);
    throw error;
  }
}

// Buscar cliente por teléfono
async function findByTelefono(telefono) {
  try {
    const clientes = await query(
      'SELECT * FROM clientes WHERE telefono = ?',
      [telefono]
    );
    return clientes.length > 0 ? clientes[0] : null;
  } catch (error) {
    console.error('Error al buscar cliente por teléfono:', error);
    throw error;
  }
}

// Crear o encontrar cliente
async function findOrCreate({ nombre_completo, telefono, email, notas }) {
  try {
    // Intentar encontrar por email o teléfono
    let cliente = null;
    if (email) {
      cliente = await findByEmail(email);
    }
    if (!cliente && telefono) {
      cliente = await findByTelefono(telefono);
    }

    // Si no existe, crear uno nuevo
    if (!cliente) {
      const result = await query(
        'INSERT INTO clientes (nombre_completo, telefono, email, notas) VALUES (?, ?, ?, ?)',
        [nombre_completo, telefono || null, email || null, notas || null]
      );
      cliente = await findById(result.insertId);
    } else {
      // Actualizar datos si es necesario
      const updates = [];
      const params = [];

      if (nombre_completo && nombre_completo !== cliente.nombre_completo) {
        updates.push('nombre_completo = ?');
        params.push(nombre_completo);
      }
      if (telefono && telefono !== cliente.telefono) {
        updates.push('telefono = ?');
        params.push(telefono);
      }
      if (email && email !== cliente.email) {
        updates.push('email = ?');
        params.push(email);
      }
      if (notas && notas !== cliente.notas) {
        updates.push('notas = ?');
        params.push(notas);
      }

      if (updates.length > 0) {
        params.push(cliente.id_cliente);
        await query(
          `UPDATE clientes SET ${updates.join(', ')} WHERE id_cliente = ?`,
          params
        );
        cliente = await findById(cliente.id_cliente);
      }
    }

    return cliente;
  } catch (error) {
    console.error('Error al buscar o crear cliente:', error);
    throw error;
  }
}

// Obtener todos los clientes
async function findAll() {
  try {
    return await query(
      'SELECT * FROM clientes ORDER BY nombre_completo'
    );
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
}

// Actualizar cliente
async function updateCliente(id, { nombre_completo, telefono, email, notas }) {
  try {
    const updates = [];
    const params = [];

    if (nombre_completo !== undefined) {
      updates.push('nombre_completo = ?');
      params.push(nombre_completo);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      params.push(telefono);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (notas !== undefined) {
      updates.push('notas = ?');
      params.push(notas);
    }

    if (updates.length === 0) {
      return await findById(id);
    }

    params.push(id);
    await query(
      `UPDATE clientes SET ${updates.join(', ')} WHERE id_cliente = ?`,
      params
    );

    return await findById(id);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

// Obtener historial de reservas de un cliente
async function getHistorialReservas(idCliente) {
  try {
    return await query(
      `SELECT r.*, m.nombre as mesa_nombre 
       FROM reservas r 
       LEFT JOIN mesas m ON r.id_mesa = m.id_mesa 
       WHERE r.id_cliente = ? 
       ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC`,
      [idCliente]
    );
  } catch (error) {
    console.error('Error al obtener historial de reservas:', error);
    throw error;
  }
}

module.exports = {
  findById,
  findByEmail,
  findByTelefono,
  findOrCreate,
  findAll,
  updateCliente,
  getHistorialReservas
};

