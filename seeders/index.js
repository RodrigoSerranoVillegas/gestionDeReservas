const { Usuario, ConfiguracionRestaurante, HorarioAtencion } = require('../models');
const { sequelize } = require('../config/database');

async function ejecutarSeeders() {
  try {
    console.log('Iniciando seeders...\n');

    await sequelize.authenticate();

    await seedUsuarioAdmin();
    await seedConfiguracion();
    await seedHorarios();

    console.log('\nSeeders ejecutados correctamente');
    return true;
  } catch (error) {
    console.error('\nError al ejecutar seeders:', error.message);
    throw error;
  }
}

async function seedUsuarioAdmin() {
  try {
    const adminEmail = 'admin@restaurante.com';
    
    const adminExistente = await Usuario.findOne({
      where: { email: adminEmail }
    });

    if (adminExistente) {
      console.log('Usuario admin ya existe');
      return;
    }

    const admin = await Usuario.create({
      nombre: 'Administrador',
      email: adminEmail,
      contraseña: 'admin123',
      rol: 'admin',
      estado: 'activo'
    });

    console.log('Usuario admin creado');
    console.log(`Email: ${admin.email}`);
    console.log(`Contraseña: admin123`);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Usuario admin ya existe');
    } else {
      throw error;
    }
  }
}

async function seedConfiguracion() {
  try {
    const configExistente = await ConfiguracionRestaurante.findOne();

    if (configExistente) {
      console.log('Configuracion del restaurante ya existe');
      return;
    }

    await ConfiguracionRestaurante.create({
      nombre_restaurante: 'Mi Restaurante',
      direccion: 'Calle Principal 123',
      telefono: '3001234567',
      email_notificaciones: 'reservas@restaurante.com',
      duracion_estandar_reserva: 90,
      intervalo_reservas: 30,
      tiempo_max_cancelacion_antes: 60,
      tiempo_max_retraso: 20
    });

    console.log('Configuracion del restaurante creada');
  } catch (error) {
    throw error;
  }
}

async function seedHorarios() {
  try {
    const horariosExistentes = await HorarioAtencion.count();

    if (horariosExistentes > 0) {
      console.log('Horarios de atencion ya existen');
      return;
    }

    const horarios = [
      { dia_semana: 2, hora_apertura: '12:00:00', hora_cierre: '15:00:00', activo: true },
      { dia_semana: 2, hora_apertura: '18:00:00', hora_cierre: '22:00:00', activo: true },
      { dia_semana: 3, hora_apertura: '12:00:00', hora_cierre: '15:00:00', activo: true },
      { dia_semana: 3, hora_apertura: '18:00:00', hora_cierre: '22:00:00', activo: true },
      { dia_semana: 4, hora_apertura: '12:00:00', hora_cierre: '15:00:00', activo: true },
      { dia_semana: 4, hora_apertura: '18:00:00', hora_cierre: '22:00:00', activo: true },
      { dia_semana: 5, hora_apertura: '12:00:00', hora_cierre: '15:00:00', activo: true },
      { dia_semana: 5, hora_apertura: '18:00:00', hora_cierre: '22:00:00', activo: true },
      { dia_semana: 6, hora_apertura: '12:00:00', hora_cierre: '15:00:00', activo: true },
      { dia_semana: 6, hora_apertura: '18:00:00', hora_cierre: '22:00:00', activo: true },
      { dia_semana: 0, hora_apertura: '12:00:00', hora_cierre: '15:00:00', activo: true },
      { dia_semana: 0, hora_apertura: '18:00:00', hora_cierre: '22:00:00', activo: true }
    ];

    await HorarioAtencion.bulkCreate(horarios);
    console.log(`${horarios.length} horarios de atencion creados`);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  ejecutarSeeders,
  seedUsuarioAdmin,
  seedConfiguracion,
  seedHorarios
};

