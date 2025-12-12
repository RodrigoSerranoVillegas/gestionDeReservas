/**
 * Script para verificar la conexión a MySQL
 * Ejecuta: node scripts/verificar-mysql.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarMySQL() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestionDeReservas'
  };

  console.log('🔍 Verificando conexión a MySQL...\n');
  console.log('📋 Configuración:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Puerto: ${config.port}`);
  console.log(`   Usuario: ${config.user}`);
  console.log(`   Base de datos: ${config.database}`);
  console.log(`   Contraseña: ${config.password ? '***' : '(vacía)'}\n`);

  try {
    // Intentar conectar sin especificar base de datos primero
    console.log('1️⃣ Intentando conectar a MySQL (sin base de datos)...');
    const connection1 = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    console.log('   ✅ Conexión exitosa a MySQL\n');
    await connection1.end();

    // Verificar si la base de datos existe
    console.log('2️⃣ Verificando si la base de datos existe...');
    const connection2 = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    const [databases] = await connection2.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === config.database);
    
    if (dbExists) {
      console.log(`   ✅ La base de datos "${config.database}" existe\n`);
    } else {
      console.log(`   ❌ La base de datos "${config.database}" NO existe\n`);
      console.log('   💡 Solución:');
      console.log('      - Abre phpMyAdmin');
      console.log('      - Importa el archivo gestionDeReservas.sql');
      console.log(`      - O crea la base de datos manualmente: CREATE DATABASE ${config.database};\n`);
    }
    
    await connection2.end();

    // Intentar conectar a la base de datos específica
    if (dbExists) {
      console.log(`3️⃣ Intentando conectar a la base de datos "${config.database}"...`);
      const connection3 = await mysql.createConnection(config);
      console.log(`   ✅ Conexión exitosa a la base de datos "${config.database}"\n`);
      await connection3.end();
      
      console.log('✅ ¡Todo está configurado correctamente!');
      console.log('   Puedes ejecutar: npm run dev\n');
    }

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error(`   Código: ${error.code}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('🔍 Diagnóstico: MySQL no está corriendo o no está escuchando en el puerto', config.port);
      console.log('\n💡 Soluciones para Windows:');
      console.log('   1. Si usas XAMPP:');
      console.log('      - Abre el Panel de Control de XAMPP');
      console.log('      - Haz clic en "Start" junto a MySQL');
      console.log('      - Espera a que el estado cambie a "Running" (verde)\n');
      
      console.log('   2. Si usas WAMP:');
      console.log('      - Haz clic derecho en el icono de WAMP en la bandeja');
      console.log('      - Verifica que MySQL esté marcado como "Running"\n');
      
      console.log('   3. Si MySQL está instalado como servicio:');
      console.log('      - Presiona Win + R');
      console.log('      - Escribe: services.msc');
      console.log('      - Busca "MySQL" en la lista');
      console.log('      - Si está detenido, haz clic derecho → Iniciar\n');
      
      console.log('   4. Verificar que el puerto esté disponible:');
      console.log(`      - Abre PowerShell y ejecuta: netstat -an | findstr ${config.port}`);
      console.log('      - Si no ves nada, MySQL no está corriendo\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔍 Diagnóstico: Credenciales incorrectas');
      console.log('\n💡 Solución:');
      console.log('   - Verifica el usuario y contraseña en tu archivo .env');
      console.log('   - Si MySQL no tiene contraseña, deja DB_PASSWORD= vacío\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('🔍 Diagnóstico: La base de datos no existe');
      console.log('\n💡 Solución:');
      console.log('   - Abre phpMyAdmin');
      console.log('   - Importa el archivo gestionDeReservas.sql');
      console.log(`   - O crea la base de datos: CREATE DATABASE ${config.database};\n`);
    }
  }
}

verificarMySQL();
