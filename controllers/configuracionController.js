const { ConfiguracionRestaurante } = require('../models');

// Mostrar configuración
exports.show = async (req, res) => {
  try {
    const config = await ConfiguracionRestaurante.getConfig();
    // Convertir a objeto plano para la vista
    const configData = config.toJSON ? config.toJSON() : config;
    res.render('configuracion/form', { config: configData, error: null, success: null });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.render('configuracion/form', { config: null, error: 'Error al cargar la configuración: ' + error.message, success: null });
  }
};

// Actualizar configuración
exports.update = async (req, res) => {
  const {
    nombre_restaurante,
    direccion,
    telefono,
    email_notificaciones,
    duracion_estandar_reserva,
    intervalo_reservas,
    max_reservas_por_franja,
    tiempo_max_cancelacion_antes,
    tiempo_max_retraso
  } = req.body;

  try {
    // Obtener o crear configuración
    let config = await ConfiguracionRestaurante.findOne();
    if (!config) {
      config = await ConfiguracionRestaurante.create({
        nombre_restaurante: 'Mi Restaurante',
        direccion: '',
        telefono: '',
        email_notificaciones: '',
        duracion_estandar_reserva: 90,
        intervalo_reservas: 30,
        tiempo_max_cancelacion_antes: 60,
        tiempo_max_retraso: 20
      });
    }

    if (!nombre_restaurante) {
      const configData = config.toJSON ? config.toJSON() : config;
      return res.render('configuracion/form', {
        config: { ...configData, ...req.body },
        error: 'El nombre del restaurante es requerido',
        success: null
      });
    }

    // Actualizar configuración
    await config.update({
      nombre_restaurante,
      direccion: direccion || null,
      telefono: telefono || null,
      email_notificaciones: email_notificaciones || null,
      duracion_estandar_reserva: duracion_estandar_reserva ? parseInt(duracion_estandar_reserva) : config.duracion_estandar_reserva,
      intervalo_reservas: intervalo_reservas ? parseInt(intervalo_reservas) : config.intervalo_reservas,
      max_reservas_por_franja: max_reservas_por_franja ? parseInt(max_reservas_por_franja) : null,
      tiempo_max_cancelacion_antes: tiempo_max_cancelacion_antes ? parseInt(tiempo_max_cancelacion_antes) : config.tiempo_max_cancelacion_antes,
      tiempo_max_retraso: tiempo_max_retraso ? parseInt(tiempo_max_retraso) : config.tiempo_max_retraso
    });

    // Recargar configuración actualizada
    await config.reload();
    const configData = config.toJSON ? config.toJSON() : config;
    res.render('configuracion/form', { config: configData, error: null, success: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    try {
      const config = await ConfiguracionRestaurante.getConfig();
      const configData = config.toJSON ? config.toJSON() : config;
      res.render('configuracion/form', {
        config: { ...configData, ...req.body },
        error: 'Error al actualizar la configuración: ' + error.message,
        success: null
      });
    } catch (err) {
      res.render('configuracion/form', {
        config: req.body,
        error: 'Error al actualizar la configuración: ' + error.message,
        success: null
      });
    }
  }
};

