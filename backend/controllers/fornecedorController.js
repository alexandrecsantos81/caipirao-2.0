const pool = require('../db');

// Função auxiliar para remover caracteres não numéricos
const limparNumeros = (valor) => {
    if (!valor) return null;
    return valor.replace(/\D/g, '');
};

/**
 * @desc    Listar todos os fornecedores com paginação e filtro de busca
 * @route   GET /api/fornecedores
 * @access  Protegido
 */
const getFornecedores = async (req, res) => {
    // ✅ Define o limite padrão como 50
    const { pagina = 1, limite = 50, termoBusca } = req.query;
    const offset = (pagina - 1) * limite;

    let queryBase = 'FROM fornecedores';
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (termoBusca) {
        whereClause = `
            WHERE nome ILIKE $${paramIndex}
            OR cnpj_cpf ILIKE $${paramIndex}
            OR telefone ILIKE $${paramIndex}
            OR email ILIKE $${paramIndex}
        `;
        params.push(`%${termoBusca}%`);
        paramIndex++;
    }

    try {
        const totalQuery = `SELECT COUNT(*) ${queryBase} ${whereClause}`;
        const totalResult = await pool.query(totalQuery, termoBusca ? [params[0]] : []);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        params.push(limite, offset);

        // ✅ Altera a ordenação para 'data_criacao DESC'
        const fornecedoresQuery = `
            SELECT id, nome, cnpj_cpf, telefone, email, endereco, data_criacao
            ${queryBase}
            ${whereClause}
            ORDER BY data_criacao DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const fornecedoresResult = await pool.query(fornecedoresQuery, params);

        res.status(200).json({
            dados: fornecedoresResult.rows,
            total: totalItens,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas,
        });
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Criar um novo fornecedor
 * @route   POST /api/fornecedores
 * @access  Protegido
 */
const createFornecedor = async (req, res) => {
    const { nome, cnpj_cpf, telefone, email, endereco } = req.body;

    if (!nome || nome.trim() === '' || !cnpj_cpf || !telefone || !endereco || endereco.trim() === '') {
        return res.status(400).json({ error: 'Os campos Nome, CNPJ/CPF, Telefone e Endereço são obrigatórios.' });
    }

    const cnpjCpfLimpo = limparNumeros(cnpj_cpf);

    if (cnpjCpfLimpo.length !== 11 && cnpjCpfLimpo.length !== 14) {
        return res.status(400).json({ error: 'O CNPJ/CPF deve conter 11 ou 14 dígitos.' });
    }

    try {
        const novoFornecedor = await pool.query(
            'INSERT INTO fornecedores (nome, cnpj_cpf, telefone, email, endereco) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [
                nome.trim().toUpperCase(), 
                cnpjCpfLimpo,
                telefone, 
                email, 
                endereco.trim().toUpperCase()
            ]
        );
        res.status(201).json(novoFornecedor.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'CNPJ/CPF já cadastrado.' });
        }
        console.error('Erro ao criar fornecedor:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Atualizar um fornecedor
 * @route   PUT /api/fornecedores/:id
 * @access  Protegido
 */
const updateFornecedor = async (req, res) => {
    const { id } = req.params;
    const { nome, cnpj_cpf, telefone, email, endereco } = req.body;
    
    if (!nome || nome.trim() === '' || !cnpj_cpf || !telefone || !endereco || endereco.trim() === '') {
        return res.status(400).json({ error: 'Os campos Nome, CNPJ/CPF, Telefone e Endereço são obrigatórios.' });
    }

    const cnpjCpfLimpo = limparNumeros(cnpj_cpf);

    if (cnpjCpfLimpo.length !== 11 && cnpjCpfLimpo.length !== 14) {
        return res.status(400).json({ error: 'O CNPJ/CPF deve conter 11 ou 14 dígitos.' });
    }

    try {
        const fornecedorAtualizado = await pool.query(
            'UPDATE fornecedores SET nome = $1, cnpj_cpf = $2, telefone = $3, email = $4, endereco = $5 WHERE id = $6 RETURNING *',
            [
                nome.trim().toUpperCase(), 
                cnpjCpfLimpo,
                telefone, 
                email, 
                endereco.trim().toUpperCase(), 
                id
            ]
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

/**
 * @desc    Deletar um fornecedor
 * @route   DELETE /api/fornecedores/:id
 * @access  Protegido (Admin)
 */
const deleteFornecedor = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM fornecedores WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        if (error.code === '23503') {
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
