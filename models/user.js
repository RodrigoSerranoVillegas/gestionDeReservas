const { getCollection, setCollection } = require('./store');

function generateId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

function findByEmail(email) {
  const usuarios = getCollection('usuarios');
  return usuarios.find(u => u.email === email) || null;
}

function findById(id) {
  const usuarios = getCollection('usuarios');
  return usuarios.find(u => u.id === id) || null;
}

function createUser({ nombre, email, password, rol = 'recepcionista' }) {
  const usuarios = getCollection('usuarios');
  const newUser = {
    id: generateId(),
    nombre,
    email,
    password,
    rol,
    estado: 'activo',
    creadoEn: new Date().toISOString()
  };
  usuarios.push(newUser);
  setCollection('usuarios', usuarios);
  return newUser;
}

module.exports = { findByEmail, findById, createUser };
