const pool = require('../db');

const toNull = (value) => (value === '' || value === null ? null : value);

/**
 * @desc    Listar todos os clientes com paginação e filtro de busca
 * @route   GET /api/clientes
 * @access  Protegido
 */
const getClientes = async (req, res) => {
    // Extrai os parâmetros da query, com valores padrão
    const { pagina = 1, limite = 10, termoBusca } = req.query;
    const offset = (pagina - 1) * limite;

    // Constrói a base da consulta e os parâmetros
    let queryBase = 'FROM clientes';
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // Adiciona a cláusula WHERE se um termo de busca for fornecido
    if (termoBusca) {
        whereClause = `
            WHERE nome ILIKE $${paramIndex}
            OR email ILIKE $${paramIndex}
            OR telefone ILIKE $${paramIndex}
            OR responsavel ILIKE $${paramIndex}
        `;
        params.push(`%${termoBusca}%`);
        paramIndex++;
    }

    try {
        // Consulta para obter o número total de itens (considerando o filtro)
        const totalQuery = `SELECT COUNT(*) ${queryBase} ${whereClause}`;
        const totalResult = await pool.query(totalQuery, termoBusca ? [params[0]] : []);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        // Adiciona os parâmetros de paginação
        params.push(limite, offset);

        // Consulta para obter os dados paginados e filtrados
        const clientesQuery = `
            SELECT id, nome, email, telefone, endereco, responsavel, tem_whatsapp, coordenada_x, coordenada_y, data_criacao
            ${queryBase}
            ${whereClause}
            ORDER BY nome ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        
        const clientesResult = await pool.query(clientesQuery, params);

        // Retorna a resposta formatada
        res.status(200).json({
            dados: clientesResult.rows,
            total: totalItens,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas,
        });

    } catch (err) {
        console.error('Erro ao buscar clientes:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor ao processar a sua solicitação.' });
    }
};


/**
 * @desc    Criar um novo cliente
 * @route   POST /api/clientes
 * @access  Protegido
 */
const createCliente = async (req, res) => {
    const { nome, telefone, responsavel, tem_whatsapp, endereco } = req.body;
    const email = toNull(req.body.email);

    // Validação atualizada com os novos campos obrigatórios
    if (!nome || nome.trim() === '' || 
        !telefone || telefone.trim() === '' ||
        !responsavel || responsavel.trim() === '' ||
        !endereco || endereco.trim() === '') {
        return res.status(400).json({ error: 'Os campos Nome Empresarial, Telefone, Responsável e Endereço são obrigatórios.' });
    }

    try {
        const newCliente = await pool.query(
            `INSERT INTO clientes (nome, email, telefone, endereco, responsavel, tem_whatsapp) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [
                nome.trim().toUpperCase(), 
                email, 
                telefone.trim(), 
                endereco.trim().toUpperCase(), 
                responsavel.trim().toUpperCase(), 
                tem_whatsapp || false
            ]
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

/**
 * @desc    Atualizar um cliente existente
 * @route   PUT /api/clientes/:id
 * @access  Protegido
 */
const updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nome, telefone, responsavel, tem_whatsapp, endereco } = req.body;
    const email = toNull(req.body.email);

    // Validação atualizada com os novos campos obrigatórios
    if (!nome || nome.trim() === '' || 
        !telefone || telefone.trim() === '' ||
        !responsavel || responsavel.trim() === '' ||
        !endereco || endereco.trim() === '') {
        return res.status(400).json({ error: 'Os campos Nome Empresarial, Telefone, Responsável e Endereço são obrigatórios.' });
    }

    try {
        const updatedCliente = await pool.query(
            `UPDATE clientes 
             SET nome = $1, email = $2, telefone = $3, endereco = $4, responsavel = $5, tem_whatsapp = $6
             WHERE id = $7 
             RETURNING *`,
            [
                nome.trim().toUpperCase(), 
                email, 
                telefone.trim(), 
                endereco.trim().toUpperCase(), 
                responsavel.trim().toUpperCase(), 
                tem_whatsapp || false, 
                id
            ]
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

/**
 * @desc    Deletar um cliente
 * @route   DELETE /api/clientes/:id
 * @access  Protegido
 */
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

/**
 * @desc    Buscar o histórico de vendas de um cliente específico
 * @route   GET /api/clientes/:id/historico
 * @access  Protegido
 */
const getHistoricoVendasCliente = async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT 
                m.id, 
                m.data_venda, 
                m.valor_total, 
                m.opcao_pagamento, 
                m.data_pagamento,
                m.produtos -- A coluna de produtos já contém os detalhes que precisamos
            FROM movimentacoes m
            WHERE m.cliente_id = $1 AND m.tipo = 'ENTRADA'
            ORDER BY m.data_venda DESC, m.id DESC;
        `;
        
        const resultado = await pool.query(query, [id]);

        res.status(200).json(resultado.rows);

    } catch (err) {
        console.error('Erro ao buscar histórico de vendas do cliente:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor ao processar a sua solicitação.' });
    }
};


module.exports = {
    getClientes,
    createCliente,
    updateCliente,
    deleteCliente,
    getHistoricoVendasCliente // <-- Exportando a nova função
};
