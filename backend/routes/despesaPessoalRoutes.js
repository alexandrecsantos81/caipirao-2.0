const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getDespesasPessoais,
    createDespesaPessoal,
    updateDespesa,
    togglePagamentoDespesa,
    deleteDespesaPessoal,
    // ✅ INÍCIO DA MODIFICAÇÃO: Importando a nova função
    getDespesasPessoaisPendentes,
} = require('../controllers/despesaPessoalController');

router.use(verifyToken, checkAdmin);

// ✅ INÍCIO DA MODIFICAÇÃO: Adicionando a nova rota para pendências
// Esta rota deve vir antes da rota com /:id para evitar que "pendentes" seja interpretado como um ID.
router.get('/pendentes', getDespesasPessoaisPendentes);
// ✅ FIM DA MODIFICAÇÃO

router.route('/')
    .get(getDespesasPessoais)
    .post(createDespesaPessoal);

router.put('/:id', updateDespesa); 
router.patch('/:id/toggle-pago', togglePagamentoDespesa); 
router.delete('/:id', deleteDespesaPessoal);

module.exports = router;
