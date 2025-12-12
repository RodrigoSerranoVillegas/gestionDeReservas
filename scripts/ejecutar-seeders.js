require('dotenv').config();
const { ejecutarSeeders } = require('../seeders');
const { sequelize } = require('../config/database');

async function main() {
  try {
    await ejecutarSeeders();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

main();

