// backend/routes/movimentacoes.js

const express = require('express');
const router = express.Router();
const { 
    createVenda, 
    getVendas, 
    getContasAReceber, // <-- IMPORTAR NOVA FUNÇÃO
    registrarPagamento,
    updateVenda,
    deleteVenda,
    getVendaPDF,
} = require('../controllers/movimentacaoController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// --- ROTAS DE VENDAS (ENTRADAS) ---
router.post('/vendas', verifyToken, createVenda);
router.get('/vendas', verifyToken, getVendas);

router.route('/vendas/:id')
    .put(verifyToken, updateVenda)
    .delete(verifyToken, deleteVenda);

router.get('/vendas/:id/pdf', verifyToken, getVendaPDF);

// --- ROTAS FINANCEIRAS (Contas a Receber) ---

// ROTA ANTIGA (será removida ou alterada, pois a nova é mais completa)
// router.get('/contas-a-receber', verifyToken, checkAdmin, getContasAReceber);

// ✅ NOVA ROTA PARA BUSCAR TODAS AS CONTAS A RECEBER PENDENTES
router.get('/contas-a-receber', verifyToken, checkAdmin, getContasAReceber);

router.put('/vendas/:id/pagamento', verifyToken, checkAdmin, registrarPagamento);

module.exports = router;
