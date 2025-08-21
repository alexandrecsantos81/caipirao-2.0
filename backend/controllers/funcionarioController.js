const pool = require('../db');

/**
 * @desc    Listar todos os funcionários com paginação e filtro
 * @route   GET /api/funcionarios
 * @access  Protegido
 */
const getFuncionarios = async (req, res) => {
    const { pagina = 1, limite = 1000, termoBusca, status } = req.query;
    const offset = (pagina - 1) * limite;

    let whereClauses = [];
    const params = [];
    let paramIndex = 1;

    // Adiciona o filtro de status apenas se ele for 'ATIVO' ou 'INATIVO'
    if (status === 'ATIVO' || status === 'INATIVO') {
        whereClauses.push(`status = $${paramIndex++}`);
        params.push(status);
    }

    // Adiciona o filtro de busca se um termo for fornecido
    if (termoBusca) {
        whereClauses.push(`(nome ILIKE $${paramIndex} OR cpf ILIKE $${paramIndex})`);
        params.push(`%${termoBusca}%`);
        paramIndex++; // Incrementa para a próxima posição de parâmetro
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        // Consulta para obter o número total de itens (considerando os filtros)
        const totalQuery = `SELECT COUNT(*) FROM funcionarios ${whereString}`;
        const totalResult = await pool.query(totalQuery, params);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        // Adiciona os parâmetros de paginação ao final do array
        const finalParams = [...params, limite, offset];

        // Constrói os placeholders para LIMIT e OFFSET dinamicamente
        const limitPlaceholder = `$${params.length + 1}`;
        const offsetPlaceholder = `$${params.length + 2}`;

        const funcionariosQuery = `
            SELECT id, nome, cpf, funcao, status, data_criacao
            FROM funcionarios
            ${whereString}
            ORDER BY nome ASC
            LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
        `;
        
        const funcionariosResult = await pool.query(funcionariosQuery, finalParams);

        res.status(200).json({
            dados: funcionariosResult.rows,
            total: totalItens,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas,
        });
    } catch (err) {
        console.error('Erro ao buscar funcionários:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Criar um novo funcionário
 * @route   POST /api/funcionarios
 * @access  Protegido (Admin)
 */
const createFuncionario = async (req, res) => {
    const { nome, cpf, funcao, status = 'ATIVO' } = req.body;

    if (!nome || nome.trim() === '') {
        return res.status(400).json({ error: 'O campo Nome é obrigatório.' });
    }

    try {
        const novoFuncionario = await pool.query(
            `INSERT INTO funcionarios (nome, cpf, funcao, status) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [
                nome.trim().toUpperCase(), 
                cpf ? cpf.replace(/\D/g, '') : null, 
                funcao ? funcao.trim().toUpperCase() : null, 
                status
            ]
        );
        res.status(201).json(novoFuncionario.rows[0]);
    } catch (err) {
        if (err.code === '23505' && err.constraint === 'funcionarios_cpf_key') {
            return res.status(409).json({ error: 'O CPF informado já está cadastrado.' });
        }
        console.error('Erro ao criar funcionário:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Atualizar um funcionário
 * @route   PUT /api/funcionarios/:id
 * @access  Protegido (Admin)
 */
const updateFuncionario = async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, funcao, status } = req.body;

    if (!nome || nome.trim() === '' || !status) {
        return res.status(400).json({ error: 'Os campos Nome e Status são obrigatórios.' });
    }

    try {
        const updatedFuncionario = await pool.query(
            `UPDATE funcionarios 
             SET nome = $1, cpf = $2, funcao = $3, status = $4
             WHERE id = $5 
             RETURNING *`,
            [
                nome.trim().toUpperCase(), 
                cpf ? cpf.replace(/\D/g, '') : null, 
                funcao ? funcao.trim().toUpperCase() : null, 
                status,
                id
            ]
        );

        if (updatedFuncionario.rowCount === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }

        res.status(200).json(updatedFuncionario.rows[0]);
    } catch (err) {
        if (err.code === '23505' && err.constraint === 'funcionarios_cpf_key') {
            return res.status(409).json({ error: 'O CPF informado já pertence a outro funcionário.' });
        }
        console.error('Erro ao atualizar funcionário:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Deletar um funcionário
 * @route   DELETE /api/funcionarios/:id
 * @access  Protegido (Admin)
 */
const deleteFuncionario = async (req, res) => {
    const { id } = req.params;
    try {
        const deleteOp = await pool.query('DELETE FROM funcionarios WHERE id = $1', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ error: 'Funcionário não encontrado.' });
        }
        res.status(204).send(); // 204 No Content
    } catch (err) {
        if (err.code === '23503') { // Chave estrangeira violada
            return res.status(400).json({ error: 'Não é possível excluir este funcionário, pois ele está associado a despesas existentes.' });
        }
        console.error('Erro ao deletar funcionário:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    getFuncionarios,
    createFuncionario,
    updateFuncionario,
    deleteFuncionario
};
