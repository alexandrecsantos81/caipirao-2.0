// backend/routes/movimentacoes.js

const express = require('express');
const router = express.Router();
// 1. Importar a nova função do controller
const { 
    createVenda, 
    getVendas, 
    createDespesa, 
    getDespesas, 
    getContasAReceber, // <-- NOVA FUNÇÃO
    registrarPagamento, // <-- NOVA FUNÇÃO
} = require('../controllers/movimentacaoController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// --- ROTAS DE VENDAS (ENTRADAS) ---
router.post('/vendas', verifyToken, createVenda);
router.get('/vendas', verifyToken, getVendas);

// --- ROTAS DE DESPESAS (SAÍDAS) ---
router.post('/despesas', verifyToken, checkAdmin, createDespesa);
router.get('/despesas', verifyToken, getDespesas);

// --- ROTAS FINANCEIRAS (Contas a Receber) ---
// 2. Criar a nova rota GET para buscar as contas a receber
router.get('/contas-a-receber', verifyToken, checkAdmin, getContasAReceber);

// 3. Criar a nova rota PUT para registrar o pagamento de uma venda
router.put('/vendas/:id/pagamento', verifyToken, checkAdmin, registrarPagamento);

module.exports = router;
