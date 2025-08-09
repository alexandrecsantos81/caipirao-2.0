const express = require('express');
const router = express.Router();
const { 
    createVenda, 
    getVendas, 
    getContasAReceber,
    registrarPagamento,
    updateVenda,    // <-- IMPORTAR NOVA FUNÇÃO
    deleteVenda,    // <-- IMPORTAR NOVA FUNÇÃO
} = require('../controllers/movimentacaoController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// --- ROTAS DE VENDAS (ENTRADAS) ---
router.post('/vendas', verifyToken, createVenda);
router.get('/vendas', verifyToken, getVendas);

// Novas rotas para editar e deletar vendas
router.route('/vendas/:id')
    .put(verifyToken, updateVenda)       // <-- NOVA ROTA PUT
    .delete(verifyToken, deleteVenda);   // <-- NOVA ROTA DELETE

// --- ROTAS FINANCEIRAS (Contas a Receber) ---
router.get('/contas-a-receber', verifyToken, checkAdmin, getContasAReceber);
router.put('/vendas/:id/pagamento', verifyToken, checkAdmin, registrarPagamento);

module.exports = router;
