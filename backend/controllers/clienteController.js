// backend/controllers/clienteController.js

const db = require('../db'); // Importa nossa conexão com o banco de dados

// @desc    Criar um novo cliente
// @route   POST /api/clientes
// @access  Privado
const createCliente = async (req, res) => {
    const { nome, email, telefone, coordenada_x, coordenada_y } = req.body;

    // Validação básica dos campos obrigatórios
    if (!nome || !email || !telefone) {
        return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios.' });
    }

    try {
        const novoCliente = await db.query(
            `INSERT INTO clientes (nome, email, telefone, coordenada_x, coordenada_y) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [nome, email, telefone, coordenada_x, coordenada_y]
        );

        res.status(201).json(novoCliente.rows[0]);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        // Verifica erro de email duplicado
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Obter todos os clientes
// @route   GET /api/clientes
// @access  Privado
const getClientes = async (req, res) => {
    try {
        const todosClientes = await db.query('SELECT * FROM clientes ORDER BY nome ASC');
        res.status(200).json(todosClientes.rows);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Obter um cliente específico pelo ID
// @route   GET /api/clientes/:id
// @access  Privado
const getClienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const cliente = await db.query('SELECT * FROM clientes WHERE id = $1', [id]);

        if (cliente.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        res.status(200).json(cliente.rows[0]);
    } catch (error) {
        console.error(`Erro ao buscar cliente com ID ${id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Atualizar um cliente
// @route   PUT /api/clientes/:id
// @access  Privado
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nome, email, telefone, coordenada_x, coordenada_y } = req.body;

    if (!nome || !email || !telefone) {
        return res.status(400).json({ error: 'Nome, email e telefone são obrigatórios.' });
    }

    try {
        const clienteAtualizado = await db.query(
            `UPDATE clientes 
             SET nome = $1, email = $2, telefone = $3, coordenada_x = $4, coordenada_y = $5 
             WHERE id = $6 
             RETURNING *`,
            [nome, email, telefone, coordenada_x, coordenada_y, id]
        );

        if (clienteAtualizado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado para atualização.' });
        }

        res.status(200).json(clienteAtualizado.rows[0]);
    } catch (error) {
        console.error(`Erro ao atualizar cliente com ID ${id}:`, error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está em uso por outro cliente.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Deletar um cliente
// @route   DELETE /api/clientes/:id
// @access  Privado
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado para exclusão.' });
        }

        res.status(200).json({ message: 'Cliente deletado com sucesso.' });
    } catch (error) {
        console.error(`Erro ao deletar cliente com ID ${id}:`, error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Exporta todas as funções para serem usadas nas rotas
module.exports = {
    createCliente,
    getClientes,
    getClienteById,
    updateCliente,
    deleteCliente,
};
