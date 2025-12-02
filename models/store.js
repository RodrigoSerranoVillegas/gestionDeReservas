const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { usuarios: [], mesas: [], clientes: [], reservas: [] };
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getCollection(name) {
  const db = readDB();
  return db[name] || [];
}

function setCollection(name, items) {
  const db = readDB();
  db[name] = items;
  writeDB(db);
}

module.exports = { readDB, writeDB, getCollection, setCollection };
