const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/produtos
 * @desc    Obter todos os produtos
 * @access  Privado (qualquer usuário logado)
 */
router.get('/', verifyToken, produtoController.getProdutos);

/**
 * @route   POST /api/produtos
 * @desc    Criar um novo produto
 * @access  Restrito (somente ADMIN)
 */
router.post('/', verifyToken, checkAdmin, produtoController.createProduto);

/**
 * @route   PUT /api/produtos/:id
 * @desc    Atualizar um produto existente
 * @access  Restrito (somente ADMIN)
 */
router.put('/:id', verifyToken, checkAdmin, produtoController.updateProduto);

/**
 * @route   DELETE /api/produtos/:id
 * @desc    Deletar um produto
 * @access  Restrito (somente ADMIN)
 */
router.delete('/:id', verifyToken, checkAdmin, produtoController.deleteProduto);

/**
 * @route   POST /api/produtos/:id/adicionar-estoque
 * @desc    Adiciona uma quantidade ao estoque de um produto existente.
 * @access  Restrito (somente ADMIN)
 */
router.post('/:id/adicionar-estoque', verifyToken, checkAdmin, produtoController.addEstoque);


module.exports = router;
