const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    registrarDespesa,
    getDespesas,
    quitarDespesa,
    getDespesasAPagar,
    updateDespesa,
    deleteDespesa, // <-- IMPORTAR A FUNÇÃO DE DELETAR
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
    .put(checkAdmin, updateDespesa)
    .delete(checkAdmin, deleteDespesa); // <-- ROTA DELETE ADICIONADA

// Apenas utilizadores com perfil ADMIN podem quitar despesas
router.put('/:id/quitar', checkAdmin, quitarDespesa);

module.exports = router;
