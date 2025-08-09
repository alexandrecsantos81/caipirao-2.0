const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    createUtilizador,
    solicitarAcesso,
    ativarUtilizador,
    getUtilizadores,
    updateUtilizador, // <-- Importar
    deleteUtilizador, // <-- Importar
} = require('../controllers/utilizadorController');

// --- ROTAS PÚBLICAS ---
// Rota para um novo colaborador solicitar acesso
router.post('/solicitar-acesso', solicitarAcesso);


// --- ROTAS PROTEGIDAS (ADMIN) ---
// As rotas abaixo exigem que o utilizador seja um admin logado
router.use(verifyToken, checkAdmin); // Aplica a proteção para todas as rotas abaixo

// Rota para /api/utilizadores
router.route('/')
    .get(getUtilizadores)
    .post(createUtilizador);

// Rota para ativar um utilizador pendente
router.put('/:id/ativar', ativarUtilizador);

// Novas rotas para editar e deletar um utilizador específico
router.route('/:id')
    .put(updateUtilizador)
    .delete(deleteUtilizador);

module.exports = router;
