const { Reserva, Mesa, Cliente, HorarioAtencion, ConfiguracionRestaurante } = require('../models');
const { Op } = require('sequelize');

/**
 * Valida que la fecha de reserva no sea en el pasado
 * Usa UTC para evitar problemas de zona horaria
 */
function validarFechaNoPasado(fecha) {
  // Normalizar la fecha (puede venir como string YYYY-MM-DD o con hora)
  const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  
  // Crear fecha de reserva en UTC (medianoche UTC)
  const fechaReserva = new Date(Date.UTC(anio, mes - 1, dia));
  
  // Crear fecha de hoy en UTC (medianoche UTC)
  const hoy = new Date();
  const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  
  // Comparar fechas en UTC
  if (fechaReserva < hoyUTC) {
    throw new Error('No se pueden crear reservas para fechas pasadas');
  }
  return true;
}

/**
 * Valida que el número de personas sea válido
 */
function validarNumeroPersonas(numeroPersonas) {
  const num = parseInt(numeroPersonas);
  if (isNaN(num) || num <= 0) {
    throw new Error('El número de personas debe ser mayor a 0');
  }
  return num;
}

/**
 * Valida que el número de personas no exceda la capacidad de la mesa asignada
 */
async function validarCapacidadMesa(idMesa, numeroPersonas) {
  if (!idMesa) {
    return true; // Si no hay mesa asignada, no se valida capacidad
  }
  
  const mesa = await Mesa.findByPk(idMesa);
  if (!mesa) {
    throw new Error('Mesa no encontrada');
  }
  
  if (mesa.estado !== 'activa') {
    throw new Error('La mesa seleccionada no está activa');
  }
  
  if (numeroPersonas > mesa.capacidad) {
    throw new Error(`El número de personas (${numeroPersonas}) excede la capacidad de la mesa (${mesa.capacidad})`);
  }
  
  return true;
}

/**
 * Valida que no haya reservas duplicadas del mismo cliente en el mismo horario
 */
async function validarReservaDuplicada(idCliente, fecha, hora, idReservaExcluir = null) {
  const condiciones = {
    id_cliente: idCliente,
    fecha_reserva: fecha,
    hora_inicio: hora,
    estado: {
      [Op.notIn]: ['cancelada', 'no_show', 'completada']
    }
  };
  
  if (idReservaExcluir) {
    condiciones.id_reserva = {
      [Op.ne]: idReservaExcluir
    };
  }
  
  const reservaExistente = await Reserva.findOne({ where: condiciones });
  
  if (reservaExistente) {
    throw new Error('Ya existe una reserva activa para este cliente en el mismo horario');
  }
  
  return true;
}

/**
 * Valida que no haya solapamiento de reservas en la misma mesa
 */
async function validarSolapamientoMesa(idMesa, fecha, horaInicio, duracionMinutos, idReservaExcluir = null) {
  if (!idMesa) {
    return true; // Si no hay mesa asignada, no se valida solapamiento
  }
  
  const config = await ConfiguracionRestaurante.getConfig();
  const duracion = duracionMinutos || config.duracion_estandar_reserva;
  
  // Calcular hora fin
  const [horaH, horaM] = horaInicio.split(':').map(Number);
  const horaInicioMinutos = horaH * 60 + horaM;
  const horaFinMinutos = horaInicioMinutos + duracion;
  const horaFin = `${Math.floor(horaFinMinutos / 60).toString().padStart(2, '0')}:${(horaFinMinutos % 60).toString().padStart(2, '0')}`;
  
  // Obtener todas las reservas activas de esa mesa en esa fecha
  const reservasExistentes = await Reserva.findAll({
    where: {
      id_mesa: idMesa,
      fecha_reserva: fecha,
      estado: {
        [Op.notIn]: ['cancelada', 'no_show', 'completada']
      },
      ...(idReservaExcluir ? { id_reserva: { [Op.ne]: idReservaExcluir } } : {})
    }
  });
  
  // Verificar solapamiento manualmente
  for (const reserva of reservasExistentes) {
    const [rHoraH, rHoraM] = reserva.hora_inicio.split(':').map(Number);
    const rHoraInicioMinutos = rHoraH * 60 + rHoraM;
    
    let rHoraFinMinutos;
    if (reserva.hora_fin) {
      const [rFinH, rFinM] = reserva.hora_fin.split(':').map(Number);
      rHoraFinMinutos = rFinH * 60 + rFinM;
    } else {
      // Si no tiene hora_fin, usar duración estándar
      rHoraFinMinutos = rHoraInicioMinutos + config.duracion_estandar_reserva;
    }
    
    // Verificar si hay solapamiento
    // Solapamiento ocurre si: (inicio1 < fin2) && (fin1 > inicio2)
    if (horaInicioMinutos < rHoraFinMinutos && horaFinMinutos > rHoraInicioMinutos) {
      throw new Error('La mesa ya tiene una reserva en ese horario');
    }
  }
  
  return true;
}

/**
 * Valida que la hora esté dentro del horario de atención
 */
async function validarHorarioAtencion(fecha, hora) {
  try {
    // Normalizar la hora (puede venir en diferentes formatos)
    let horaNormalizada = hora;
    if (typeof hora === 'string') {
      // Si viene con "p. m." o "a. m.", convertir a formato 24 horas
      if (hora.toLowerCase().includes('p. m.') || hora.toLowerCase().includes('pm')) {
        const match = hora.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          let horas = parseInt(match[1]);
          const minutos = match[2];
          if (horas !== 12) horas += 12;
          horaNormalizada = `${horas.toString().padStart(2, '0')}:${minutos}`;
        }
      } else if (hora.toLowerCase().includes('a. m.') || hora.toLowerCase().includes('am')) {
        const match = hora.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          let horas = parseInt(match[1]);
          const minutos = match[2];
          if (horas === 12) horas = 0;
          horaNormalizada = `${horas.toString().padStart(2, '0')}:${minutos}`;
        }
      }
      // Remover espacios y normalizar
      horaNormalizada = horaNormalizada.trim();
      if (horaNormalizada.length > 5) {
        horaNormalizada = horaNormalizada.substring(0, 5);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG validarHorarioAtencion] Fecha: ${fecha}, Hora original: ${hora}, Hora normalizada: ${horaNormalizada}`);
    }
    
    const horaValida = await HorarioAtencion.isHoraValida(fecha, horaNormalizada);
    if (!horaValida) {
      // Obtener información adicional para el mensaje de error usando UTC
      const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const [anio, mes, dia] = fechaStr.split('-').map(Number);
      const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
      const diaSemana = fechaObj.getUTCDay();
      const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana];
      
      const horarios = await HorarioAtencion.findAll({
        where: {
          dia_semana: diaSemana,
          activo: true
        },
        order: [['hora_apertura', 'ASC']]
      });
      
      if (horarios.length === 0) {
        throw new Error(`No hay horario de atención configurado para ${nombreDia}`);
      }
      
      const horariosStr = horarios.map(h => {
        let apertura = h.hora_apertura;
        let cierre = h.hora_cierre;
        if (typeof apertura === 'string' && apertura.length > 5) apertura = apertura.substring(0, 5);
        if (typeof cierre === 'string' && cierre.length > 5) cierre = cierre.substring(0, 5);
        return `${apertura} - ${cierre}`;
      }).join(', ');
      
      throw new Error(`La hora ${horaNormalizada} no está dentro del horario de atención de ${nombreDia}. Horarios disponibles: ${horariosStr}`);
    }
    return true;
  } catch (error) {
    // Si el error ya tiene un mensaje personalizado, lanzarlo tal cual
    if (error.message && !error.message.includes('query is not a function')) {
      throw error;
    }
    throw new Error('Error al validar el horario de atención: ' + error.message);
  }
}

/**
 * Valida que no se editen reservas de fechas pasadas (excepto admin)
 * Usa UTC para evitar problemas de zona horaria
 */
function validarEdicionFechaPasada(fechaReserva, rolUsuario) {
  // Normalizar la fecha (puede venir como string YYYY-MM-DD o con hora)
  const fechaStr = fechaReserva.includes('T') ? fechaReserva.split('T')[0] : fechaReserva;
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  
  // Crear fecha de reserva en UTC (medianoche UTC)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  
  // Crear fecha de hoy en UTC (medianoche UTC)
  const hoy = new Date();
  const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  
  // Comparar fechas en UTC
  if (fecha < hoyUTC && rolUsuario !== 'admin') {
    throw new Error('No se pueden editar reservas de fechas pasadas');
  }
  
  return true;
}

/**
 * Valida capacidad total disponible para un horario
 */
async function validarCapacidadTotal(fecha, horaInicio, numeroPersonas, duracionMinutos) {
  const config = await ConfiguracionRestaurante.getConfig();
  const duracion = duracionMinutos || config.duracion_estandar_reserva;
  
  // Normalizar la hora de inicio
  let horaNormalizada = horaInicio;
  if (typeof horaInicio === 'string' && horaInicio.length > 5) {
    horaNormalizada = horaInicio.substring(0, 5);
  }
  
  // Calcular hora fin
  const [horaH, horaM] = horaNormalizada.split(':').map(Number);
  if (isNaN(horaH) || isNaN(horaM)) {
    throw new Error(`Formato de hora inválido: ${horaInicio}`);
  }
  const horaInicioMinutos = horaH * 60 + horaM;
  const horaFinMinutos = horaInicioMinutos + duracion;
  
  // Obtener capacidad total de mesas activas
  const capacidadTotal = await Mesa.sum('capacidad', {
    where: { estado: 'activa' }
  }) || 0;
  
  // Si no hay mesas activas, no se puede validar capacidad
  if (capacidadTotal === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG validarCapacidadTotal] No hay mesas activas, no se valida capacidad');
    }
    return true; // Permitir la reserva si no hay mesas configuradas
  }
  
  // Obtener todas las reservas activas en ese horario
  const reservasExistentes = await Reserva.findAll({
    where: {
      fecha_reserva: fecha,
      estado: {
        [Op.notIn]: ['cancelada', 'no_show', 'completada']
      }
    }
  });
  
  // Calcular personas ya reservadas que se solapan con este horario
  let personasReservadas = 0;
  for (const reserva of reservasExistentes) {
    // Normalizar hora de inicio de la reserva existente
    let rHoraInicio = reserva.hora_inicio;
    if (typeof rHoraInicio === 'string' && rHoraInicio.length > 5) {
      rHoraInicio = rHoraInicio.substring(0, 5);
    }
    
    const [rHoraH, rHoraM] = rHoraInicio.split(':').map(Number);
    if (isNaN(rHoraH) || isNaN(rHoraM)) {
      continue; // Saltar si no se puede parsear
    }
    const rHoraInicioMinutos = rHoraH * 60 + rHoraM;
    
    let rHoraFinMinutos;
    if (reserva.hora_fin) {
      let rHoraFin = reserva.hora_fin;
      if (typeof rHoraFin === 'string' && rHoraFin.length > 5) {
        rHoraFin = rHoraFin.substring(0, 5);
      }
      const [rFinH, rFinM] = rHoraFin.split(':').map(Number);
      if (!isNaN(rFinH) && !isNaN(rFinM)) {
        rHoraFinMinutos = rFinH * 60 + rFinM;
      } else {
        rHoraFinMinutos = rHoraInicioMinutos + config.duracion_estandar_reserva;
      }
    } else {
      rHoraFinMinutos = rHoraInicioMinutos + config.duracion_estandar_reserva;
    }
    
    // Si hay solapamiento, sumar las personas
    if (horaInicioMinutos < rHoraFinMinutos && horaFinMinutos > rHoraInicioMinutos) {
      personasReservadas += reserva.numero_personas || 0;
    }
  }
  
  // Validar que no se exceda la capacidad
  const capacidadNecesaria = personasReservadas + numeroPersonas;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG validarCapacidadTotal] Fecha: ${fecha}, Hora: ${horaNormalizada}, Personas: ${numeroPersonas}`);
    console.log(`[DEBUG validarCapacidadTotal] Capacidad total: ${capacidadTotal}, Ya reservado: ${personasReservadas}, Necesario: ${numeroPersonas}, Total necesario: ${capacidadNecesaria}`);
  }
  
  if (capacidadNecesaria > capacidadTotal) {
    throw new Error(`No hay suficiente capacidad disponible. Capacidad total: ${capacidadTotal}, ya reservado: ${personasReservadas}, necesario: ${numeroPersonas}`);
  }
  
  return true;
}

/**
 * Valida todas las reglas para crear una reserva
 */
async function validarCrearReserva(data, idReservaExcluir = null) {
  const { fecha_reserva, hora_inicio, numero_personas, id_mesa, id_cliente } = data;
  
  // 1. Validar fecha no en pasado
  validarFechaNoPasado(fecha_reserva);
  
  // 2. Validar número de personas
  const numPersonas = validarNumeroPersonas(numero_personas);
  
  // 3. Validar horario de atención
  await validarHorarioAtencion(fecha_reserva, hora_inicio);
  
  // 4. Validar capacidad de mesa si está asignada
  if (id_mesa) {
    await validarCapacidadMesa(id_mesa, numPersonas);
  }
  
  // 5. Validar reserva duplicada del mismo cliente (solo si se proporciona id_cliente)
  if (id_cliente) {
    await validarReservaDuplicada(id_cliente, fecha_reserva, hora_inicio, idReservaExcluir);
  }
  
  // 6. Validar solapamiento de mesa si está asignada
  if (id_mesa) {
    await validarSolapamientoMesa(id_mesa, fecha_reserva, hora_inicio, null, idReservaExcluir);
  }
  
  // 7. Validar capacidad total (opcional, si no hay mesa asignada)
  if (!id_mesa) {
    await validarCapacidadTotal(fecha_reserva, hora_inicio, numPersonas);
  }
  
  return true;
}

/**
 * Valida todas las reglas para actualizar una reserva
 */
async function validarActualizarReserva(idReserva, data, rolUsuario) {
  const reservaActual = await Reserva.findByPk(idReserva);
  if (!reservaActual) {
    throw new Error('Reserva no encontrada');
  }
  
  // Validar que no se editen reservas de fechas pasadas (excepto admin)
  if (data.fecha_reserva) {
    validarEdicionFechaPasada(data.fecha_reserva, rolUsuario);
  } else {
    validarEdicionFechaPasada(reservaActual.fecha_reserva, rolUsuario);
  }
  
  // Combinar datos actuales con nuevos
  const datosCompletos = {
    fecha_reserva: data.fecha_reserva || reservaActual.fecha_reserva,
    hora_inicio: data.hora_inicio || reservaActual.hora_inicio,
    numero_personas: data.numero_personas || reservaActual.numero_personas,
    id_mesa: data.id_mesa !== undefined ? data.id_mesa : reservaActual.id_mesa,
    id_cliente: reservaActual.id_cliente
  };
  
  // Aplicar todas las validaciones
  await validarCrearReserva(datosCompletos, idReserva);
  
  return true;
}

module.exports = {
  validarFechaNoPasado,
  validarNumeroPersonas,
  validarCapacidadMesa,
  validarReservaDuplicada,
  validarSolapamientoMesa,
  validarHorarioAtencion,
  validarEdicionFechaPasada,
  validarCapacidadTotal,
  validarCrearReserva,
  validarActualizarReserva
};
