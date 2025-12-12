/**
 * Script para crear la base de datos si no existe
 * Ejecuta: node scripts/crear-base-datos.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function crearBaseDatos() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Permite ejecutar múltiples comandos SQL
  };

  const dbName = process.env.DB_NAME || 'gestionDeReservas';

  console.log('🔧 Creando base de datos...\n');
  console.log('📋 Configuración:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Puerto: ${config.port}`);
  console.log(`   Usuario: ${config.user}`);
  console.log(`   Base de datos: ${dbName}\n`);

  try {
    // Conectar sin especificar base de datos
    console.log('1️⃣ Conectando a MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('   ✅ Conexión exitosa\n');

    // Verificar si la base de datos existe
    console.log(`2️⃣ Verificando si la base de datos "${dbName}" existe...`);
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => 
      db.Database.toLowerCase() === dbName.toLowerCase()
    );

    if (dbExists) {
      console.log(`   ✅ La base de datos "${dbName}" ya existe\n`);
      console.log('💡 Si necesitas recrearla, elimínala primero desde phpMyAdmin\n');
      await connection.end();
      return;
    }

    // Crear la base de datos
    console.log(`3️⃣ Creando la base de datos "${dbName}"...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`   ✅ Base de datos "${dbName}" creada exitosamente\n`);

    await connection.end();

    // Verificar si existe el archivo SQL
    const sqlFile = path.join(__dirname, '..', 'gestionDeReservas.sql');
    if (fs.existsSync(sqlFile)) {
      console.log('4️⃣ Archivo SQL encontrado: gestionDeReservas.sql');
      console.log('   💡 Importa este archivo desde phpMyAdmin para crear las tablas:');
      console.log('      - Abre phpMyAdmin');
      console.log(`      - Selecciona la base de datos "${dbName}"`);
      console.log('      - Ve a la pestaña "Importar"');
      console.log('      - Selecciona el archivo gestionDeReservas.sql');
      console.log('      - Haz clic en "Continuar"\n');
    } else {
      console.log('4️⃣ Archivo gestionDeReservas.sql no encontrado');
      console.log('   ⚠️  Necesitas crear las tablas manualmente o importar el SQL\n');
    }

    console.log('✅ ¡Base de datos creada exitosamente!');
    console.log('   Ahora puedes ejecutar: npm run dev\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(`   Código: ${error.code}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('🔍 MySQL no está corriendo');
      console.log('   💡 Inicia MySQL desde XAMPP, WAMP o el servicio de Windows\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔍 Credenciales incorrectas');
      console.log('   💡 Verifica el usuario y contraseña en tu archivo .env\n');
    } else {
      console.log('🔍 Error desconocido');
      console.log('   💡 Revisa los detalles del error arriba\n');
    }
  }
}

crearBaseDatos();
