const { getConfig, updateConfig } = require('../models/configuracion');

// Mostrar configuración
exports.show = async (req, res) => {
  try {
    const config = await getConfig();
    res.render('configuracion/form', { config, error: null, success: null });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.render('configuracion/form', { config: null, error: 'Error al cargar la configuración', success: null });
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

  if (!nombre_restaurante) {
    const config = await getConfig();
    return res.render('configuracion/form', {
      config: { ...config, ...req.body },
      error: 'El nombre del restaurante es requerido',
      success: null
    });
  }

  try {
    await updateConfig({
      nombre_restaurante,
      direccion: direccion || null,
      telefono: telefono || null,
      email_notificaciones: email_notificaciones || null,
      duracion_estandar_reserva: duracion_estandar_reserva ? parseInt(duracion_estandar_reserva) : undefined,
      intervalo_reservas: intervalo_reservas ? parseInt(intervalo_reservas) : undefined,
      max_reservas_por_franja: max_reservas_por_franja ? parseInt(max_reservas_por_franja) : null,
      tiempo_max_cancelacion_antes: tiempo_max_cancelacion_antes ? parseInt(tiempo_max_cancelacion_antes) : undefined,
      tiempo_max_retraso: tiempo_max_retraso ? parseInt(tiempo_max_retraso) : undefined
    });
    const config = await getConfig();
    res.render('configuracion/form', { config, error: null, success: 'Configuración actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    const config = await getConfig();
    res.render('configuracion/form', {
      config: { ...config, ...req.body },
      error: 'Error al actualizar la configuración',
      success: null
    });
  }
};

