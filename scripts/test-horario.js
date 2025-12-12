/**
 * Script para probar la validación de horarios
 * Ejecuta: node scripts/test-horario.js
 */

require('dotenv').config();
const { HorarioAtencion } = require('../models');

async function testHorario() {
  try {
    console.log('🔍 Probando validación de horarios...\n');
    
    // Obtener todos los horarios
    const horarios = await HorarioAtencion.findAll({
      order: [['dia_semana', 'ASC'], ['hora_apertura', 'ASC']]
    });
    
    console.log(`📋 Horarios encontrados: ${horarios.length}\n`);
    
    horarios.forEach(horario => {
      const h = horario.toJSON ? horario.toJSON() : horario;
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      console.log(`  - ${dias[h.dia_semana]}: ${h.hora_apertura} - ${h.hora_cierre} (activo: ${h.activo})`);
    });
    
    // Probar con la fecha del usuario (19/12/2025 - viernes)
    console.log('\n🧪 Probando validación para 19/12/2025 (viernes):\n');
    const fechaViernes = '2025-12-19';
    const fechaStr = fechaViernes.includes('T') ? fechaViernes.split('T')[0] : fechaViernes;
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));
    const diaSemana = fechaObj.getUTCDay();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    console.log(`  Fecha: ${fechaViernes}`);
    console.log(`  Día de la semana: ${diaSemana} (${dias[diaSemana]})`);
    
    // Probar varias horas incluyendo la del usuario (17:29)
    const horasPrueba = ['08:00', '10:00', '12:00', '15:00', '17:29', '18:00', '19:00', '20:00', '21:00'];
    console.log('\n  Probando horas:');
    for (const hora of horasPrueba) {
      const valida = await HorarioAtencion.isHoraValida(fechaViernes, hora);
      console.log(`    ${hora}: ${valida ? '✅ Válida' : '❌ No válida'}`);
    }
    
    // Probar también con formato de 12 horas
    console.log('\n  Probando con formato 12 horas:');
    const horas12h = ['05:29 p. m.', '05:29 pm', '17:29'];
    for (const hora of horas12h) {
      const valida = await HorarioAtencion.isHoraValida(fechaViernes, hora);
      console.log(`    "${hora}": ${valida ? '✅ Válida' : '❌ No válida'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testHorario();
