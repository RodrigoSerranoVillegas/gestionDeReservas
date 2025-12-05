const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  rol: {
    type: DataTypes.ENUM('admin', 'recepcionista', 'mesero'),
    allowNull: false,
    defaultValue: 'recepcionista'
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo'
  },
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.contraseña) {
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('contraseña')) {
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, 10);
      }
    }
  }
});

// Método de instancia para verificar contraseña
Usuario.prototype.verifyPassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.contraseña);
};

// Método estático para buscar por email
Usuario.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

// Método estático para buscar por ID de forma segura (sin contraseña)
Usuario.findByIdSafe = async function(id) {
  const usuario = await this.findByPk(id, {
    attributes: { exclude: ['contraseña'] }
  });
  return usuario;
};

module.exports = Usuario;
