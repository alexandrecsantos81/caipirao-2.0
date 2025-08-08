// backend/routes/reports.js

const express = require('express');
const router = express.Router();

// 1. Importe as duas funções do controller
const { getFinancialSummary, getProdutosMaisVendidos } = require('../controllers/reportController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

/**
 * @route GET /api/reports/summary
 * @description Retorna um resumo financeiro (Receita, Despesa, Saldo).
 * @access Privado - Apenas ADMINS podem ver os relatórios financeiros.
 */
router.get('/summary', verifyToken, checkAdmin, getFinancialSummary);

/**
 * @route GET /api/reports/produtos-mais-vendidos
 * @description Retorna os 10 produtos mais vendidos.
 * @access Privado - Apenas ADMINS.
 */
router.get('/produtos-mais-vendidos', verifyToken, checkAdmin, getProdutosMaisVendidos);


module.exports = router;
