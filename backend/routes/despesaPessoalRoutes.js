const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getDespesasPessoais,
    createDespesaPessoal,
    updateDespesaPessoal,
    deleteDespesaPessoal,
} = require('../controllers/despesaPessoalController');

// Protege todas as rotas, exigindo login de Admin
router.use(verifyToken, checkAdmin);

router.route('/')
    .get(getDespesasPessoais)
    .post(createDespesaPessoal);

router.route('/:id')
    .put(updateDespesaPessoal)
    .delete(deleteDespesaPessoal);

module.exports = router;
