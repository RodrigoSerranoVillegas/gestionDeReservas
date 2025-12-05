const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Mesa = sequelize.define('Mesa', {
  id_mesa: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  zona: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('activa', 'inactiva'),
    allowNull: false,
    defaultValue: 'activa'
  }
}, {
  tableName: 'mesas',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});

// Método estático para buscar mesas disponibles
Mesa.findAvailableMesas = async function(fecha, horaInicio, horaFin, numeroPersonas) {
  const { Reserva } = require('./index');
  
  // Obtener todas las mesas activas con capacidad suficiente
  const mesas = await this.findAll({
    where: {
      estado: 'activa',
      capacidad: {
        [sequelize.Op.gte]: numeroPersonas
      }
    },
    order: [['capacidad', 'ASC'], ['nombre', 'ASC']]
  });
  
  // Filtrar mesas que tienen reservas solapadas
  const mesasDisponibles = [];
  
  for (const mesa of mesas) {
    const reservasSolapadas = await Reserva.count({
      where: {
        id_mesa: mesa.id_mesa,
        fecha_reserva: fecha,
        estado: {
          [sequelize.Op.notIn]: ['cancelada', 'no_show', 'completada']
        },
        [sequelize.Op.or]: [
          {
            [sequelize.Op.and]: [
              { hora_inicio: { [sequelize.Op.lt]: horaFin } },
              { hora_fin: { [sequelize.Op.gt]: horaInicio } }
            ]
          },
          {
            [sequelize.Op.and]: [
              { hora_inicio: { [sequelize.Op.gte]: horaInicio } },
              { hora_inicio: { [sequelize.Op.lt]: horaFin } }
            ]
          }
        ]
      }
    });
    
    if (reservasSolapadas === 0) {
      mesasDisponibles.push(mesa);
    }
  }
  
  return mesasDisponibles;
};

// Método estático para obtener capacidad total
Mesa.getTotalCapacity = async function() {
  const result = await this.sum('capacidad', {
    where: { estado: 'activa' }
  });
  return result || 0;
};

module.exports = Mesa;
