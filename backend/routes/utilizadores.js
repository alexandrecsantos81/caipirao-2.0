const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    createUtilizadorByAdmin, // <-- Alterado de createUtilizador para a nova função
    solicitarAcesso,
    ativarUtilizador,
    getUtilizadores,
    updateUtilizador,
    deleteUtilizador,
} = require('../controllers/utilizadorController');

// --- ROTA PÚBLICA ---
router.post('/solicitar-acesso', solicitarAcesso);

// --- ROTAS PROTEGIDAS (ADMIN) ---
router.use(verifyToken, checkAdmin);

// Listar todos os utilizadores e Criar um novo utilizador
router.route('/')
    .get(getUtilizadores)
    .post(createUtilizadorByAdmin); // <-- Rota POST agora usa a função de criação pelo admin

// Ativar um utilizador pendente
router.put('/:id/ativar', ativarUtilizador);

// Editar e deletar um utilizador específico
router.route('/:id')
    .put(updateUtilizador)
    .delete(deleteUtilizador);

module.exports = router;
