const pool = require('../db');

/**
 * @desc    Registrar uma nova despesa
 * @route   POST /api/despesas
 * @access  Protegido (Admin)
 */
const registrarDespesa = async (req, res) => {
    const { tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id } = req.body;

    if (!tipo_saida || !valor || !discriminacao || !data_vencimento || !data_compra) {
        return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, discriminação, data da compra e vencimento.' });
    }

    // ===== NOVA LÓGICA DE NEGÓCIO =====
    // Se a data da compra for igual à data de vencimento, a despesa é considerada "à vista".
    // Portanto, a data de pagamento é preenchida automaticamente.
    const data_pagamento = data_compra === data_vencimento ? data_compra : null;
    // O responsável pelo pagamento será o usuário que está registrando a despesa, se for paga na hora.
    const responsavel_pagamento_id = data_pagamento ? req.user.id : null;
    // ===================================

    try {
        // Query atualizada para incluir data_pagamento e responsavel_pagamento_id
        const novaDespesa = await pool.query(
            `INSERT INTO despesas (tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id, data_pagamento, responsavel_pagamento_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id, data_pagamento, responsavel_pagamento_id]
        );
        res.status(201).json(novaDespesa.rows[0]);
    } catch (error) {
        console.error('Erro ao registrar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Listar despesas com paginação
 * @route   GET /api/despesas
 * @access  Protegido
 */
const getDespesas = async (req, res) => {
    const { pagina = 1, limite = 10 } = req.query;

    try {
        const totalPromise = pool.query('SELECT COUNT(*) FROM despesas');

        const offset = (pagina - 1) * limite;
        const despesasPromise = pool.query(`
            SELECT 
                d.*, 
                f.nome as nome_fornecedor 
            FROM despesas d
            LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
            ORDER BY d.data_vencimento DESC
            LIMIT $1 OFFSET $2
        `, [limite, offset]);
        
        const [totalResult, despesasResult] = await Promise.all([totalPromise, despesasPromise]);

        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        res.status(200).json({
            dados: despesasResult.rows,
            total: totalItens,
            pagina: parseInt(pagina, 10),
            limite: parseInt(limite, 10),
            totalPaginas,
        });

    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Quitar uma despesa
 * @route   PUT /api/despesas/:id/quitar
 * @access  Protegido (Admin)
 */
const quitarDespesa = async (req, res) => {
    const { id } = req.params;
    const { data_pagamento, responsavel_pagamento_id } = req.body;
    const userIdFromToken = req.user.id;

    if (!data_pagamento) {
        return res.status(400).json({ error: 'A data de pagamento é obrigatória.' });
    }
    
    const responsavelId = responsavel_pagamento_id || userIdFromToken;
    try {
        const despesaQuitada = await pool.query(
            `UPDATE despesas 
             SET data_pagamento = $1, responsavel_pagamento_id = $2 
             WHERE id = $3 AND data_pagamento IS NULL
             RETURNING *`,
            [data_pagamento, responsavelId, id]
        );

        if (despesaQuitada.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada ou já quitada.' });
        }

        res.status(200).json(despesaQuitada.rows[0]);
    } catch (error) {
        console.error('Erro ao quitar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Listar despesas a pagar (para o card de notificações)
 * @route   GET /api/despesas/a-pagar
 * @access  Protegido
 */
const getDespesasAPagar = async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT 
                d.id,
                d.valor,
                d.data_vencimento,
                f.nome as nome_fornecedor
            FROM despesas d
            LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
            WHERE d.data_pagamento IS NULL 
              AND d.data_vencimento <= CURRENT_DATE + INTERVAL '5 days'
            ORDER BY d.data_vencimento ASC
        `);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar contas a pagar:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Atualizar uma despesa existente
 * @route   PUT /api/despesas/:id
 * @access  Protegido (Admin)
 */
const updateDespesa = async (req, res) => {
    const { id } = req.params;
    const { tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id } = req.body;

    if (!tipo_saida || !valor || !discriminacao || !data_vencimento || !data_compra) {
        return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, discriminação, data da compra e vencimento.' });
    }

    // ===== NOVA LÓGICA DE NEGÓCIO APLICADA TAMBÉM NA ATUALIZAÇÃO =====
    const data_pagamento = data_compra === data_vencimento ? data_compra : null;
    // ===============================================================

    try {
        // Query atualizada para incluir a lógica de data_pagamento
        const despesaAtualizada = await pool.query(
            `UPDATE despesas 
             SET tipo_saida = $1, valor = $2, discriminacao = $3, data_vencimento = $4, data_compra = $5, fornecedor_id = $6, data_pagamento = $7
             WHERE id = $8 RETURNING *`,
            [tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id, data_pagamento, id]
        );

        if (despesaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }

        res.status(200).json(despesaAtualizada.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Deletar uma despesa
 * @route   DELETE /api/despesas/:id
 * @access  Protegido (Admin)
 */
const deleteDespesa = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM despesas WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        res.status(204).send(); // Sucesso, sem conteúdo
    } catch (error) {
        console.error('Erro ao deletar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

module.exports = {
    registrarDespesa,
    getDespesas,
    quitarDespesa,
    getDespesasAPagar,
    updateDespesa,
    deleteDespesa,
};
