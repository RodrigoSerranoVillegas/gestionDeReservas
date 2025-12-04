const express = require('express');
const router = express.Router();
const reservaCtrl = require('../controllers/reservaController');
const { requireAuth } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// Rutas públicas
router.get('/reservar', reservaCtrl.showForm);
router.post('/reservar', reservaCtrl.create);
router.get('/inicio', reservaCtrl.list);

// Rutas protegidas
router.get('/dashboard', requireAuth, reservaCtrl.dashboard);
router.get('/reservas', requireAuth, reservaCtrl.listAll);
router.get('/reservas/:id', requireAuth, reservaCtrl.show);
router.get('/reservas/:id/editar', requireAuth, reservaCtrl.showEdit);
router.post('/reservas/:id', requireAuth, reservaCtrl.update);
router.post('/reservas/:id/cancelar', requireAuth, reservaCtrl.cancel);
router.post('/reservas/:id/no-show', requireAuth, reservaCtrl.noShow);

module.exports = router;
