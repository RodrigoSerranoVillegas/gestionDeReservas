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
  
  // Intentar encontrar por email o teléfono
  if (email) {
    cliente = await this.findOne({ where: { email } });
  }
  if (!cliente && telefono) {
    cliente = await this.findOne({ where: { telefono } });
  }
  
  // Si no existe, crear uno nuevo
  if (!cliente) {
    cliente = await this.create({
      nombre_completo,
      telefono: telefono || null,
      email: email || null,
      notas: notas || null
    });
  } else {
    // Actualizar datos si es necesario
    const updates = {};
    if (nombre_completo && nombre_completo !== cliente.nombre_completo) {
      updates.nombre_completo = nombre_completo;
    }
    if (telefono && telefono !== cliente.telefono) {
      updates.telefono = telefono;
    }
    if (email && email !== cliente.email) {
      updates.email = email;
    }
    if (notas && notas !== cliente.notas) {
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
