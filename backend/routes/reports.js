// backend/src/routes/reports.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// ATUALIZE A IMPORTAÇÃO PARA INCLUIR A NOVA FUNÇÃO
const { 
    getSalesSummary, 
    getProductRanking,
    getClientRanking,
    getClientAnalysis,
    getSellerProductivity,
    getStockEntriesReport // <-- IMPORTAR A NOVA FUNÇÃO
} = require('../controllers/reportController');

// Aplica o middleware para todas as rotas deste arquivo.
// Apenas admins logados podem acessar os relatórios.
router.use(verifyToken, checkAdmin);

router.get('/sales-summary', getSalesSummary);
router.get('/product-ranking', getProductRanking);
router.get('/client-ranking', getClientRanking);
router.get('/client-analysis', getClientAnalysis);
router.get('/seller-productivity', getSellerProductivity);

/**
 * @route   GET /api/reports/stock-entries
 * @desc    Retorna o histórico de entradas de estoque no período.
 * @access  Admin
 */
router.get('/stock-entries', getStockEntriesReport); // <-- ADICIONE A NOVA ROTA AQUI

module.exports = router;
