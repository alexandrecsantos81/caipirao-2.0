const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware'); // Middleware para proteger as rotas

// Importa as funções do controller.
// Usamos a desestruturação para pegar cada função pelo nome exato.
const {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getHistoricoVendasCliente // <-- NOVA FUNÇÃO A SER CRIADA
} = require('../controllers/clienteController');

// Aplica o middleware de verificação de token para todas as rotas neste arquivo.
// Ninguém pode acessar as rotas de clientes sem estar logado.
router.use(verifyToken);

// Define as rotas para o endpoint principal ('/api/clientes')
router.route('/')
    .get(getClientes)      // Rota para GET /api/clientes -> Chama a função getClientes
    .post(createCliente);  // Rota para POST /api/clientes -> Chama a função createCliente

// Define as rotas para endpoints com um ID específico (ex: '/api/clientes/123')
router.route('/:id')
    .put(updateCliente)    // Rota para PUT /api/clientes/:id -> Chama a função updateCliente
    .delete(deleteCliente);// Rota para DELETE /api/clientes/:id -> Chama a função deleteCliente

// ✅ NOVA ROTA para buscar o histórico de vendas de um cliente específico
router.get('/:id/historico', getHistoricoVendasCliente);

module.exports = router;
