const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Mesa = require('./Mesa');
const Reserva = require('./Reserva');
const ConfiguracionRestaurante = require('./ConfiguracionRestaurante');
const HorarioAtencion = require('./HorarioAtencion');

// Definir asociaciones
Reserva.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Reserva.belongsTo(Mesa, { foreignKey: 'id_mesa', as: 'mesa' });
Reserva.belongsTo(Usuario, { foreignKey: 'creado_por', as: 'creadoPor' });

Cliente.hasMany(Reserva, { foreignKey: 'id_cliente', as: 'reservas' });
Mesa.hasMany(Reserva, { foreignKey: 'id_mesa', as: 'reservas' });
Usuario.hasMany(Reserva, { foreignKey: 'creado_por', as: 'reservasCreadas' });

module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Mesa,
  Reserva,
  ConfiguracionRestaurante,
  HorarioAtencion
};

