// backend/routes/reports.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// Importar todas as funções, incluindo as de geração de PDF
const { 
    getSalesSummary, 
    getProductRanking,
    getClientRanking,
    getClientAnalysis,
    getSellerProductivity,
    getStockEntriesReport,
    getProductRankingPDF,
    getClientRankingPDF,
    getSellerProductivityPDF,
    getStockEntriesPDF
} = require('../controllers/reportController');

// Aplica o middleware para todas as rotas deste arquivo.
router.use(verifyToken, checkAdmin);

// --- ROTAS DE DADOS (JSON) ---
router.get('/sales-summary', getSalesSummary);
router.get('/product-ranking', getProductRanking);
router.get('/client-ranking', getClientRanking);
router.get('/client-analysis', getClientAnalysis);
router.get('/seller-productivity', getSellerProductivity);
router.get('/stock-entries', getStockEntriesReport);

// --- ROTAS DE RELATÓRIOS (PDF) ---
router.get('/product-ranking/pdf', getProductRankingPDF);
router.get('/client-ranking/pdf', getClientRankingPDF);
router.get('/seller-productivity/pdf', getSellerProductivityPDF);
router.get('/stock-entries/pdf', getStockEntriesPDF);

module.exports = router;
