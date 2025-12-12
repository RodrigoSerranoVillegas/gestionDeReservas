/**
 * Script para probar la creación de reservas
 * Ejecuta: node scripts/test-reserva.js
 */

require('dotenv').config();
const { HorarioAtencion, Mesa, ConfiguracionRestaurante, Reserva } = require('../models');
const { validarCrearReserva } = require('../utils/validaciones');

async function testReserva() {
  try {
    console.log('🔍 Probando creación de reserva...\n');
    
    // 1. Verificar horarios
    console.log('1️⃣ Verificando horarios...');
    const fecha = '2025-12-19'; // Viernes
    const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
    const diaSemana = fechaObj.getUTCDay();
    
    const horarios = await HorarioAtencion.findAll({
      where: {
        dia_semana: diaSemana,
        activo: true
      }
    });
    console.log(`   Horarios encontrados: ${horarios.length}`);
    horarios.forEach(h => {
      const apertura = typeof h.hora_apertura === 'string' && h.hora_apertura.length > 5 
        ? h.hora_apertura.substring(0, 5) 
        : h.hora_apertura;
      const cierre = typeof h.hora_cierre === 'string' && h.hora_cierre.length > 5 
        ? h.hora_cierre.substring(0, 5) 
        : h.hora_cierre;
      console.log(`   - ${apertura} - ${cierre}`);
    });
    
    // 2. Verificar mesas
    console.log('\n2️⃣ Verificando mesas...');
    const mesas = await Mesa.findAll({
      where: { estado: 'activa' }
    });
    console.log(`   Mesas activas: ${mesas.length}`);
    const capacidadTotal = await Mesa.sum('capacidad', {
      where: { estado: 'activa' }
    }) || 0;
    console.log(`   Capacidad total: ${capacidadTotal}`);
    
    // 3. Verificar configuración
    console.log('\n3️⃣ Verificando configuración...');
    const config = await ConfiguracionRestaurante.getConfig();
    console.log(`   Duración estándar: ${config.duracion_estandar_reserva} minutos`);
    console.log(`   Intervalo reservas: ${config.intervalo_reservas} minutos`);
    
    // 4. Verificar reservas existentes
    console.log('\n4️⃣ Verificando reservas existentes...');
    const reservasExistentes = await Reserva.findAll({
      where: {
        fecha_reserva: fecha,
        estado: {
          [require('sequelize').Op.notIn]: ['cancelada', 'no_show', 'completada']
        }
      }
    });
    console.log(`   Reservas activas: ${reservasExistentes.length}`);
    let personasReservadas = 0;
    reservasExistentes.forEach(r => {
      personasReservadas += r.numero_personas || 0;
      console.log(`   - ${r.hora_inicio}: ${r.numero_personas} personas`);
    });
    console.log(`   Total personas reservadas: ${personasReservadas}`);
    
    // 5. Probar validación con diferentes escenarios
    console.log('\n5️⃣ Probando validación de reserva...');
    const horaPrueba = '17:29';
    
    // Probar con capacidad disponible
    console.log(`\n   📝 Escenario 1: Reserva para 1 persona (capacidad disponible: ${capacidadTotal})`);
    try {
      await validarCrearReserva({
        fecha_reserva: fecha,
        hora_inicio: horaPrueba,
        numero_personas: 1,
        id_mesa: null,
        id_cliente: null
      });
      console.log(`   ✅ Validación exitosa para ${horaPrueba} con 1 persona`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Probar con capacidad insuficiente
    if (capacidadTotal < 2) {
      console.log(`\n   📝 Escenario 2: Reserva para 2 personas (capacidad total: ${capacidadTotal})`);
      try {
        await validarCrearReserva({
          fecha_reserva: fecha,
          hora_inicio: horaPrueba,
          numero_personas: 2,
          id_mesa: null,
          id_cliente: null
        });
        console.log(`   ✅ Validación exitosa (inesperado)`);
      } catch (error) {
        console.log(`   ❌ Error esperado: ${error.message}`);
        console.log(`   💡 Este error es correcto: no hay suficiente capacidad para 2 personas`);
      }
    } else {
      console.log(`\n   📝 Escenario 2: Reserva para 2 personas (capacidad suficiente: ${capacidadTotal})`);
      try {
        await validarCrearReserva({
          fecha_reserva: fecha,
          hora_inicio: horaPrueba,
          numero_personas: 2,
          id_mesa: null,
          id_cliente: null
        });
        console.log(`   ✅ Validación exitosa para ${horaPrueba} con 2 personas`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Probar horarios alternativos
    console.log(`\n   📝 Escenario 3: Buscar horarios alternativos para 2 personas`);
    // Nota: obtenerHorariosAlternativos es una función interna, así que simulamos su lógica
    const { validarHorarioAtencion, validarCapacidadTotal } = require('../utils/validaciones');
    const config = await ConfiguracionRestaurante.getConfig();
    const intervalo = config.intervalo_reservas || 30;
    const horariosAlt = [];
    
    // Probar algunos horarios del día
    const horasPrueba = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    for (const hora of horasPrueba) {
      try {
        await validarHorarioAtencion(fecha, hora);
        await validarCapacidadTotal(fecha, hora, 2);
        horariosAlt.push(hora);
        if (horariosAlt.length >= 3) break; // Máximo 3 para la prueba
      } catch (error) {
        // Este horario no está disponible
      }
    }
    
    if (horariosAlt.length > 0) {
      console.log(`   ✅ Horarios alternativos encontrados: ${horariosAlt.join(', ')}`);
    } else {
      console.log(`   ⚠️  No se encontraron horarios alternativos`);
      console.log(`   💡 Esto es correcto: no hay suficiente capacidad (${capacidadTotal}) para 2 personas en ningún horario`);
      console.log(`   💡 Solución: Agrega más mesas o aumenta la capacidad de las mesas existentes`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testReserva();
