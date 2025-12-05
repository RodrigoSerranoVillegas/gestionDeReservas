const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  id_reserva: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id_cliente'
    }
  },
  id_mesa: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'mesas',
      key: 'id_mesa'
    }
  },
  fecha_reserva: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: true
  },
  numero_personas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_show'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  canal: {
    type: DataTypes.ENUM('web', 'telefono', 'presencial'),
    allowNull: false,
    defaultValue: 'web'
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  creado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  }
}, {
  tableName: 'reservas',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: 'actualizado_en'
});

// Método estático para obtener reservas por fecha con relaciones
Reserva.findByDateWithRelations = async function(fecha) {
  return await this.findAll({
    where: { fecha_reserva: fecha },
    include: [
      {
        model: require('./Cliente'),
        as: 'cliente',
        attributes: ['id_cliente', 'nombre_completo', 'telefono', 'email']
      },
      {
        model: require('./Mesa'),
        as: 'mesa',
        attributes: ['id_mesa', 'nombre', 'zona']
      }
    ],
    order: [['hora_inicio', 'ASC']]
  });
};

// Método estático para obtener estadísticas del día
Reserva.getEstadisticasDia = async function(fecha) {
  const { Op } = require('sequelize');
  
  const total = await this.count({ where: { fecha_reserva: fecha } });
  const confirmadas = await this.count({ 
    where: { fecha_reserva: fecha, estado: 'confirmada' } 
  });
  const en_curso = await this.count({ 
    where: { fecha_reserva: fecha, estado: 'en_curso' } 
  });
  const completadas = await this.count({ 
    where: { fecha_reserva: fecha, estado: 'completada' } 
  });
  const canceladas = await this.count({ 
    where: { fecha_reserva: fecha, estado: 'cancelada' } 
  });
  const no_shows = await this.count({ 
    where: { fecha_reserva: fecha, estado: 'no_show' } 
  });
  
  const totalPersonas = await this.sum('numero_personas', {
    where: { fecha_reserva: fecha }
  });
  
  return {
    total: total || 0,
    confirmadas: confirmadas || 0,
    en_curso: en_curso || 0,
    completadas: completadas || 0,
    canceladas: canceladas || 0,
    no_shows: no_shows || 0,
    total_personas: totalPersonas || 0
  };
};

module.exports = Reserva;
