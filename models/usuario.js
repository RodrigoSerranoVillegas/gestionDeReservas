const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// Buscar usuario por email
async function findByEmail(email) {
  try {
    const usuarios = await query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return usuarios.length > 0 ? usuarios[0] : null;
  } catch (error) {
    console.error('Error al buscar usuario por email:', error);
    throw error;
  }
}

// Buscar usuario por ID
async function findById(id) {
  try {
    const usuarios = await query(
      'SELECT id_usuario, nombre, email, rol, estado, creado_en FROM usuarios WHERE id_usuario = ?',
      [id]
    );
    return usuarios.length > 0 ? usuarios[0] : null;
  } catch (error) {
    console.error('Error al buscar usuario por ID:', error);
    throw error;
  }
}

// Crear nuevo usuario
async function createUser({ nombre, email, password, rol = 'recepcionista' }) {
  try {
    // Verificar si el email ya existe
    const existingUser = await findByEmail(email);
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO usuarios (nombre, email, contraseña, rol, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol, 'activo']
    );

    return await findById(result.insertId);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

// Verificar contraseña
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

// Obtener todos los usuarios
async function findAll() {
  try {
    return await query(
      'SELECT id_usuario, nombre, email, rol, estado, creado_en FROM usuarios ORDER BY nombre'
    );
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

// Actualizar usuario
async function updateUser(id, { nombre, email, rol, estado }) {
  try {
    const updates = [];
    const params = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (rol !== undefined) {
      updates.push('rol = ?');
      params.push(rol);
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
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id_usuario = ?`,
      params
    );

    return await findById(id);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
}

// Cambiar contraseña
async function updatePassword(id, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?',
      [hashedPassword, id]
    );
    return true;
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    throw error;
  }
}

// Eliminar usuario (soft delete - cambiar estado)
async function deleteUser(id) {
  try {
    await query(
      'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
      ['inactivo', id]
    );
    return true;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  verifyPassword,
  findAll,
  updateUser,
  updatePassword,
  deleteUser
};

