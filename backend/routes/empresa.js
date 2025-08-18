// backend/routes/empresa.js

const express = require('express');
const router = express.Router();
const { getEmpresaDados, upsertEmpresaDados } = require('../controllers/empresaController');
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

// O middleware é aplicado a todas as rotas definidas neste arquivo.
// 1. `verifyToken`: Garante que o usuário está autenticado (logado).
// 2. `checkAdmin`: Garante que o usuário autenticado tem o perfil 'ADMIN'.
// Se qualquer uma das verificações falhar, a requisição é bloqueada antes de chegar ao controller.
router.use(verifyToken, checkAdmin);

// Define a rota para buscar os dados
// GET -> /api/empresa
router.get('/', getEmpresaDados);

// Define a rota para salvar/atualizar os dados
// PUT -> /api/empresa
router.put('/', upsertEmpresaDados);

module.exports = router;
