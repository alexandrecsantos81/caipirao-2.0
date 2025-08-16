const pool = require('../db');
const { addMonths } = require('date-fns');

// @desc    Listar todas as despesas pessoais com filtro de data
// @route   GET /api/despesas-pessoais
// @access  Admin
const getDespesasPessoais = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        let query = 'SELECT * FROM despesas_pessoais';
        const params = [];

        if (startDate && endDate) {
            query += ' WHERE data_vencimento BETWEEN $1 AND $2';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY data_vencimento DESC';
        
        const resultado = await pool.query(query, params);
        res.status(200).json(resultado.rows);
    } catch (error) {
        console.error('Erro ao buscar despesas pessoais:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Criar uma nova despesa pessoal (com recorrência)
// @route   POST /api/despesas-pessoais
// @access  Admin
const createDespesaPessoal = async (req, res) => {
    const { descricao, valor, data_vencimento, categoria, recorrencia, mesesRecorrencia } = req.body;
    const utilizador_id = req.user.id;

    if (!descricao || !valor || !data_vencimento) {
        return res.status(400).json({ error: 'Descrição, valor e data de vencimento são obrigatórios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const totalMeses = recorrencia ? (parseInt(mesesRecorrencia, 10) || 1) : 1;
        const despesasCriadas = [];

        for (let i = 0; i < totalMeses; i++) {
            const dataVencimentoParcela = addMonths(new Date(data_vencimento), i);
            
            const novaDespesa = await client.query(
                `INSERT INTO despesas_pessoais (descricao, valor, data_vencimento, categoria, utilizador_id)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [descricao, valor, dataVencimentoParcela, categoria || null, utilizador_id]
            );
            despesasCriadas.push(novaDespesa.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json(despesasCriadas);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao criar despesa.' });
    } finally {
        client.release();
    }
};

// @desc    Atualizar uma despesa pessoal
// @route   PUT /api/despesas-pessoais/:id
// @access  Admin
const updateDespesaPessoal = async (req, res) => {
    const { id } = req.params;
    const { descricao, valor, data_vencimento, categoria, pago, data_pagamento } = req.body;

    try {
        const despesaAtualizada = await pool.query(
            `UPDATE despesas_pessoais 
             SET descricao = $1, valor = $2, data_vencimento = $3, categoria = $4, pago = $5, data_pagamento = $6
             WHERE id = $7 RETURNING *`,
            [descricao, valor, data_vencimento, categoria, pago, data_pagamento, id]
        );

        if (despesaAtualizada.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        res.status(200).json(despesaAtualizada.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// @desc    Deletar uma despesa pessoal
// @route   DELETE /api/despesas-pessoais/:id
// @access  Admin
const deleteDespesaPessoal = async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query('DELETE FROM despesas_pessoais WHERE id = $1', [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar despesa pessoal:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};


module.exports = {
    getDespesasPessoais,
    createDespesaPessoal,
    updateDespesaPessoal,
    deleteDespesaPessoal,
};
