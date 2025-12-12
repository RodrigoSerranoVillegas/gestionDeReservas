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
  // Campos de cliente almacenados directamente en la reserva (para usuarios no registrados)
  cliente_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre del cliente almacenado directamente en la reserva'
  },
  cliente_telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Teléfono del cliente almacenado directamente en la reserva'
  },
  cliente_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Email del cliente almacenado directamente en la reserva'
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
  
  // Contar por estado
  const pendientes = await this.count({ 
    where: { fecha_reserva: fecha, estado: 'pendiente' } 
  });
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
  
  // Total de todas las reservas del día
  const total = await this.count({ where: { fecha_reserva: fecha } });
  
  // Total de reservas activas (pendiente + confirmada + en_curso)
  const total_activas = pendientes + confirmadas + en_curso;
  
  // Total de personas solo de reservas activas (no canceladas ni no_shows)
  const totalPersonasActivas = await this.sum('numero_personas', {
    where: { 
      fecha_reserva: fecha,
      estado: {
        [Op.in]: ['pendiente', 'confirmada', 'en_curso', 'completada']
      }
    }
  });
  
  // Total de personas de todas las reservas (para referencia)
  const totalPersonas = await this.sum('numero_personas', {
    where: { fecha_reserva: fecha }
  });
  
  return {
    total: total || 0,
    total_activas: total_activas || 0,
    pendientes: pendientes || 0,
    confirmadas: confirmadas || 0,
    en_curso: en_curso || 0,
    completadas: completadas || 0,
    canceladas: canceladas || 0,
    no_shows: no_shows || 0,
    total_personas: totalPersonasActivas || 0, // Solo personas de reservas activas
    total_personas_todas: totalPersonas || 0 // Todas las personas (incluyendo canceladas)
  };
};

module.exports = Reserva;
