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
    // 1. Importar a nova função do controller
    getDashboardVendedor,
} = require('../controllers/dashboardController');

// 2. Nova rota para o dashboard do vendedor
// Acessível por qualquer usuário logado (apenas `verifyToken`)
router.get('/vendedor/:id', verifyToken, getDashboardVendedor);


// As rotas abaixo continuam restritas apenas para ADMINs
router.use(verifyToken, checkAdmin);

router.get('/kpis', getKPIs);
router.get('/vendas-por-dia', getVendasPorDia);
router.get('/despesas-por-categoria', getDespesasPorCategoria);
router.get('/ranking-produtos', getRankingProdutos);
router.get('/ranking-clientes', getRankingClientes);
router.get('/fluxo-caixa-diario', getFluxoCaixaDiario);

module.exports = router;
