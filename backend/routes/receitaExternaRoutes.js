const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getReceitasExternas,
    createReceitaExterna,
    updateReceitaExterna,
    deleteReceitaExterna,
} = require('../controllers/receitaExternaController');

// Todas as rotas para esta funcionalidade exigem que o usuário seja um admin logado.
router.use(verifyToken, checkAdmin);

// Rota para listar todas as receitas e criar uma nova.
router.route('/')
    .get(getReceitasExternas)
    .post(createReceitaExterna);

// Rota para atualizar e deletar uma receita específica pelo ID.
router.route('/:id')
    .put(updateReceitaExterna)
    .delete(deleteReceitaExterna);

module.exports = router;
