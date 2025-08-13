const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const { 
    getKPIs, 
    getVendasPorDia, 
    getDespesasPorCategoria, 
    getRankingProdutos,
    getRankingClientes // <-- IMPORTAR NOVA FUNÇÃO
} = require('../controllers/dashboardController');

// Todas as rotas do dashboard são protegidas e exigem login de Admin.
router.use(verifyToken, checkAdmin);

router.get('/kpis', getKPIs);
router.get('/vendas-por-dia', getVendasPorDia);
router.get('/despesas-por-categoria', getDespesasPorCategoria);
router.get('/ranking-produtos', getRankingProdutos);

/**
 * @route   GET /api/dashboard/ranking-clientes
 * @desc    Retorna o ranking dos 5 clientes que mais compraram no mês.
 * @access  Admin
 */
router.get('/ranking-clientes', getRankingClientes); // <-- NOVA ROTA

module.exports = router;
