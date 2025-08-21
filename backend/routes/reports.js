const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

const { 
    getSalesSummary, 
    getProductRanking,
    getClientRanking,
    getClientAnalysis,
    getSellerProductivity,
    getStockEntriesReport,
    getEmployeeProductivity, // <-- Importando a nova função
    gerarComprovanteVenda,
    getProductRankingPDF,
    getClientRankingPDF,
    getSellerProductivityPDF,
    getStockEntriesPDF
} = require('../controllers/reportController');

router.use(verifyToken, checkAdmin);

// --- ROTAS DE DADOS (JSON) ---
router.get('/sales-summary', getSalesSummary);
router.get('/product-ranking', getProductRanking);
router.get('/client-ranking', getClientRanking);
router.get('/client-analysis', getClientAnalysis);
router.get('/seller-productivity', getSellerProductivity);
router.get('/stock-entries', getStockEntriesReport);
router.get('/employee-productivity', getEmployeeProductivity); // <-- NOVA ROTA ADICIONADA

// --- ROTAS DE RELATÓRIOS (PDF) ---
router.get('/venda/:id/pdf', gerarComprovanteVenda);
router.get('/product-ranking/pdf', getProductRankingPDF);
router.get('/client-ranking/pdf', getClientRankingPDF);
router.get('/seller-productivity/pdf', getSellerProductivityPDF);
router.get('/stock-entries/pdf', getStockEntriesPDF);

module.exports = router;
