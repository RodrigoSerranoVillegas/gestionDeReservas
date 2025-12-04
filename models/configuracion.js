const { query } = require('../config/database');

// Obtener configuración (solo debe haber una)
async function getConfig() {
  try {
    const configs = await query(
      'SELECT * FROM configuracion_restaurante ORDER BY id_config LIMIT 1'
    );
    if (configs.length === 0) {
      // Crear configuración por defecto si no existe
      return await createDefaultConfig();
    }
    return configs[0];
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    throw error;
  }
}

// Crear configuración por defecto
async function createDefaultConfig() {
  try {
    const result = await query(
      `INSERT INTO configuracion_restaurante 
       (nombre_restaurante, direccion, telefono, email_notificaciones, 
        duracion_estandar_reserva, intervalo_reservas, tiempo_max_cancelacion_antes, tiempo_max_retraso) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Mi Restaurante', '', '', '', 90, 30, 60, 20]
    );
    return await getConfig();
  } catch (error) {
    console.error('Error al crear configuración por defecto:', error);
    throw error;
  }
}

// Actualizar configuración
async function updateConfig(configData) {
  try {
    const config = await getConfig();
    const updates = [];
    const params = [];

    const campos = [
      'nombre_restaurante', 'direccion', 'telefono', 'email_notificaciones',
      'duracion_estandar_reserva', 'intervalo_reservas', 'max_reservas_por_franja',
      'tiempo_max_cancelacion_antes', 'tiempo_max_retraso'
    ];

    campos.forEach(campo => {
      if (configData[campo] !== undefined) {
        updates.push(`${campo} = ?`);
        params.push(configData[campo]);
      }
    });

    if (updates.length === 0) {
      return config;
    }

    params.push(config.id_config);
    await query(
      `UPDATE configuracion_restaurante SET ${updates.join(', ')} WHERE id_config = ?`,
      params
    );

    return await getConfig();
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    throw error;
  }
}

module.exports = {
  getConfig,
  updateConfig
};

