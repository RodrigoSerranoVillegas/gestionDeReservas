const { getCollection, setCollection } = require('./store');

function generateId() {
  return `res-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

function findAll() {
  return getCollection('reservas');
}

function createReserva({ nombre, telefono, email, fecha, hora, numero_personas, observaciones }) {
  const reservas = getCollection('reservas');
  const newReserva = {
    id_reserva: generateId(),
    cliente_nombre: nombre,
    telefono: telefono || null,
    email: email || null,
    fecha_reserva: fecha,
    hora_inicio: hora,
    hora_fin: null,
    numero_personas: Number(numero_personas) || 1,
    estado: 'pendiente',
    canal: 'web',
    observaciones: observaciones || '',
    id_mesa: null,
    creado_por: 'cliente',
    creadoEn: new Date().toISOString()
  };
  reservas.push(newReserva);
  setCollection('reservas', reservas);
  return newReserva;
}

module.exports = { findAll, createReserva };
