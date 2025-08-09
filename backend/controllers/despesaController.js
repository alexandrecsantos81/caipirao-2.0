const pool = require('../db');

// @desc    Registrar uma nova despesa
// @route   POST /api/despesas
// @access  Protegido
const registrarDespesa = async (req, res) => {
    const { tipo_saida, valor, discriminacao, data_vencimento, fornecedor_id } = req.body;

    if (!tipo_saida || !valor || !discriminacao || !data_vencimento) {
        return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, discriminação e vencimento.' });
    }

    try {
        const novaDespesa = await pool.query(
            `INSERT INTO despesas (tipo_saida, valor, discriminacao, data_vencimento, fornecedor_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [tipo_saida, valor, discriminacao, data_vencimento, fornecedor_id]
        );
        res.status(201).json(novaDespesa.rows[0]);
    } catch (error) {
        console.error('Erro ao registrar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Listar despesas (com filtros)
// @route   GET /api/despesas
// @access  Protegido
const getDespesas = async (req, res) => {
    // Futuramente, podemos adicionar filtros via query string (ex: ?status=pendente)
    try {
        const resultado = await pool.query(`
            SELECT 
                d.*, 
                f.nome as nome_fornecedor 
            FROM despesas d
            LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
            ORDER BY d.data_vencimento DESC
        `);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Quitar uma despesa
// @route   PUT /api/despesas/:id/quitar
// @access  Protegido (Admin)
const quitarDespesa = async (req, res) => {
    const { id } = req.params;
    const { data_pagamento, responsavel_pagamento_id } = req.body;
    const userIdFromToken = req.user.id; // ID do utilizador que está fazendo a ação

    if (!data_pagamento) {
        return res.status(400).json({ error: 'A data de pagamento é obrigatória.' });
    }
    
    // O responsável pode ser quem está logado ou outro admin selecionado no frontend
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

// @desc    Listar despesas a pagar (para o card de notificações)
// @route   GET /api/despesas/a-pagar
// @access  Protegido
const getDespesasAPagar = async (req, res) => {
    try {
        // Busca despesas não pagas com vencimento nos próximos 5 dias (ou já vencidas)
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


module.exports = {
    registrarDespesa,
    getDespesas,
    quitarDespesa,
    getDespesasAPagar,
};
