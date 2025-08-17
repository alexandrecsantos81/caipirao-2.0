const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getDespesasPessoais,
    createDespesaPessoal,
    updateDespesa, // <-- Importa a nova função de edição
    togglePagamentoDespesa, // <-- Importa a função de pagamento
    deleteDespesaPessoal,
} = require('../controllers/despesaPessoalController');

router.use(verifyToken, checkAdmin);

router.route('/')
    .get(getDespesasPessoais)
    .post(createDespesaPessoal);

// --- INÍCIO DA CORREÇÃO ---
// Rota PUT principal para editar os detalhes da despesa
router.put('/:id', updateDespesa); 

// Rota PATCH específica para apenas alternar o status de pagamento
router.patch('/:id/toggle-pago', togglePagamentoDespesa); 

// Rota DELETE permanece a mesma
router.delete('/:id', deleteDespesaPessoal);
// --- FIM DA CORREÇÃO ---

module.exports = router;
