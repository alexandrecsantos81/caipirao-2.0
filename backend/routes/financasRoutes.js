// backend/routes/financasRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const { getDashboardConsolidado } = require('../controllers/financasController');

// Protege todas as rotas neste arquivo, exigindo login de Admin
router.use(verifyToken, checkAdmin);

// Define a rota para o dashboard consolidado
// GET /api/financas/dashboard-consolidado
router.get('/dashboard-consolidado', getDashboardConsolidado);

// A LINHA QUE FALTAVA:
module.exports = router; // <-- CORREÇÃO: Exporta o router configurado.
