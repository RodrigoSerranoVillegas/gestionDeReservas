const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || 'gestionDeReservas',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    dialectOptions: {
      connectTimeout: 10000, // 10 segundos de timeout
    }
  }
);

// Función para probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    
    // Mensajes de ayuda según el tipo de error
    if (error.original) {
      const errorCode = error.original.code || error.original.errno;
      
      if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNREFUSED' || errorCode === 'ECONNREFUSED') {
        console.error('\n🔍 Posibles causas:');
        console.error('   1. MySQL no está corriendo');
        console.error('   2. El host o puerto son incorrectos');
        console.error('   3. Las credenciales en .env son incorrectas');
        console.error('\n💡 Soluciones para Windows:');
        console.error('   📌 Si usas XAMPP:');
        console.error('      - Abre el Panel de Control de XAMPP');
        console.error('      - Haz clic en "Start" junto a MySQL');
        console.error('      - Espera a que el estado cambie a "Running" (verde)');
        console.error('   📌 Si usas WAMP:');
        console.error('      - Verifica que el icono de WAMP esté verde en la bandeja');
        console.error('   📌 Si MySQL es un servicio:');
        console.error('      - Presiona Win + R, escribe: services.msc');
        console.error('      - Busca "MySQL" e inícialo si está detenido');
        console.error('\n📋 Configuración actual:');
        console.error(`   - Host: ${process.env.DB_HOST || 'localhost'}`);
        console.error(`   - Puerto: ${process.env.DB_PORT || 3306}`);
        console.error(`   - Base de datos: ${process.env.DB_NAME || 'gestionDeReservas'}`);
        console.error(`   - Usuario: ${process.env.DB_USER || 'root'}`);
        console.error('\n🧪 Ejecuta este comando para diagnosticar:');
        console.error('   node scripts/verificar-mysql.js');
      } else if (errorCode === 'ER_ACCESS_DENIED_ERROR') {
        console.error('\n🔍 Error de autenticación:');
        console.error('   - Verifica el usuario y contraseña en tu archivo .env');
      } else if (errorCode === 'ER_BAD_DB_ERROR') {
        console.error('\n🔍 La base de datos no existe:');
        console.error(`   - La base de datos "${process.env.DB_NAME || 'gestionDeReservas'}" no existe`);
        console.error('\n💡 Soluciones:');
        console.error('   📌 Opción 1 (Automática):');
        console.error('      Ejecuta: npm run crear-db');
        console.error('      Esto creará la base de datos automáticamente');
        console.error('\n   📌 Opción 2 (Manual):');
        console.error('      1. Abre phpMyAdmin');
        console.error('      2. Crea una nueva base de datos con el nombre: gestionDeReservas');
        console.error('      3. Importa el archivo gestionDeReservas.sql');
        console.error('\n   📌 Opción 3 (Línea de comandos):');
        console.error('      mysql -u root -p -e "CREATE DATABASE gestionDeReservas;"');
      }
    }
    
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection
};
