const express = require('express');
const router = express.Router();
const mesaCtrl = require('../controllers/mesaController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol admin
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', mesaCtrl.list);
router.get('/nueva', mesaCtrl.showCreate);
router.post('/', mesaCtrl.create);
router.get('/:id/editar', mesaCtrl.showEdit);
router.post('/:id', mesaCtrl.update);
router.post('/:id/eliminar', mesaCtrl.delete);

module.exports = router;

