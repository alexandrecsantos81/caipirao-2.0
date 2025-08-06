// backend/routes/clientes.js

const express = require('express');
const router = express.Router();

// 1. Importa as funções do nosso novo controller
const {
    createCliente,
    getClientes,
    getClienteById,
    updateCliente,
    deleteCliente
} = require('../controllers/clienteController');

// 2. Associa cada rota à sua função correspondente no controller
router.post('/', createCliente);
router.get('/', getClientes);
router.get('/:id', getClienteById);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

// Uma forma mais organizada e encadeada de escrever as rotas
// router.route('/').get(getClientes).post(createCliente);
// router.route('/:id').get(getClienteById).put(updateCliente).delete(deleteCliente);

module.exports = router;
