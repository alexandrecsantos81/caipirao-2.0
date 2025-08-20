const express = require('express');
const router = express.Router();
const { 
    createVenda, 
    getVendas, 
    getContasAReceber,
    registrarPagamento,
    updateVenda,
    deleteVenda,
    getVendaPDF,
    reprogramarVencimentoVenda,
} = require('../controllers/movimentacaoController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// --- ROTAS DE VENDAS (ENTRADAS) ---
router.post('/vendas', verifyToken, createVenda);
router.get('/vendas', verifyToken, getVendas);

router.route('/vendas/:id')
    .put(verifyToken, updateVenda)
    .delete(verifyToken, deleteVenda);

router.get('/vendas/:id/pdf', verifyToken, getVendaPDF);

// Rota para reprogramar vencimento
router.patch('/vendas/:id/reprogramar', verifyToken, reprogramarVencimentoVenda);


// --- ROTAS FINANCEIRAS (Contas a Receber) ---
router.get('/contas-a-receber', verifyToken, checkAdmin, getContasAReceber);
router.put('/vendas/:id/pagamento', verifyToken, checkAdmin, registrarPagamento);

module.exports = router;
