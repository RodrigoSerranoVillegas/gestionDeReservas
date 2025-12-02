const express = require('express');
const router = express.Router();
const reservaCtrl = require('../controllers/reservaController');

// Formulario público para que el cliente haga una reserva
router.get('/reservar', reservaCtrl.showForm);
router.post('/reservar', reservaCtrl.create);

// Página de inicio que muestra reservas (recepcionista/admin las pueden ver aquí)
router.get('/inicio', reservaCtrl.list);

module.exports = router;
