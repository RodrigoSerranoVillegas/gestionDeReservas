const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HorarioAtencion = sequelize.define('HorarioAtencion', {
  id_horario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dia_semana: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado',
    validate: {
      min: 0,
      max: 6
    }
  },
  hora_apertura: {
    type: DataTypes.TIME,
    allowNull: false
  },
  hora_cierre: {
    type: DataTypes.TIME,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'horarios_atencion',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});

// Método estático para verificar si una hora está dentro del horario de atención
HorarioAtencion.isHoraValida = async function(fecha, hora) {
  const fechaObj = new Date(fecha);
  const diaSemana = fechaObj.getDay(); // 0=domingo, 1=lunes, etc.
  
  const horarios = await this.findAll({
    where: {
      dia_semana: diaSemana,
      activo: true
    },
    order: [['hora_apertura', 'ASC']]
  });
  
  if (horarios.length === 0) {
    return false; // No hay horario para ese día
  }
  
  const [horaH, horaM] = hora.split(':').map(Number);
  const horaMinutos = horaH * 60 + horaM;
  
  for (const horario of horarios) {
    const [aperturaH, aperturaM] = horario.hora_apertura.split(':').map(Number);
    const [cierreH, cierreM] = horario.hora_cierre.split(':').map(Number);
    
    const aperturaMinutos = aperturaH * 60 + aperturaM;
    const cierreMinutos = cierreH * 60 + cierreM;
    
    if (horaMinutos >= aperturaMinutos && horaMinutos < cierreMinutos) {
      return true;
    }
  }
  
  return false;
};

module.exports = HorarioAtencion;


