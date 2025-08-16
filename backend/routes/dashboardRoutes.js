// backend/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getKPIs,
    getVendasPorDia,
    getDespesasPorCategoria,
    getRankingProdutos,
    getRankingClientes,
    getFluxoCaixaDiario,
} = require('../controllers/dashboardController'); // ✅ CORREÇÃO APLICADA AQUI

// Todas as rotas aqui são protegidas e exigem login de Admin
router.use(verifyToken, checkAdmin);

// Rotas existentes
router.get('/kpis', getKPIs);
router.get('/vendas-por-dia', getVendasPorDia);
router.get('/despesas-por-categoria', getDespesasPorCategoria);
router.get('/ranking-produtos', getRankingProdutos);
router.get('/ranking-clientes', getRankingClientes);
router.get('/fluxo-caixa-diario', getFluxoCaixaDiario);

module.exports = router;
