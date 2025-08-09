const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    registrarDespesa,
    getDespesas,
    quitarDespesa,
    getDespesasAPagar,
} = require('../controllers/despesaController');

// Todas as rotas aqui são protegidas e exigem login
router.use(verifyToken);

router.route('/')
    .get(getDespesas)
    .post(registrarDespesa);

// Rota específica para o card de notificações do dashboard
router.get('/a-pagar', getDespesasAPagar);

// Apenas utilizadores com perfil ADMIN podem quitar despesas
router.put('/:id/quitar', checkAdmin, quitarDespesa);

module.exports = router;
