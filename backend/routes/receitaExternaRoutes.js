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
// O middleware é aplicado a todas as rotas definidas neste arquivo.
router.use(verifyToken, checkAdmin);

// Rota para listar todas as receitas e criar uma nova.
// GET /api/receitas-externas
// POST /api/receitas-externas
router.route('/')
    .get(getReceitasExternas)
    .post(createReceitaExterna);

// Rota para atualizar e deletar uma receita específica pelo ID.
// PUT /api/receitas-externas/:id
// DELETE /api/receitas-externas/:id
router.route('/:id')
    .put(updateReceitaExterna)
    .delete(deleteReceitaExterna);

module.exports = router;
