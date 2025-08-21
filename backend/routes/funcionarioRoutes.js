// backend/routes/funcionarioRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
    getFuncionarios,
    createFuncionario,
    updateFuncionario,
    deleteFuncionario,
} = require('../controllers/funcionarioController');

// Todas as rotas aqui são protegidas e exigem login de Admin
router.use(verifyToken, checkAdmin);

router.route('/')
    .get(getFuncionarios)
    .post(createFuncionario);

router.route('/:id')
    .put(updateFuncionario)
    .delete(deleteFuncionario);

module.exports = router;
