const express = require('express');
const router = express.Router();
const configCtrl = require('../controllers/configuracionController');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Solo admin puede acceder
router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', configCtrl.show);
router.post('/', configCtrl.update);

module.exports = router;

