// backend/routes/movimentacoes.js

const express = require('express');
const router = express.Router();
const { createVenda, getVendas, createDespesa, getDespesas } = require('../controllers/movimentacaoController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// --- ROTAS DE VENDAS (ENTRADAS) ---
// Qualquer usuário logado pode criar e ver as vendas.
router.post('/vendas', verifyToken, createVenda);
router.get('/vendas', verifyToken, getVendas);

// --- ROTAS DE DESPESAS (SAÍDAS) ---
// Acesso para CRIAR despesas é restrito a ADMINS.
router.post('/despesas', verifyToken, checkAdmin, createDespesa);

// Qualquer usuário logado pode VER as despesas.
// (Poderíamos restringir a ADMIN se necessário, mas por enquanto deixamos aberto para usuários logados)
router.get('/despesas', verifyToken, getDespesas);


// Futuramente, podemos adicionar rotas de PUT e DELETE para despesas aqui, também protegidas por checkAdmin.
// Exemplo:
// router.put('/despesas/:id', verifyToken, checkAdmin, updateDespesa);
// router.delete('/despesas/:id', verifyToken, checkAdmin, deleteDespesa);


module.exports = router;
