const pool = require('../db');

// Função auxiliar para converter strings vazias em NULL
const toNull = (value) => (value === '' ? null : value);

// @desc    Listar todos os clientes
// @route   GET /api/clientes
// @access  Protegido
const getClientes = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nome, email, telefone, endereco, responsavel, tem_whatsapp, coordenada_x, coordenada_y, data_criacao FROM clientes ORDER BY nome ASC'
        );
        // CORREÇÃO: Retornar um objeto compatível com o que o frontend espera
        res.status(200).json({
            dados: result.rows,
            pagina: 1,
            totalPaginas: 1,
        });
    } catch (err) {
        console.error('Erro ao buscar clientes:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor ao processar a sua solicitação.' });
    }
};

// @desc    Criar um novo cliente
// @route   POST /api/clientes
// @access  Protegido
const createCliente = async (req, res) => {
    const { nome, telefone, responsavel, tem_whatsapp, endereco } = req.body;
    // CORREÇÃO: Usar a função toNull para tratar o email
    const email = toNull(req.body.email);

    if (!nome || !telefone) {
        return res.status(400).json({ error: 'Os campos "nome" e "telefone" são obrigatórios.' });
    }

    try {
        const newCliente = await pool.query(
            `INSERT INTO clientes (nome, email, telefone, endereco, responsavel, tem_whatsapp) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [nome, email, telefone, endereco, responsavel, tem_whatsapp || false]
        );
        res.status(201).json(newCliente.rows[0]);
    } catch (err) {
        console.error('Erro ao criar cliente:', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'O email fornecido já está em uso.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Atualizar um cliente existente
// @route   PUT /api/clientes/:id
// @access  Protegido
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nome, telefone, responsavel, tem_whatsapp, endereco } = req.body;
    // CORREÇÃO: Usar a função toNull para tratar o email
    const email = toNull(req.body.email);

    if (!nome || !telefone) {
        return res.status(400).json({ error: 'Os campos "nome" e "telefone" são obrigatórios.' });
    }

    try {
        const updatedCliente = await pool.query(
            `UPDATE clientes 
             SET nome = $1, email = $2, telefone = $3, endereco = $4, responsavel = $5, tem_whatsapp = $6
             WHERE id = $7 
             RETURNING *`,
            [nome, email, telefone, endereco, responsavel, tem_whatsapp || false, id]
        );

        if (updatedCliente.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        res.status(200).json(updatedCliente.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar cliente:', err.message);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'O email fornecido já está em uso por outro cliente.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Deletar um cliente
// @route   DELETE /api/clientes/:id
// @access  Protegido
const deleteCliente = async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.status(200).json({ message: 'Cliente deletado com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar cliente:', err.message);
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Não é possível excluir este cliente, pois ele está associado a movimentações existentes.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente
};
