const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_completo: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'clientes',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});

// Método estático para buscar o crear cliente
Cliente.findOrCreateCliente = async function({ nombre_completo, telefono, email, notas }) {
  let cliente = null;
  
  // Intentar encontrar por email o teléfono SOLO si tienen valor
  // Esto evita coincidencias incorrectas con valores null/vacíos
  if (email && email.trim() !== '') {
    cliente = await this.findOne({ where: { email: email.trim() } });
  }
  // Solo buscar por teléfono si no se encontró por email Y el teléfono tiene valor
  if (!cliente && telefono && telefono.trim() !== '') {
    cliente = await this.findOne({ where: { telefono: telefono.trim() } });
  }
  
  // Si no existe, crear uno nuevo
  if (!cliente) {
    cliente = await this.create({
      nombre_completo,
      telefono: telefono && telefono.trim() !== '' ? telefono.trim() : null,
      email: email && email.trim() !== '' ? email.trim() : null,
      notas: notas || null
    });
  } else {
    // Actualizar datos si es necesario (solo si hay cambios reales)
    const updates = {};
    if (nombre_completo && nombre_completo.trim() !== '' && nombre_completo.trim() !== cliente.nombre_completo) {
      updates.nombre_completo = nombre_completo.trim();
    }
    if (telefono && telefono.trim() !== '' && telefono.trim() !== cliente.telefono) {
      updates.telefono = telefono.trim();
    }
    if (email && email.trim() !== '' && email.trim() !== cliente.email) {
      updates.email = email.trim();
    }
    // Solo actualizar notas si se proporcionan y son diferentes
    if (notas !== undefined && notas !== null && notas !== cliente.notas) {
      updates.notas = notas;
    }
    
    if (Object.keys(updates).length > 0) {
      await cliente.update(updates);
      await cliente.reload();
    }
  }
  
  return cliente;
};

module.exports = Cliente;
