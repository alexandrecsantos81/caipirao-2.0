const pool = require('../db');

const registrarDespesa = async (req, res) => {
    const { tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id } = req.body;

    if (!tipo_saida || !valor || !discriminacao || !data_vencimento || !data_compra) {
        return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, discriminação, data da compra e vencimento.' });
    }

    const data_pagamento = data_compra === data_vencimento ? data_compra : null;
    const responsavel_pagamento_id = data_pagamento ? req.user.id : null;

    try {
        const novaDespesa = await pool.query(
            `INSERT INTO despesas (tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id, data_pagamento, responsavel_pagamento_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [tipo_saida, valor, discriminacao.trim().toUpperCase(), data_vencimento, data_compra, fornecedor_id, data_pagamento, responsavel_pagamento_id]
        );
        res.status(201).json(novaDespesa.rows[0]);
    } catch (error) {
        console.error('Erro ao registrar despesa:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const getDespesas = async (req, res) => {
    const { pagina = 1, limite = 50, termoBusca } = req.query;
    const offset = (pagina - 1) * limite;

    let whereClauses = [];
    const params = [];

    if (termoBusca) {
        params.push(`%${termoBusca}%`);
        whereClauses.push(`(d.discriminacao ILIKE $${params.length} OR f.nome ILIKE $${params.length})`);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const countQuery = `
            SELECT COUNT(d.id)
            FROM despesas d
            LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
            ${whereString}
        `;
        const totalResult = await pool.query(countQuery, params);
        const totalItens = parseInt(totalResult.rows[0].count, 10);
        const totalPaginas = Math.ceil(totalItens / limite);

        const despesasQuery = `
            SELECT 
                d.*, 
                f.nome as nome_fornecedor 
            FROM despesas d
            LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
            ${whereString}
            ORDER BY d.data_criacao DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        
        const despesasResult = await pool.query(despesasQuery, [...params, limite, offset]);

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

const quitarDespesa = async (req, res) => {
    const { id } = req.params;
    const { data_pagamento, responsavel_pagamento_id, valor_pago } = req.body;
    const userIdFromToken = req.user.id;

    if (!data_pagamento || valor_pago === undefined || valor_pago <= 0) {
        return res.status(400).json({ error: 'Data de pagamento e um valor pago válido são obrigatórios.' });
    }
    
    const responsavelId = responsavel_pagamento_id || userIdFromToken;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const despesaOriginalResult = await client.query(
            'SELECT * FROM despesas WHERE id = $1 AND data_pagamento IS NULL FOR UPDATE', 
            [id]
        );

        if (despesaOriginalResult.rowCount === 0) {
            throw new Error('Despesa não encontrada ou já quitada.');
        }

        const despesaOriginal = despesaOriginalResult.rows[0];
        const valorPagoNumerico = parseFloat(valor_pago);

        if (valorPagoNumerico > despesaOriginal.valor) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `O valor a pagar (R$ ${valorPagoNumerico.toFixed(2)}) não pode ser maior que o saldo devedor (R$ ${despesaOriginal.valor.toFixed(2)}).` });
        }

        const valorRestante = despesaOriginal.valor - valorPagoNumerico;

        if (valorRestante <= 0.009) { // Usar uma pequena margem para evitar problemas com ponto flutuante
            const despesaQuitada = await client.query(
                `UPDATE despesas 
                 SET data_pagamento = $1, responsavel_pagamento_id = $2, valor = $3
                 WHERE id = $4
                 RETURNING *`,
                [data_pagamento, responsavelId, despesaOriginal.valor, id]
            );
            await client.query('COMMIT');
            return res.status(200).json(despesaQuitada.rows[0]);

        } else {
            await client.query(
                'UPDATE despesas SET valor = $1 WHERE id = $2',
                [valorRestante, id]
            );

            const novaDespesaQuitada = await client.query(
                `INSERT INTO despesas (tipo_saida, valor, discriminacao, data_compra, data_vencimento, data_pagamento, fornecedor_id, responsavel_pagamento_id, despesa_pai_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    despesaOriginal.tipo_saida,
                    valorPagoNumerico,
                    `PAGAMENTO PARCIAL - REF. DESPESA #${id} - ${despesaOriginal.discriminacao}`,
                    despesaOriginal.data_compra,
                    despesaOriginal.data_vencimento,
                    data_pagamento,
                    despesaOriginal.fornecedor_id,
                    responsavelId,
                    id
                ]
            );
            
            await client.query('COMMIT');
            return res.status(200).json(novaDespesaQuitada.rows[0]);
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao quitar despesa:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};

const getDespesasAPagar = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.id,
                d.valor,
                d.data_vencimento,
                f.nome as nome_fornecedor
            FROM despesas d
            LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
            WHERE d.data_pagamento IS NULL
            ORDER BY d.data_vencimento ASC;
        `;
        
        const resultado = await pool.query(query);
        res.status(200).json(resultado.rows);

    } catch (error) {
        console.error('Erro ao buscar contas a pagar:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const updateDespesa = async (req, res) => {
    const { id } = req.params;
    const { tipo_saida, valor, discriminacao, data_vencimento, data_compra, fornecedor_id } = req.body;

    if (!tipo_saida || !valor || !discriminacao || !data_vencimento || !data_compra) {
        return res.status(400).json({ error: 'Campos obrigatórios: tipo, valor, discriminação, data da compra e vencimento.' });
    }

    const data_pagamento = data_compra === data_vencimento ? data_compra : null;

    try {
        const despesaAtualizada = await pool.query(
            `UPDATE despesas 
             SET tipo_saida = $1, valor = $2, discriminacao = $3, data_vencimento = $4, data_compra = $5, fornecedor_id = $6, data_pagamento = $7
             WHERE id = $8 RETURNING *`,
            [tipo_saida, valor, discriminacao.trim().toUpperCase(), data_vencimento, data_compra, fornecedor_id, data_pagamento, id]
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

const deleteDespesa = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const despesaParaDeletarResult = await client.query('SELECT * FROM despesas WHERE id = $1', [id]);

        if (despesaParaDeletarResult.rowCount === 0) {
            throw new Error('Despesa não encontrada.');
        }

        const despesaParaDeletar = despesaParaDeletarResult.rows[0];

        if (despesaParaDeletar.despesa_pai_id) {
            await client.query(
                `UPDATE despesas 
                 SET valor = valor + $1 
                 WHERE id = $2`,
                [despesaParaDeletar.valor, despesaParaDeletar.despesa_pai_id]
            );
        }

        await client.query('DELETE FROM despesas WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.status(204).send();

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar despesa:', error);
        if (error.code === '23503') { // Checagem de chave estrangeira
            return res.status(400).json({ error: 'Não é possível excluir esta despesa, pois ela é referência para um pagamento parcial. Exclua o pagamento primeiro.' });
        }
        res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    } finally {
        client.release();
    }
};


module.exports = {
    registrarDespesa,
    getDespesas,
    quitarDespesa,
    getDespesasAPagar,
    updateDespesa,
    deleteDespesa,
    quitarDespesa,
};
