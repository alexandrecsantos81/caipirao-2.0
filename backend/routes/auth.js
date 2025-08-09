// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');

// A rota de registro foi movida para /api/utilizadores/solicitar-acesso (público)
// e /api/utilizadores (admin), então pode ser removida daqui.

// Rota de Login
router.post('/login', loginUser);

module.exports = router;
