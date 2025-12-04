const express = require('express');
const router = express.Router();
const horarioCtrl = require('../controllers/horarioController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol admin
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', horarioCtrl.list);
router.get('/nuevo', horarioCtrl.showCreate);
router.post('/', horarioCtrl.create);
router.get('/:id/editar', horarioCtrl.showEdit);
router.post('/:id', horarioCtrl.update);
router.post('/:id/eliminar', horarioCtrl.delete);

module.exports = router;

