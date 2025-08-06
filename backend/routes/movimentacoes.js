// backend/routes/movimentacoes.js

const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Todas as rotas aqui são protegidas e exigem um token válido.
router.use(verifyToken);

// GET /api/movimentacoes - Listar todas as vendas
router.get('/', movimentacaoController.listarMovimentacoes);

// POST /api/movimentacoes - Criar uma nova venda
router.post('/', movimentacaoController.criarMovimentacao);

// GET /api/movimentacoes/:id - Obter uma venda específica
router.get('/:id', movimentacaoController.buscarMovimentacaoPorId);

// DELETE /api/movimentacoes/:id - Deletar uma venda
router.delete('/:id', movimentacaoController.deletarMovimentacao);

module.exports = router;
