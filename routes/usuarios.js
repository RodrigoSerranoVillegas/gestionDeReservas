const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuarioController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol admin
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', usuarioCtrl.list);
router.get('/nuevo', usuarioCtrl.showCreate);
router.post('/', usuarioCtrl.create);
router.get('/:id/editar', usuarioCtrl.showEdit);
router.post('/:id', usuarioCtrl.update);
router.post('/:id/eliminar', usuarioCtrl.delete);

module.exports = router;

