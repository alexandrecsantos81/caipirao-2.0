const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getFornecedores,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
} = require('../controllers/fornecedorController');

// Todas as rotas aqui são protegidas e exigem login
router.use(verifyToken);

router.route('/')
    .get(getFornecedores)
    .post(createFornecedor);

router.route('/:id')
    .put(updateFornecedor)
    .delete(checkAdmin, deleteFornecedor); // Apenas Admins podem deletar

module.exports = router;
