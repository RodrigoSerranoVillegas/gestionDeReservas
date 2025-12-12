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
  const { Reserva, ConfiguracionRestaurante } = require('./index');
  const { Op } = require('sequelize');
  
  // Obtener configuración para calcular duración si no se proporciona horaFin
  const config = await ConfiguracionRestaurante.getConfig();
  
  // Si no se proporciona horaFin, calcularla
  let horaFinCalculada = horaFin;
  if (!horaFinCalculada) {
    const [horaH, horaM] = horaInicio.split(':').map(Number);
    const horaInicioMinutos = horaH * 60 + horaM;
    const horaFinMinutos = horaInicioMinutos + config.duracion_estandar_reserva;
    horaFinCalculada = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;
  }
  
  // Obtener todas las mesas activas con capacidad suficiente
  const mesas = await this.findAll({
    where: {
      estado: 'activa',
      capacidad: {
        [Op.gte]: numeroPersonas
      }
    },
    order: [['capacidad', 'ASC'], ['nombre', 'ASC']]
  });
  
  // Filtrar mesas que tienen reservas solapadas
  const mesasDisponibles = [];
  
  // Convertir horas a minutos para comparación
  const [inicioH, inicioM] = horaInicio.split(':').map(Number);
  const [finH, finM] = horaFinCalculada.split(':').map(Number);
  const inicioMinutos = inicioH * 60 + inicioM;
  const finMinutos = finH * 60 + finM;
  
  for (const mesa of mesas) {
    // Obtener todas las reservas activas de esa mesa en esa fecha
    const reservasExistentes = await Reserva.findAll({
      where: {
        id_mesa: mesa.id_mesa,
        fecha_reserva: fecha,
        estado: {
          [Op.notIn]: ['cancelada', 'no_show', 'completada']
        }
      }
    });
    
    // Verificar solapamiento manualmente
    let tieneSolapamiento = false;
    for (const reserva of reservasExistentes) {
      const [rHoraH, rHoraM] = reserva.hora_inicio.split(':').map(Number);
      const rHoraInicioMinutos = rHoraH * 60 + rHoraM;
      
      let rHoraFinMinutos;
      if (reserva.hora_fin) {
        const [rFinH, rFinM] = reserva.hora_fin.split(':').map(Number);
        rHoraFinMinutos = rFinH * 60 + rFinM;
      } else {
        rHoraFinMinutos = rHoraInicioMinutos + config.duracion_estandar_reserva;
      }
      
      // Verificar si hay solapamiento: (inicio1 < fin2) && (fin1 > inicio2)
      if (inicioMinutos < rHoraFinMinutos && finMinutos > rHoraInicioMinutos) {
        tieneSolapamiento = true;
        break;
      }
    }
    
    if (!tieneSolapamiento) {
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
