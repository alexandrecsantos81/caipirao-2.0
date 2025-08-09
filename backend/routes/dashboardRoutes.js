const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const { getKPIs, getVendasPorDia } = require('../controllers/dashboardController');

// Todas as rotas do dashboard são protegidas e exigem login.
// Usamos o checkAdmin para garantir que apenas administradores acessem esses dados.
router.use(verifyToken, checkAdmin);

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Retorna os principais KPIs (Key Performance Indicators) para os cards.
 * @access  Admin
 */
router.get('/kpis', getKPIs);

/**
 * @route   GET /api/dashboard/vendas-por-dia
 * @desc    Retorna dados de vendas agregados por dia para o gráfico.
 * @access  Admin
 */
router.get('/vendas-por-dia', getVendasPorDia);


module.exports = router;
