// backend/routes/reports.js

const express = require('express');
const router = express.Router();
const { getFinancialSummary } = require('../controllers/reportController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

/**
 * @route GET /api/reports/summary
 * @description Retorna um resumo financeiro (Receita, Despesa, Saldo).
 * @access Privado - Apenas ADMINS podem ver os relatórios financeiros.
 */
router.get('/summary', verifyToken, checkAdmin, getFinancialSummary);

module.exports = router;
