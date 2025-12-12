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

// Función helper para normalizar hora
function normalizarHora(hora) {
  if (!hora) return null;
  
  // Si es un objeto Date, convertir a string
  if (hora instanceof Date) {
    return hora.toTimeString().substring(0, 5);
  }
  
  // Si es string, tomar solo HH:MM
  if (typeof hora === 'string') {
    // Remover segundos si existen (HH:MM:SS -> HH:MM)
    return hora.length > 5 ? hora.substring(0, 5) : hora;
  }
  
  return hora.toString().substring(0, 5);
}

// Método estático para verificar si una hora está dentro del horario de atención
HorarioAtencion.isHoraValida = async function(fecha, hora) {
  try {
    // Normalizar la fecha (puede venir como string YYYY-MM-DD)
    // Usar UTC para evitar problemas de zona horaria
    const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
    const diaSemana = fechaObj.getUTCDay(); // 0=domingo, 1=lunes, etc.
    
    // Normalizar la hora solicitada
    const horaNormalizada = normalizarHora(hora);
    if (!horaNormalizada || !horaNormalizada.includes(':')) {
      throw new Error(`Formato de hora inválido: ${hora}`);
    }
    
    const [horaH, horaM] = horaNormalizada.split(':').map(Number);
    if (isNaN(horaH) || isNaN(horaM)) {
      throw new Error(`No se pudo parsear la hora: ${horaNormalizada}`);
    }
    const horaMinutos = horaH * 60 + horaM;
    
    // Buscar horarios activos para ese día
    const horarios = await this.findAll({
      where: {
        dia_semana: diaSemana,
        activo: true
      },
      order: [['hora_apertura', 'ASC']]
    });
    
    if (horarios.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        console.log(`[DEBUG] No hay horarios activos para ${dias[diaSemana]} (día ${diaSemana})`);
      }
      return false;
    }
    
    // Verificar si la hora está dentro de algún horario
    for (const horario of horarios) {
      const horaApertura = normalizarHora(horario.hora_apertura);
      const horaCierre = normalizarHora(horario.hora_cierre);
      
      if (!horaApertura || !horaCierre) {
        continue; // Saltar si no se puede normalizar
      }
      
      const [aperturaH, aperturaM] = horaApertura.split(':').map(Number);
      const [cierreH, cierreM] = horaCierre.split(':').map(Number);
      
      if (isNaN(aperturaH) || isNaN(aperturaM) || isNaN(cierreH) || isNaN(cierreM)) {
        continue; // Saltar si hay error al parsear
      }
      
      const aperturaMinutos = aperturaH * 60 + aperturaM;
      const cierreMinutos = cierreH * 60 + cierreM;
      
      // La hora es válida si está dentro del rango [apertura, cierre)
      if (horaMinutos >= aperturaMinutos && horaMinutos < cierreMinutos) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEBUG] ✅ Hora ${horaNormalizada} válida en horario ${horaApertura}-${horaCierre}`);
        }
        return true;
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      console.log(`[DEBUG] ❌ Hora ${horaNormalizada} no válida para ${dias[diaSemana]}`);
      horarios.forEach(h => {
        const apertura = normalizarHora(h.hora_apertura);
        const cierre = normalizarHora(h.hora_cierre);
        console.log(`[DEBUG]   Horario disponible: ${apertura} - ${cierre}`);
      });
    }
    
    return false;
  } catch (error) {
    console.error('[ERROR] Error en isHoraValida:', error);
    throw error;
  }
};

module.exports = HorarioAtencion;


