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
    
    // Probar con una fecha de viernes
    console.log('\n🧪 Probando validación para viernes:\n');
    const fechaViernes = '2024-12-13'; // Ajusta esta fecha a un viernes
    const fechaObj = new Date(fechaViernes + 'T00:00:00');
    const diaSemana = fechaObj.getDay();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    console.log(`  Fecha: ${fechaViernes}`);
    console.log(`  Día de la semana: ${diaSemana} (${dias[diaSemana]})`);
    
    // Probar varias horas
    const horasPrueba = ['08:00', '10:00', '12:00', '15:00', '18:00', '20:00', '21:00'];
    console.log('\n  Probando horas:');
    for (const hora of horasPrueba) {
      const valida = await HorarioAtencion.isHoraValida(fechaViernes, hora);
      console.log(`    ${hora}: ${valida ? '✅ Válida' : '❌ No válida'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testHorario();
