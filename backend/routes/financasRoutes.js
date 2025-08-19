const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
// ✅ INÍCIO DA MODIFICAÇÃO: Importando a nova função do controller
const { getDashboardConsolidado, getAnaliseFinanceira } = require('../controllers/financasController');
const { getReceitasPessoaisPDF, getDespesasPessoaisPDF } = require('../controllers/financasReportController');

// Aplica o middleware de verificação para todas as rotas deste arquivo
router.use(verifyToken, checkAdmin);

// Rota para os KPIs do dashboard consolidado
router.get('/dashboard-consolidado', getDashboardConsolidado);

// ✅ INÍCIO DA MODIFICAÇÃO: Adicionando a nova rota para os dados dos gráficos
router.get('/analise-mensal', getAnaliseFinanceira);

// Rotas para os relatórios em PDF
router.get('/report/receitas-pessoais/pdf', getReceitasPessoaisPDF);
router.get('/report/despesas-pessoais/pdf', getDespesasPessoaisPDF);

module.exports = router;
