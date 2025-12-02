const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

router.get('/login', auth.showLogin);
router.get('/registro', auth.showRegister);
router.post('/login', auth.login);
router.post('/registro', auth.register);

module.exports = router;
