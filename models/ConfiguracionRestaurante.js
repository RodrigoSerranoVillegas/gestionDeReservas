const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConfiguracionRestaurante = sequelize.define('ConfiguracionRestaurante', {
  id_config: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_restaurante: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email_notificaciones: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  duracion_estandar_reserva: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 90,
    comment: 'en minutos'
  },
  intervalo_reservas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'en minutos'
  },
  max_reservas_por_franja: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tiempo_max_cancelacion_antes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60,
    comment: 'en minutos'
  },
  tiempo_max_retraso: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 20,
    comment: 'en minutos antes de marcar no-show'
  }
}, {
  tableName: 'configuracion_restaurante',
  timestamps: true,
  createdAt: false,
  updatedAt: 'actualizado_en'
});

// Método estático para obtener o crear configuración
ConfiguracionRestaurante.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      nombre_restaurante: 'Mi Restaurante',
      direccion: '',
      telefono: '',
      email_notificaciones: '',
      duracion_estandar_reserva: 90,
      intervalo_reservas: 30,
      tiempo_max_cancelacion_antes: 60,
      tiempo_max_retraso: 20
    });
  }
  return config;
};

module.exports = ConfiguracionRestaurante;


