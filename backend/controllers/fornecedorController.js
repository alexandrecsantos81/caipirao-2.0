const pool = require('../db');

// @desc    Listar todos os fornecedores
// @route   GET /api/fornecedores
// @access  Protegido
const getFornecedores = async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM fornecedores ORDER BY nome ASC');
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Criar um novo fornecedor
// @route   POST /api/fornecedores
// @access  Protegido
const createFornecedor = async (req, res) => {
    const { nome, cnpj_cpf, telefone, email, endereco } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    try {
        const novoFornecedor = await pool.query(
            'INSERT INTO fornecedores (nome, cnpj_cpf, telefone, email, endereco) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, cnpj_cpf, telefone, email, endereco]
        );
        res.status(201).json(novoFornecedor.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Violação de chave única (cnpj_cpf)
            return res.status(409).json({ error: 'CNPJ/CPF já cadastrado.' });
        }
        console.error('Erro ao criar fornecedor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Atualizar um fornecedor
// @route   PUT /api/fornecedores/:id
// @access  Protegido
const updateFornecedor = async (req, res) => {
    const { id } = req.params;
    const { nome, cnpj_cpf, telefone, email, endereco } = req.body;
    if (!nome) {
        return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }
    try {
        const fornecedorAtualizado = await pool.query(
            'UPDATE fornecedores SET nome = $1, cnpj_cpf = $2, telefone = $3, email = $4, endereco = $5 WHERE id = $6 RETURNING *',
            [nome, cnpj_cpf, telefone, email, endereco, id]
        );
        if (fornecedorAtualizado.rowCount === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado.' });
        }
        res.status(200).json(fornecedorAtualizado.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'CNPJ/CPF já cadastrado em outro fornecedor.' });
        }
        console.error('Erro ao atualizar fornecedor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Deletar um fornecedor
// @route   DELETE /api/fornecedores/:id
// @access  Protegido (Admin)
const deleteFornecedor = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM fornecedores WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado.' });
        }
        res.status(204).send(); // Sucesso, sem conteúdo
    } catch (error) {
        // Verifica se a exclusão falha por causa de uma despesa vinculada
        if (error.code === '23503') { // Violação de chave estrangeira
            return res.status(400).json({ error: 'Não é possível excluir o fornecedor, pois ele está vinculado a uma ou mais despesas.' });
        }
        console.error('Erro ao deletar fornecedor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getFornecedores,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
};
