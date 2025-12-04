// Script para generar el hash de la contraseña del administrador
const bcrypt = require('bcrypt');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Contraseña:', password);
console.log('Hash generado:', hash);
console.log('\nCopia este hash y actualiza la tabla usuarios en la base de datos:');
console.log(`UPDATE usuarios SET contraseña = '${hash}' WHERE email = 'admin@restaurante.com';`);

