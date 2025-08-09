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
    getSellerProductivity // Importe a nova função
} = require('../controllers/reportController');

router.use(verifyToken, checkAdmin);

router.get('/sales-summary', getSalesSummary);
router.get('/product-ranking', getProductRanking);
router.get('/client-ranking', getClientRanking);
router.get('/client-analysis', getClientAnalysis);

/**
 * @route   GET /api/reports/seller-productivity
 * @desc    Retorna o ranking de produtividade dos vendedores no período.
 * @access  Admin
 */
router.get('/seller-productivity', getSellerProductivity); // ADICIONE A NOVA ROTA AQUI

module.exports = router;
