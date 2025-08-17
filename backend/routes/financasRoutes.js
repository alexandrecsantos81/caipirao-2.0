// backend/routes/financasRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const { getDashboardConsolidado } = require('../controllers/financasController');
const { getReceitasPessoaisPDF, getDespesasPessoaisPDF } = require('../controllers/financasReportController');

router.use(verifyToken, checkAdmin);
router.get('/dashboard-consolidado', getDashboardConsolidado);
router.get('/report/receitas-pessoais/pdf', getReceitasPessoaisPDF);
router.get('/report/despesas-pessoais/pdf', getDespesasPessoaisPDF);

module.exports = router;
