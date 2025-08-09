const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    registrarDespesa,
    getDespesas,
    quitarDespesa,
    getDespesasAPagar,
    updateDespesa,   // <-- IMPORTAR NOVA FUNÇÃO
    deleteDespesa,   // <-- IMPORTAR NOVA FUNÇÃO
} = require('../controllers/despesaController');

// Todas as rotas aqui são protegidas e exigem login
router.use(verifyToken);

router.route('/')
    .get(getDespesas)
    .post(checkAdmin, registrarDespesa); // Apenas admin pode criar

// Rota específica para o card de notificações do dashboard
router.get('/a-pagar', getDespesasAPagar);

// Novas rotas para editar e deletar
router.route('/:id')
    .put(checkAdmin, updateDespesa)     // <-- NOVA ROTA PUT
    .delete(checkAdmin, deleteDespesa); // <-- NOVA ROTA DELETE

// Apenas utilizadores com perfil ADMIN podem quitar despesas
router.put('/:id/quitar', checkAdmin, quitarDespesa);

module.exports = router;
