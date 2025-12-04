const express = require('express');
const router = express.Router();
const clienteCtrl = require('../controllers/clienteController');
const { requireAuth } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(requireAuth);

router.get('/', clienteCtrl.list);
router.get('/:id', clienteCtrl.show);
router.get('/:id/editar', clienteCtrl.showEdit);
router.post('/:id', clienteCtrl.update);

module.exports = router;

