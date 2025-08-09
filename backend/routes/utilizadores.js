// backend/routes/utilizadores.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    createUtilizador,
    solicitarAcesso,
    ativarUtilizador,
    getUtilizadores,
} = require('../controllers/utilizadorController');

// --- ROTAS PÚBLICAS ---
// Rota para um novo colaborador solicitar acesso
router.post('/solicitar-acesso', solicitarAcesso);

// --- ROTAS PROTEGIDAS (ADMIN) ---
// As rotas abaixo exigem que o utilizador seja um admin logado

// Listar todos os utilizadores
router.get('/', verifyToken, checkAdmin, getUtilizadores);

// Criar um novo utilizador diretamente
router.post('/', verifyToken, checkAdmin, createUtilizador);

// Ativar um utilizador pendente
router.put('/:id/ativar', verifyToken, checkAdmin, ativarUtilizador);

module.exports = router;
